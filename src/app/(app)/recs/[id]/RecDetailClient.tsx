"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type { Recommendation, RecommendationStatus, RecommendationType } from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";

import styles from "./RecDetailClient.module.css";

const recommendationTypes: RecommendationType[] = ["show", "movie", "podcast", "book"];
const recommendationStatuses: RecommendationStatus[] = ["not_yet", "watching", "watched"];

interface RecDetailClientProps {
  recommendation: Recommendation;
}

export function RecDetailClient({ recommendation }: RecDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [title, setTitle] = useState(recommendation.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [type, setType] = useState<RecommendationType>(recommendation.type);
  const [status, setStatus] = useState<RecommendationStatus>(recommendation.status);
  const [recommendedBy, setRecommendedBy] = useState(recommendation.recommended_by ?? "");
  const [savedRecommendedBy, setSavedRecommendedBy] = useState(recommendation.recommended_by ?? "");
  const [notes, setNotes] = useState(recommendation.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(recommendation.notes ?? "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(recommendation.title);
    setIsEditingTitle(false);
    setType(recommendation.type);
    setStatus(recommendation.status);
    setRecommendedBy(recommendation.recommended_by ?? "");
    setSavedRecommendedBy(recommendation.recommended_by ?? "");
    setNotes(recommendation.notes ?? "");
    setSavedNotes(recommendation.notes ?? "");
  }, [recommendation]);

  async function updateRecommendation(patch: Partial<Recommendation>) {
    await supabase.from("recommendations").update(patch).eq("id", recommendation.id);
  }

  async function deleteRecommendation() {
    setDeleting(true);
    await supabase.from("recommendations").delete().eq("id", recommendation.id);
    router.push("/recs");
  }

  return (
    <div className={styles.page}>
      <Link href="/recs" className={styles.backLink}>
        {"\u2190"} Recommendations
      </Link>

      <div className={styles.titleWrap}>
        {isEditingTitle ? (
          <input
            className={styles.titleInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={async () => {
              setIsEditingTitle(false);
              const trimmed = title.trim();
              if (trimmed && trimmed !== recommendation.title) {
                await updateRecommendation({ title: trimmed });
              }
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                setIsEditingTitle(false);
                const trimmed = title.trim();
                if (trimmed && trimmed !== recommendation.title) {
                  await updateRecommendation({ title: trimmed });
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

      <section className={`hm-card ${styles.metaCard}`}>
        <div className={styles.metaGrid}>
          <div className={styles.field}>
            <label className={styles.metaLabel} htmlFor="type">
              Type
            </label>
            <select
              id="type"
              className={styles.metaControl}
              value={type}
              onChange={async (event) => {
                const value = event.target.value as RecommendationType;
                setType(value);
                await updateRecommendation({ type: value });
              }}
            >
              {recommendationTypes.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.metaLabel} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={styles.metaControl}
              value={status}
              onChange={async (event) => {
                const value = event.target.value as RecommendationStatus;
                setStatus(value);
                await updateRecommendation({ status: value });
              }}
            >
              {recommendationStatuses.map((option) => (
                <option key={option} value={option}>
                  {formatEnumLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.metaLabel} htmlFor="recommended-by">
              Recommended by
            </label>
            <input
              id="recommended-by"
              className={styles.metaControl}
              value={recommendedBy}
              onChange={(event) => setRecommendedBy(event.target.value)}
              onBlur={async () => {
                if (recommendedBy !== savedRecommendedBy) {
                  await updateRecommendation({
                    recommended_by: recommendedBy || null,
                  });
                  setSavedRecommendedBy(recommendedBy);
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Notes</h3>
        <RichTextEditor
          initialContent={notes}
          placeholder="Add notes..."
          onSave={async (nextNotes) => {
            setNotes(nextNotes);
            if (nextNotes !== savedNotes) {
              await updateRecommendation({ notes: nextNotes || null });
              setSavedNotes(nextNotes);
            }
          }}
        />
      </section>

      <button
        type="button"
        className={`hm-btn-text ${styles.deleteButton}`}
        onClick={deleteRecommendation}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete recommendation"}
      </button>
    </div>
  );
}
