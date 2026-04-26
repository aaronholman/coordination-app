"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type { Document, Profile, Project } from "@/lib/types/database";

import styles from "./DocumentsClientView.module.css";

interface DocumentRow extends Document {
  projectName: string;
  addedByName: string;
}

interface DocumentsClientViewProps {
  documents: Document[];
  projects: Project[];
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

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function DocumentsClientView({
  documents,
  projects,
  profiles,
}: DocumentsClientViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  const rows = useMemo<DocumentRow[]>(
    () =>
      documents.map((document) => {
        const project = document.project_id
          ? projectById.get(document.project_id)
          : null;
        const addedBy = profileById.get(document.added_by);
        return {
          ...document,
          projectName: project?.name ?? "No project",
          addedByName: addedBy?.display_name ?? addedBy?.email ?? "Unknown",
        };
      }),
    [documents, profileById, projectById],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((document) => document.name.toLowerCase().includes(query));
  }, [rows, search]);

  const columns: DataTableColumn<DocumentRow>[] = [
    {
      key: "document",
      label: "Document",
      getValue: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row) => (
        <button
          type="button"
          className={styles.documentButton}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "project",
      label: "Project",
      getValue: (row) => row.projectName,
      sortable: true,
      filterable: true,
    },
    {
      key: "category",
      label: "Category",
      getValue: (row) => row.category,
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.categoryBadge}>{categoryLabel(row.category)}</span>
      ),
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
        title="Documents"
        action={
          <div className={styles.headerControls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search documents"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link href="/documents/new" className={`hm-btn-primary ${styles.newButton}`}>
              + New doc
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/documents/${row.id}`)}
      />
    </div>
  );
}
