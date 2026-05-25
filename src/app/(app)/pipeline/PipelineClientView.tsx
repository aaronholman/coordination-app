"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FilterPills, type FilterOption } from "@/components/ui/FilterPills";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type {
  Feature,
  FeatureComplexity,
  FeatureStatus,
  Profile,
  TaskPriority,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import { KanbanBoard } from "./KanbanBoard";
import styles from "./PipelineClientView.module.css";

interface PipelineClientViewProps {
  features: Feature[];
  profiles: Profile[];
}

type PipelineFilter = "all" | FeatureStatus;
const featureStatuses: FeatureStatus[] = ["idea", "speccing", "building", "deployed"];
const filterOptions: FilterOption<PipelineFilter>[] = [
  { value: "all", label: "All" },
  { value: "idea", label: "Idea" },
  { value: "speccing", label: "Speccing" },
  { value: "building", label: "Building" },
  { value: "deployed", label: "Deployed" },
];

function statusClass(status: FeatureStatus) {
  if (status === "idea") return styles.statusIdea;
  if (status === "speccing") return styles.statusSpeccing;
  if (status === "building") return styles.statusBuilding;
  return styles.statusDeployed;
}

function priorityClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.priorityUrgent;
  if (priority === "high") return styles.priorityHigh;
  if (priority === "medium") return styles.priorityMedium;
  return styles.priorityLow;
}

function complexityLabel(complexity: FeatureComplexity) {
  if (complexity === "small") return "S";
  if (complexity === "medium") return "M";
  return "L";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function PipelineClientView({ features, profiles }: PipelineClientViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [activeStatusFilters, setActiveStatusFilters] = useState<FeatureStatus[]>([
    "idea",
    "speccing",
    "building",
  ]);

  function handleStatusFilterToggle(value: PipelineFilter) {
    if (value === "all") {
      setActiveStatusFilters(featureStatuses);
      return;
    }

    setActiveStatusFilters((current) => {
      if (current.includes(value)) {
        const next = current.filter((status) => status !== value);
        return next.length > 0 ? next : ["idea", "speccing", "building"];
      }
      return [...current, value];
    });
  }

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();
    const statusFiltered = features.filter((feature) =>
      activeStatusFilters.includes(feature.status),
    );
    if (!query) return statusFiltered;
    return statusFiltered.filter(
      (feature) =>
        feature.title.toLowerCase().includes(query) ||
        (feature.target_module ?? "").toLowerCase().includes(query),
    );
  }, [activeStatusFilters, features, search]);

  const columns: DataTableColumn<Feature>[] = [
    {
      key: "title",
      label: "Feature",
      getValue: (row) => row.title,
      sortable: true,
      filterable: true,
      render: (row) => (
        <Link
          href={`/pipeline/${row.id}`}
          className={styles.featureLink}
          onClick={(event) => event.stopPropagation()}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: "status",
      label: "Status",
      getValue: (row) => formatEnumLabel(row.status),
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.statusCell}>
          <span className={`${styles.statusDot} ${statusClass(row.status)}`} />
          <span>{formatEnumLabel(row.status)}</span>
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      getValue: (row) => formatEnumLabel(row.priority),
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.priorityCell}>
          <span className={`${styles.priorityDot} ${priorityClass(row.priority)}`} />
          <span>{formatEnumLabel(row.priority)}</span>
        </span>
      ),
    },
    {
      key: "module",
      label: "Module",
      getValue: (row) => row.target_module ? formatEnumLabel(row.target_module) : "—",
      sortable: true,
      filterable: true,
      render: (row) =>
        row.target_module ? (
          <span className={styles.moduleTag}>{formatEnumLabel(row.target_module)}</span>
        ) : (
          <span className={styles.mutedText}>—</span>
        ),
    },
    {
      key: "complexity",
      label: "Size",
      getValue: (row) => formatEnumLabel(row.complexity),
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.complexityBadge}>
          {complexityLabel(row.complexity)}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "Updated",
      getValue: (row) => row.updated_at,
      sortable: true,
      sortLabels: {
        asc: "Oldest first",
        desc: "Newest first",
      },
      render: (row) => (
        <span className={styles.mutedText}>{formatDate(row.updated_at)}</span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            className={`hm-input ${styles.searchInput}`}
            placeholder="Search features"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${viewMode === "list" ? styles.toggleActive : ""}`}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${viewMode === "board" ? styles.toggleActive : ""}`}
            onClick={() => setViewMode("board")}
          >
            Board
          </button>
        </div>
      </div>

      <FilterPills
        options={filterOptions}
        activeValues={
          activeStatusFilters.length === featureStatuses.length
            ? (["all", ...featureStatuses] as PipelineFilter[])
            : (activeStatusFilters as PipelineFilter[])
        }
        onToggle={handleStatusFilterToggle}
      />

      {viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={filteredFeatures}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/pipeline/${row.id}`)}
        />
      ) : (
        <KanbanBoard
          features={filteredFeatures}
          profiles={profileById}
        />
      )}
    </div>
  );
}
