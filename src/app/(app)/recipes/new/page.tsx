"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

import styles from "../../new-form.module.css";

export default function NewRecipePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [instructions, setInstructions] = useState("");

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

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        tags: parsedTags,
        source_url: sourceUrl || null,
        source_name: sourceName || null,
        instructions: instructions || null,
        added_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create recipe.");
      setLoading(false);
      return;
    }

    router.push(`/recipes/${data.id}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Recipe</h1>

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
          <label className="hm-label" htmlFor="tags">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            className="hm-input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="dinner, quick, vegetarian"
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className="hm-label" htmlFor="source-url">
              Source URL
            </label>
            <input
              id="source-url"
              className="hm-input"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="source-name">
              Source Name
            </label>
            <input
              id="source-name"
              className="hm-input"
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <p className="hm-label">Instructions</p>
          <RichTextEditor
            initialContent={instructions}
            placeholder="Add instructions..."
            onSave={(nextInstructions) => setInstructions(nextInstructions)}
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
            {loading ? "Creating..." : "Create recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
