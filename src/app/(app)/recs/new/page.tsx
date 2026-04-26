"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Profile, RecommendationStatus, RecommendationType } from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "../../new-form.module.css";

const recommendationTypes: RecommendationType[] = ["show", "movie", "podcast", "book"];
const recommendationStatuses: RecommendationStatus[] = ["not_yet", "watching", "watched"];

export default function NewRecommendationPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<RecommendationType>("show");
  const [status, setStatus] = useState<RecommendationStatus>("not_yet");
  const [recommendedBy, setRecommendedBy] = useState("");
  const [notes, setNotes] = useState("");

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
      .from("recommendations")
      .insert({
        tenant_id: profile.tenant_id,
        title,
        type,
        status,
        recommended_by: recommendedBy || null,
        notes: notes || null,
        added_by: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (insertError || !data) {
      setError(insertError?.message ?? "Unable to create recommendation.");
      setLoading(false);
      return;
    }

    router.push(`/recs/${data.id}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>New Recommendation</h1>

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
            <label className="hm-label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              className={styles.select}
              value={type}
              onChange={(event) => setType(event.target.value as RecommendationType)}
            >
              {recommendationTypes.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className="hm-label" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={styles.select}
              value={status}
              onChange={(event) => setStatus(event.target.value as RecommendationStatus)}
            >
              {recommendationStatuses.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="recommended-by">
            Recommended By
          </label>
          <input
            id="recommended-by"
            className="hm-input"
            value={recommendedBy}
            onChange={(event) => setRecommendedBy(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className="hm-label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            className={styles.textarea}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
            {loading ? "Creating..." : "Create recommendation"}
          </button>
        </div>
      </form>
    </div>
  );
}
