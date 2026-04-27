"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MultiSelect } from "@/components/ui/MultiSelect";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type {
  Document,
  Profile,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./TaskDetailClient.module.css";

interface LinkedDocument extends Document {
  task_document_created_at: string;
}

interface TaskDetailClientProps {
  task: Task;
  projects: Project[];
  profiles: Profile[];
  linkedDocuments: LinkedDocument[];
  availableDocuments: Document[];
  backLinkHref: string;
  backLinkLabel: string;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: formatEnumLabel("not_started") },
  { value: "active", label: formatEnumLabel("active") },
  { value: "inactive", label: formatEnumLabel("inactive") },
  { value: "done", label: formatEnumLabel("done") },
  { value: "archived", label: formatEnumLabel("archived") },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: formatEnumLabel("low") },
  { value: "medium", label: formatEnumLabel("medium") },
  { value: "high", label: formatEnumLabel("high") },
  { value: "urgent", label: formatEnumLabel("urgent") },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function priorityDotClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.dotUrgent;
  if (priority === "high") return styles.dotHigh;
  if (priority === "medium") return styles.dotMedium;
  return styles.dotLow;
}

export function TaskDetailClient({
  task,
  projects,
  profiles,
  linkedDocuments,
  availableDocuments,
  backLinkHref,
  backLinkLabel,
}: TaskDetailClientProps) {
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignee_ids && task.assignee_ids.length > 0
      ? task.assignee_ids
      : task.assignee_id
        ? [task.assignee_id]
        : [],
  );
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(toDateInput(task.due_date));
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [description, setDescription] = useState(task.description ?? "");
  const [savedDescription, setSavedDescription] = useState(task.description ?? "");
  const [docs, setDocs] = useState<LinkedDocument[]>(linkedDocuments);
  const [documentSearch, setDocumentSearch] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function updateTask(patch: Partial<Task>) {
    await supabase.from("tasks").update(patch).eq("id", task.id);
  }

  useEffect(() => {
    setTitle(task.title);
    setIsEditingTitle(false);
    setProjectId(task.project_id ?? "");
    setAssigneeIds(
      task.assignee_ids && task.assignee_ids.length > 0
        ? task.assignee_ids
        : task.assignee_id
          ? [task.assignee_id]
          : [],
    );
    setStatus(task.status);
    setDueDate(toDateInput(task.due_date));
    setPriority(task.priority);
    setDescription(task.description ?? "");
    setSavedDescription(task.description ?? "");
    setDocs(linkedDocuments);
  }, [linkedDocuments, task]);

  const linkedDocIds = useMemo(() => new Set(docs.map((doc) => doc.id)), [docs]);

  const searchableDocs = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    return availableDocuments
      .filter((doc) => !linkedDocIds.has(doc.id))
      .filter((doc) =>
        query.length === 0 ? true : doc.name.toLowerCase().includes(query),
      );
  }, [availableDocuments, documentSearch, linkedDocIds]);

  async function handleLinkDocument() {
    if (!selectedDocId) return;

    const existing = docs.find((doc) => doc.id === selectedDocId);
    if (existing) return;

    const doc = availableDocuments.find((item) => item.id === selectedDocId);
    if (!doc) return;

    const { error } = await supabase.from("task_documents").insert({
      task_id: task.id,
      document_id: selectedDocId,
    });

    if (error) return;

    setDocs((current) => [
      ...current,
      { ...doc, task_document_created_at: new Date().toISOString() },
    ]);
    setSelectedDocId("");
    setDocumentSearch("");
    setDropdownOpen(false);
  }

  async function handleRemoveDocument(documentId: string) {
    const { error } = await supabase
      .from("task_documents")
      .delete()
      .eq("task_id", task.id)
      .eq("document_id", documentId);

    if (error) return;
    setDocs((current) => current.filter((doc) => doc.id !== documentId));
  }

  return (
    <div className={styles.page}>
      <Link href={backLinkHref} className={styles.backLink}>
        {"\u2190"} {backLinkLabel}
      </Link>

      <div className={styles.titleWrap}>
        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={async () => {
              setIsEditingTitle(false);
              if (title.trim() !== task.title) {
                await updateTask({ title: title.trim() });
              }
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                setIsEditingTitle(false);
                if (title.trim() !== task.title) {
                  await updateTask({ title: title.trim() });
                }
              }
            }}
            autoFocus
          />
        ) : (
          <h1 className={styles.title} onClick={() => setIsEditingTitle(true)}>
            {title}
          </h1>
        )}
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Project</p>
          <select
            className={styles.metaControl}
            value={projectId}
            onChange={async (event) => {
              const value = event.target.value;
              setProjectId(value);
              await updateTask({ project_id: value || null });
            }}
          >
            <option value="">No project</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Assignee</p>
          <MultiSelect
            options={profiles.map((item) => ({
              value: item.id,
              label: item.display_name ?? item.email,
            }))}
            selected={assigneeIds}
            onChange={(nextAssigneeIds) => {
              setAssigneeIds(nextAssigneeIds);
              void updateTask({
                assignee_id: nextAssigneeIds[0] ?? null,
                assignee_ids: nextAssigneeIds.length > 0 ? nextAssigneeIds : null,
              });
            }}
            placeholder="Select assignees"
          />
        </div>

        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Status</p>
          <select
            className={styles.metaControl}
            value={status}
            onChange={async (event) => {
              const value = event.target.value as TaskStatus;
              setStatus(value);
              await updateTask({
                status: value,
                completed_at: value === "done" ? new Date().toISOString() : null,
              });
            }}
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Due Date</p>
          <input
            type="date"
            className={styles.metaControl}
            value={dueDate}
            onChange={async (event) => {
              const value = event.target.value;
              setDueDate(value);
              await updateTask({ due_date: value || null });
            }}
          />
        </div>

        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Priority</p>
          <label className={`${styles.metaControl} ${styles.priorityControl}`}>
            <span className={`${styles.priorityDot} ${priorityDotClass(priority)}`} />
            <select
              className={styles.prioritySelect}
              value={priority}
              onChange={async (event) => {
                const value = event.target.value as TaskPriority;
                setPriority(value);
                await updateTask({ priority: value });
              }}
            >
              {priorityOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>Created</p>
          <p className={styles.metaValue}>{formatDate(task.created_at)}</p>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Linked documents</h3>

        {docs.length > 0 ? (
          <ul className={styles.docList}>
            {docs.map((doc) => (
              <li key={doc.id} className={styles.docItem}>
                <a href={doc.url ?? "/documents"} className={styles.docLink}>
                  {doc.name}
                </a>
                <span className={styles.docCategory}>{formatEnumLabel(doc.category)}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveDocument(doc.id)}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>No linked documents yet.</p>
        )}

        <div className={styles.linkControls}>
          <div className={styles.searchWrap}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Find documents"
              value={documentSearch}
              onChange={(event) => {
                setDocumentSearch(event.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />

            {dropdownOpen && searchableDocs.length > 0 ? (
              <div className={styles.searchDropdown}>
                {searchableDocs.slice(0, 8).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={styles.searchOption}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setDocumentSearch(doc.name);
                      setDropdownOpen(false);
                    }}
                  >
                    <span>{doc.name}</span>
                    <span className={styles.optionCategory}>{formatEnumLabel(doc.category)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`hm-btn-primary ${styles.addDocButton}`}
            onClick={handleLinkDocument}
            disabled={!selectedDocId}
          >
            + Add doc
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Details</h3>
        <RichTextEditor
          initialContent={description}
          placeholder="Add task details..."
          onSave={async (nextDescription) => {
            setDescription(nextDescription);
            if (nextDescription !== savedDescription) {
              await updateTask({ description: nextDescription || null });
              setSavedDescription(nextDescription);
            }
          }}
        />
      </section>
    </div>
  );
}
