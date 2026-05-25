"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type {
  FeatureComplexity,
  FeatureStatus,
  Profile,
  TaskPriority,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "../../new-form.module.css";

const statusOptions: FeatureStatus[] = ["idea", "speccing", "building", "deployed"];
const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];
const complexityOptions: FeatureComplexity[] = ["small", "medium", "large"];
const moduleOptions = [
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

export function NewFeatureForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<FeatureStatus>("idea");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [targetModule, setTargetModule] = useState("");
  const [complexity, setComplexity] = useState<FeatureComplexity>("medium");
  const [description, setDescription] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();

    if (!profile) {
      setError("Unable to find your profile.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("features")
      .insert({
        tenant_id: profile.tenant_id,
        title,
        description: description || null,
        status,
        priority,
        target_module: targetModule || null,
        complexity,
        created_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create feature.");
      setLoading(false);
      return;
    }

    router.push(`/pipeline/${data.id}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Feature</h1>

      <form className={`hm-card ${styles.form}`} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className="hm-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="hm-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className="hm-label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={styles.select}
              value={status}
              onChange={(event) => setStatus(event.target.value as FeatureStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              className={styles.select}
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="module">
              Target Module
            </label>
            <select
              id="module"
              className={styles.select}
              value={targetModule}
              onChange={(event) => setTargetModule(event.target.value)}
            >
              <option value="">None</option>
              {moduleOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="complexity">
              Complexity
            </label>
            <select
              id="complexity"
              className={styles.select}
              value={complexity}
              onChange={(event) => setComplexity(event.target.value as FeatureComplexity)}
            >
              {complexityOptions.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <p className="hm-label">Description</p>
          <RichTextEditor
            initialContent={description}
            placeholder="Describe the feature..."
            onSave={(nextDescription) => setDescription(nextDescription)}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={`hm-btn-text ${styles.cancel}`}
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button className={`hm-btn-primary ${styles.submit}`} type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create feature"}
          </button>
        </div>
      </form>
    </div>
  );
}
