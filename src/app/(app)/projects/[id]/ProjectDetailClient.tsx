"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type {
  Document,
  DocumentCategory,
  Profile,
  Project,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./ProjectDetailClient.module.css";

interface TaskRow extends Task {
  assigneeName: string;
  completed: boolean;
}

interface DocumentRow extends Document {
  addedByName: string;
}

interface ProjectDetailClientProps {
  project: Project;
  tasks: Task[];
  documents: Document[];
  profiles: Profile[];
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function priorityClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.priorityUrgent;
  if (priority === "high") return styles.priorityHigh;
  if (priority === "medium") return styles.priorityMedium;
  return styles.priorityLow;
}

function statusClass(status: TaskStatus) {
  if (status === "done") return styles.statusDone;
  if (status === "in_progress") return styles.statusInProgress;
  return styles.statusNotStarted;
}

function categoryLabel(category: DocumentCategory) {
  return formatEnumLabel(category);
}

export function ProjectDetailClient({
  project,
  tasks,
  documents,
  profiles,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(project.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");
  const [savedDescription, setSavedDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [category, setCategory] = useState(project.category ?? "");
  const [savedCategory, setSavedCategory] = useState(project.category ?? "");
  const [deleting, setDeleting] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  useEffect(() => {
    setName(project.name);
    setIsEditingName(false);
    setDescription(project.description ?? "");
    setSavedDescription(project.description ?? "");
    setStatus(project.status);
    setCategory(project.category ?? "");
    setSavedCategory(project.category ?? "");
  }, [project]);

  async function updateProject(patch: Partial<Project>) {
    await supabase.from("projects").update(patch).eq("id", project.id);
  }

  const profileById = useMemo(() => {
    const entries = profiles.map((profile) => [profile.id, profile] as const);
    return new Map(entries);
  }, [profiles]);

  const taskRows = useMemo<TaskRow[]>(() => {
    return tasks.map((task) => {
      const assignee = task.assignee_id ? profileById.get(task.assignee_id) : null;
      return {
        ...task,
        assigneeName:
          assignee?.display_name ?? assignee?.email ?? "Unassigned",
        completed: task.status === "done",
      };
    });
  }, [profileById, tasks]);

  const filteredTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    if (!query) return taskRows;
    return taskRows.filter((task) => task.title.toLowerCase().includes(query));
  }, [taskRows, taskSearch]);

  const documentRows = useMemo<DocumentRow[]>(() => {
    return documents.map((document) => {
      const addedBy = profileById.get(document.added_by);
      return {
        ...document,
        addedByName: addedBy?.display_name ?? addedBy?.email ?? "Unknown",
      };
    });
  }, [documents, profileById]);

  const filteredDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    if (!query) return documentRows;
    return documentRows.filter((document) =>
      document.name.toLowerCase().includes(query),
    );
  }, [documentRows, documentSearch]);

  const taskColumns: DataTableColumn<TaskRow>[] = [
    {
      key: "complete",
      label: "",
      getValue: (row) => row.completed,
      render: (row) => (
        <input
          type="checkbox"
          checked={row.completed}
          readOnly
          onClick={(event) => event.stopPropagation()}
          aria-label={`Mark ${row.title} complete`}
        />
      ),
    },
    {
      key: "task",
      label: "Task",
      getValue: (row) => row.title,
      sortable: true,
      filterable: true,
      render: (row) => (
        <Link
          href={
            project.id && project.name
              ? `/tasks/${row.id}?projectId=${project.id}&projectName=${encodeURIComponent(
                  project.name,
                )}`
              : `/tasks/${row.id}`
          }
          className={`${styles.itemLink} ${row.completed ? styles.completedText : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: "assignee",
      label: "Assignee",
      getValue: (row) => row.assigneeName,
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className={styles.avatarCell}>
          <span className={styles.avatar}>{initials(row.assigneeName)}</span>
          <span>{row.assigneeName}</span>
        </span>
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
      key: "due_date",
      label: "Due Date",
      getValue: (row) => row.due_date ?? "",
      sortable: true,
      filterable: false,
      sortLabels: {
        asc: "Oldest first",
        desc: "Newest first",
      },
      render: (row) => formatDate(row.due_date),
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
  ];

  const documentColumns: DataTableColumn<DocumentRow>[] = [
    {
      key: "name",
      label: "Document",
      getValue: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row) => (
        <a
          href={row.url ?? "#"}
          className={styles.itemLink}
          onClick={(event) => event.stopPropagation()}
        >
          {row.name}
        </a>
      ),
    },
    {
      key: "category",
      label: "Category",
      getValue: (row) => row.category,
      sortable: true,
      filterable: true,
      render: (row) => <span className={styles.categoryBadge}>{categoryLabel(row.category)}</span>,
    },
    {
      key: "created_at",
      label: "Date Added",
      getValue: (row) => row.created_at,
      sortable: true,
      sortLabels: {
        asc: "Oldest first",
        desc: "Newest first",
      },
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "added_by",
      label: "Added By",
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
    <div className={styles.sections}>
      <section className={styles.projectHeader}>
        {isEditingName ? (
          <input
            className={styles.projectTitleInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={async () => {
              setIsEditingName(false);
              const trimmed = name.trim();
              if (trimmed && trimmed !== project.name) {
                await updateProject({ name: trimmed });
              }
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                setIsEditingName(false);
                const trimmed = name.trim();
                if (trimmed && trimmed !== project.name) {
                  await updateProject({ name: trimmed });
                }
              }
            }}
            autoFocus
          />
        ) : (
          <h1 className={styles.projectTitle} onClick={() => setIsEditingName(true)}>
            {name}
          </h1>
        )}

        <div className={`hm-card ${styles.projectMeta}`}>
          <div className={styles.metaItemWide}>
            <label className={styles.metaLabel} htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              className={styles.metaTextarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={async () => {
                if (description !== savedDescription) {
                  await updateProject({ description: description || null });
                  setSavedDescription(description);
                }
              }}
            />
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <label className={styles.metaLabel} htmlFor="project-status">
                Status
              </label>
              <select
                id="project-status"
                className={styles.metaControl}
                value={status}
                onChange={async (event) => {
                  const value = event.target.value as ProjectStatus;
                  setStatus(value);
                  await updateProject({ status: value });
                }}
              >
                <option value="active">{formatEnumLabel("active")}</option>
                <option value="inactive">{formatEnumLabel("inactive")}</option>
                <option value="archived">{formatEnumLabel("archived")}</option>
              </select>
            </div>

            <div className={styles.metaItem}>
              <label className={styles.metaLabel} htmlFor="project-category">
                Category
              </label>
              <input
                id="project-category"
                className={styles.metaControl}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                onBlur={async () => {
                  if (category !== savedCategory) {
                    await updateProject({ category: category || null });
                    setSavedCategory(category);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`hm-btn-text ${styles.deleteButton}`}
          onClick={async () => {
            const confirmed = window.confirm(
              "Delete this project? This action cannot be undone.",
            );
            if (!confirmed) return;
            setDeleting(true);
            await supabase.from("projects").delete().eq("id", project.id);
            router.push("/projects");
          }}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete project"}
        </button>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tasks</h2>
          <div className={styles.controls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search tasks"
              value={taskSearch}
              onChange={(event) => setTaskSearch(event.target.value)}
            />
            <Link
              href={`/tasks/new?project=${project.id}`}
              className={`hm-btn-primary ${styles.addButton}`}
            >
              + Add task
            </Link>
          </div>
        </div>

        <DataTable
          columns={taskColumns}
          data={filteredTasks}
          rowKey={(row) => row.id}
          onRowClick={(row) =>
            router.push(
              project.id && project.name
                ? `/tasks/${row.id}?projectId=${project.id}&projectName=${encodeURIComponent(
                    project.name,
                  )}`
                : `/tasks/${row.id}`,
            )
          }
          getRowOrder={(row) => (row.completed ? 1 : 0)}
          getRowClassName={(row) => (row.completed ? styles.completedRow : "")}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Documents</h2>
          <div className={styles.controls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search documents"
              value={documentSearch}
              onChange={(event) => setDocumentSearch(event.target.value)}
            />
            <Link
              href={`/documents/new?project=${project.id}`}
              className={`hm-btn-primary ${styles.addButton}`}
            >
              + Add doc
            </Link>
          </div>
        </div>

        <DataTable
          columns={documentColumns}
          data={filteredDocuments}
          rowKey={(row) => row.id}
        />
      </section>
    </div>
  );
}
