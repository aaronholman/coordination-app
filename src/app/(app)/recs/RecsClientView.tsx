"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type { Profile, Recommendation } from "@/lib/types/database";

import styles from "./RecsClientView.module.css";

interface RecommendationRow extends Recommendation {
  addedByName: string;
}

interface RecsClientViewProps {
  recommendations: Recommendation[];
  profiles: Profile[];
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function typeClass(value: Recommendation["type"]) {
  if (value === "show") return styles.typeShow;
  if (value === "movie") return styles.typeMovie;
  if (value === "podcast") return styles.typePodcast;
  return styles.typeBook;
}

function statusClass(value: Recommendation["status"]) {
  if (value === "watching") return styles.statusWatching;
  if (value === "watched") return styles.statusWatched;
  return styles.statusNotYet;
}

function statusLabel(value: Recommendation["status"]) {
  if (value === "not_yet") return "Not yet";
  if (value === "watching") return "Watching";
  return "Watched";
}

export function RecsClientView({ recommendations, profiles }: RecsClientViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  const rows = useMemo<RecommendationRow[]>(
    () =>
      recommendations.map((recommendation) => {
        const addedBy = profileById.get(recommendation.added_by);
        return {
          ...recommendation,
          addedByName: addedBy?.display_name ?? addedBy?.email ?? "Unknown",
        };
      }),
    [profileById, recommendations],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((item) => item.title.toLowerCase().includes(query));
  }, [rows, search]);

  const columns: DataTableColumn<RecommendationRow>[] = [
    {
      key: "title",
      label: "Title",
      getValue: (row) => row.title,
      sortable: true,
      filterable: true,
      render: (row) => <span className={styles.titleCell}>{row.title}</span>,
    },
    {
      key: "type",
      label: "Type",
      getValue: (row) => row.type,
      sortable: true,
      filterable: true,
      render: (row) => <span className={`${styles.pill} ${typeClass(row.type)}`}>{row.type}</span>,
    },
    {
      key: "status",
      label: "Status",
      getValue: (row) => statusLabel(row.status),
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={`${styles.pill} ${statusClass(row.status)}`}>
          {statusLabel(row.status)}
        </span>
      ),
    },
    {
      key: "recommended_by",
      label: "Rec'd by",
      getValue: (row) => row.recommended_by ?? "",
      sortable: true,
      filterable: true,
      render: (row) => row.recommended_by ?? "\u2014",
    },
    {
      key: "added",
      label: "Added",
      getValue: (row) => row.created_at,
      sortable: true,
      sortLabels: {
        asc: "Oldest first",
        desc: "Newest first",
      },
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "by",
      label: "By",
      getValue: (row) => row.addedByName,
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.avatarCell}>
          <span className={styles.avatar}>{initials(row.addedByName)}</span>
          <span>{row.addedByName}</span>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Recommendations"
        action={
          <div className={styles.headerControls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search recommendations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link href="/recs/new" className={`hm-btn-primary ${styles.newButton}`}>
              + New rec
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/recs/${row.id}`)}
      />
    </div>
  );
}
