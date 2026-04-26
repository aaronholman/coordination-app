"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FilterPills, type FilterOption } from "@/components/ui/FilterPills";
import type { Project, ProjectStatus } from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./ProjectsClientView.module.css";

type ProjectFilter = "all" | ProjectStatus;

const filterOptions: FilterOption<ProjectFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: formatEnumLabel("active") },
  { value: "inactive", label: formatEnumLabel("inactive") },
  { value: "archived", label: formatEnumLabel("archived") },
];

interface ProjectsClientViewProps {
  projects: Project[];
}

function statusClass(status: ProjectStatus) {
  if (status === "active") {
    return styles.statusDotActive;
  }

  if (status === "inactive") {
    return styles.statusDotInactive;
  }

  return styles.statusDotArchived;
}

export function ProjectsClientView({ projects }: ProjectsClientViewProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");

  const filteredProjects = useMemo(() => {
    if (activeFilter === "all") {
      return projects;
    }

    return projects.filter((project) => project.status === activeFilter);
  }, [activeFilter, projects]);

  return (
    <section className={styles.section}>
      <FilterPills
        options={filterOptions}
        activeValue={activeFilter}
        onChange={setActiveFilter}
      />

      <div className={styles.grid}>
        {filteredProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className={`${styles.card} hm-card`}>
            <h2 className={styles.projectName}>{project.name}</h2>

            <p className={styles.description}>
              {project.description ?? "No description yet."}
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
