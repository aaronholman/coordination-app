"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type {
  Feature,
  FeatureComplexity,
  FeatureNote,
  FeatureStatus,
  Profile,
  TaskPriority,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./FeatureDetailClient.module.css";

interface FeatureDetailClientProps {
  feature: Feature;
  notes: FeatureNote[];
  profiles: Profile[];
}

const statusOptions: FeatureStatus[] = ["idea", "speccing", "building", "deployed"];
const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];
const complexityOptions: FeatureComplexity[] = ["small", "medium", "large"];
const moduleOptions = [
  "",
  "dashboard",
  "projects",
  "tasks",
  "grocery",
  "documents",
  "recipes",
  "recs",
  "settings",
  "pipeline",
  "global",
  "mobile",
  "auth",
];

function statusClass(status: FeatureStatus) {
  if (status === "idea") return styles.statusIdea;
  if (status === "speccing") return styles.statusSpeccing;
  if (status === "building") return styles.statusBuilding;
  return styles.statusDeployed;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export function FeatureDetailClient({
  feature: initialFeature,
  notes: initialNotes,
  profiles,
}: FeatureDetailClientProps) {
  const supabase = useMemo(() => createClient(), []);

  const [feature, setFeature] = useState(initialFeature);
  const [notes, setNotes] = useState(initialNotes);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  async function updateField(updates: Partial<Feature>) {
    setFeature((current) => ({ ...current, ...updates }));
    await supabase.from("features").update(updates).eq("id", feature.id);
  }

  async function saveDescription(content: string) {
    await updateField({ description: content || null });
  }

  async function addNote() {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;

    setSavingNote(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingNote(false);
      return;
    }

    const { data } = await supabase
      .from("feature_notes")
      .insert({
        tenant_id: feature.tenant_id,
        feature_id: feature.id,
        author_id: user.id,
        content: trimmed,
      })
      .select("*")
      .single<FeatureNote>();

    if (data) {
      setNotes((current) => [...current, data]);
      setNoteDraft("");
    }
    setSavingNote(false);
  }

  return (
    <div className={styles.page}>
      <Link href="/pipeline" className={styles.backLink}>
        &larr; Pipeline
      </Link>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={`${styles.statusIndicator} ${statusClass(feature.status)}`} />
          <input
            className={styles.titleInput}
            value={feature.title}
            onChange={(event) => setFeature((current) => ({ ...current, title: event.target.value }))}
            onBlur={() => void updateField({ title: feature.title })}
          />
        </div>
      </div>

      <div className={`hm-card ${styles.metaCard}`}>
        <div className={styles.metaGrid}>
          <div className={styles.metaField}>
            <span className={styles.metaLabel}>Status</span>
            <select
              className={styles.metaSelect}
              value={feature.status}
              onChange={(event) => void updateField({ status: event.target.value as FeatureStatus })}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaField}>
            <span className={styles.metaLabel}>Priority</span>
            <select
              className={styles.metaSelect}
              value={feature.priority}
              onChange={(event) =>
                void updateField({ priority: event.target.value as TaskPriority })
              }
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaField}>
            <span className={styles.metaLabel}>Module</span>
            <select
              className={styles.metaSelect}
              value={feature.target_module ?? ""}
              onChange={(event) =>
                void updateField({ target_module: event.target.value || null })
              }
            >
              <option value="">None</option>
              {moduleOptions
                .filter((m) => m !== "")
                .map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.metaField}>
            <span className={styles.metaLabel}>Complexity</span>
            <select
              className={styles.metaSelect}
              value={feature.complexity}
              onChange={(event) =>
                void updateField({ complexity: event.target.value as FeatureComplexity })
              }
            >
              {complexityOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spec</h2>
        <div className={`hm-card ${styles.editorCard}`}>
          <RichTextEditor
            initialContent={feature.description ?? ""}
            placeholder="Write the feature spec..."
            onSave={saveDescription}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Discussion
          {notes.length > 0 ? (
            <span className={styles.noteCount}>{notes.length}</span>
          ) : null}
        </h2>

        <div className={styles.notesList}>
          {notes.length > 0 ? (
            notes.map((note) => {
              const author = profileById.get(note.author_id);
              const authorName =
                author?.display_name ?? author?.email ?? "Unknown";
              return (
                <div key={note.id} className={styles.noteItem}>
                  <div className={styles.noteHeader}>
                    <span className={styles.noteAvatar}>
                      {authorName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className={styles.noteAuthor}>{authorName}</span>
                    <span className={styles.noteTime}>
                      {formatTimestamp(note.created_at)}
                    </span>
                  </div>
                  <p className={styles.noteContent}>{note.content}</p>
                </div>
              );
            })
          ) : (
            <p className={styles.emptyNotes}>
              No discussion yet. Add a note to start the conversation.
            </p>
          )}
        </div>

        <form
          className={styles.noteForm}
          onSubmit={(event) => {
            event.preventDefault();
            void addNote();
          }}
        >
          <input
            className={`hm-input ${styles.noteInput}`}
            placeholder="Add a note..."
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
          />
          <button
            type="submit"
            className={`hm-btn-primary ${styles.noteSubmit}`}
            disabled={savingNote || !noteDraft.trim()}
          >
            {savingNote ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
