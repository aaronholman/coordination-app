"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type {
  Profile,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./TasksClientView.module.css";

interface TaskRow extends Task {
  projectName: string;
  assigneeName: string;
  completed: boolean;
}

interface TasksClientViewProps {
  tasks: Task[];
  projects: Project[];
  profiles: Profile[];
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
}

function statusClass(status: TaskStatus) {
  if (status === "done") return styles.statusDone;
  if (status === "in_progress") return styles.statusInProgress;
  return styles.statusNotStarted;
}

function priorityClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.priorityUrgent;
  if (priority === "high") return styles.priorityHigh;
  if (priority === "medium") return styles.priorityMedium;
  return styles.priorityLow;
}

export function TasksClientView({ tasks, projects, profiles }: TasksClientViewProps) {
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

  const taskRows = useMemo<TaskRow[]>(() => {
    return tasks.map((task) => {
      const projectName = task.project_id
        ? (projectById.get(task.project_id)?.name ?? "No project")
        : "No project";
      const assignee = task.assignee_id ? profileById.get(task.assignee_id) : null;
      const assigneeName = assignee?.display_name ?? assignee?.email ?? "Unassigned";

      return {
        ...task,
        projectName,
        assigneeName,
        completed: task.status === "done",
      };
    });
  }, [profileById, projectById, tasks]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return taskRows;
    return taskRows.filter((task) => task.title.toLowerCase().includes(query));
  }, [search, taskRows]);

  const columns: DataTableColumn<TaskRow>[] = [
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
          href={`/tasks/${row.id}`}
          className={`${styles.taskLink} ${row.completed ? styles.completedText : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          {row.title}
        </Link>
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

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tasks"
        action={
          <div className={styles.headerControls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link href="/tasks/new" className={`hm-btn-primary ${styles.newButton}`}>
              + New task
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/tasks/${row.id}`)}
        getRowOrder={(row) => (row.completed ? 1 : 0)}
        getRowClassName={(row) => (row.completed ? styles.completedRow : "")}
      />
    </div>
  );
}
