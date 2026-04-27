"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FilterPills, type FilterOption } from "@/components/ui/FilterPills";
import type { Project, ProjectStatus } from "@/lib/types/database";
import { formatEnumLabel, getPlainTextPreview } from "@/lib/utils/formatting";

import styles from "./ProjectsClientView.module.css";

type ProjectFilter = "all" | ProjectStatus;
const projectStatuses: ProjectStatus[] = ["not_started", "active", "inactive", "done", "archived"];

const filterOptions: FilterOption<ProjectFilter>[] = [
  { value: "all", label: "All" },
  { value: "not_started", label: formatEnumLabel("not_started") },
  { value: "active", label: formatEnumLabel("active") },
  { value: "inactive", label: formatEnumLabel("inactive") },
  { value: "done", label: formatEnumLabel("done") },
  { value: "archived", label: formatEnumLabel("archived") },
];

interface ProjectsClientViewProps {
  projects: Project[];
}

function statusClass(status: ProjectStatus) {
  if (status === "not_started") {
    return styles.statusDotNotStarted;
  }

  if (status === "active") {
    return styles.statusDotActive;
  }

  if (status === "inactive") {
    return styles.statusDotInactive;
  }

  if (status === "done") {
    return styles.statusDotDone;
  }

  return styles.statusDotArchived;
}

export function ProjectsClientView({ projects }: ProjectsClientViewProps) {
  const [activeFilters, setActiveFilters] = useState<ProjectStatus[]>(["not_started", "active"]);

  function handleFilterToggle(value: ProjectFilter) {
    if (value === "all") {
      setActiveFilters(projectStatuses);
      return;
    }

    setActiveFilters((current) => {
      if (current.includes(value)) {
        const next = current.filter((status) => status !== value);
        return next.length > 0 ? next : ["not_started", "active"];
      }
      return [...current, value];
    });
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => activeFilters.includes(project.status));
  }, [activeFilters, projects]);

  return (
    <section className={styles.section}>
      <FilterPills
        options={filterOptions}
        activeValues={
          activeFilters.length === projectStatuses.length
            ? (["all", ...projectStatuses] as ProjectFilter[])
            : (activeFilters as ProjectFilter[])
        }
        onToggle={handleFilterToggle}
      />

      <div className={styles.grid}>
        {filteredProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className={`${styles.card} hm-card`}>
            <h2 className={styles.projectName}>{project.name}</h2>

            <p className={styles.description}>
              {getPlainTextPreview(project.description, 100) || "No description yet."}
            </p>

            <div className={styles.cardFooter}>
              <span className={styles.categoryTag}>
                {project.category ? formatEnumLabel(project.category) : "Uncategorized"}
              </span>
              <span className={styles.statusWrap}>
                <span className={`${styles.statusDot} ${statusClass(project.status)}`} />
                <span className={styles.statusLabel}>{formatEnumLabel(project.status)}</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
