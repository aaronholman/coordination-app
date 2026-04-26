"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProjectStatus } from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "../../new-form.module.css";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [category, setCategory] = useState("");

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
      .from("projects")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        description: description || null,
        status,
        category: category || null,
        created_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create project.");
      setLoading(false);
      return;
    }

    router.push(`/projects/${data.id}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Project</h1>

      <form className={`hm-card ${styles.form}`} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className="hm-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="hm-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <p className="hm-label">Description</p>
          <RichTextEditor
            initialContent={description}
            placeholder="Add project description..."
            onSave={(nextDescription) => setDescription(nextDescription)}
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
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
            >
              <option value="active">{formatEnumLabel("active")}</option>
              <option value="inactive">{formatEnumLabel("inactive")}</option>
              <option value="archived">{formatEnumLabel("archived")}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              className="hm-input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>
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
            {loading ? "Creating..." : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}
