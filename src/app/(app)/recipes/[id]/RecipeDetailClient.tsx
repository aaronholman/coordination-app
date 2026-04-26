"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Recipe } from "@/lib/types/database";

import styles from "./RecipeDetailClient.module.css";

interface RecipeDetailClientProps {
  recipe: Recipe;
}

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(recipe.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [instructions, setInstructions] = useState(recipe.instructions ?? "");
  const [savedInstructions, setSavedInstructions] = useState(recipe.instructions ?? "");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(recipe.name);
    setIsEditingName(false);
    setInstructions(recipe.instructions ?? "");
    setSavedInstructions(recipe.instructions ?? "");
    setIsEditingInstructions(false);
  }, [recipe]);

  async function updateRecipe(patch: Partial<Recipe>) {
    await supabase.from("recipes").update(patch).eq("id", recipe.id);
  }

  async function deleteRecipe() {
    setDeleting(true);
    await supabase.from("recipes").delete().eq("id", recipe.id);
    router.push("/recipes");
  }

  return (
    <div className={styles.page}>
      <Link href="/recipes" className={styles.backLink}>
        {"\u2190"} Recipes
      </Link>

      <div className={styles.titleWrap}>
        {isEditingName ? (
          <input
            className={styles.titleInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={async () => {
              setIsEditingName(false);
              const trimmed = name.trim();
              if (trimmed && trimmed !== recipe.name) {
                await updateRecipe({ name: trimmed });
              }
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                setIsEditingName(false);
                const trimmed = name.trim();
                if (trimmed && trimmed !== recipe.name) {
                  await updateRecipe({ name: trimmed });
                }
              }
            }}
            autoFocus
          />
        ) : (
          <h1 className={styles.title} onClick={() => setIsEditingName(true)}>
            {name}
          </h1>
        )}
      </div>

      <section className={`hm-card ${styles.metaCard}`}>
        <div className={styles.metaGroup}>
          <p className={styles.metaLabel}>Tags</p>
          <div className={styles.tagWrap}>
            {recipe.tags.length > 0 ? (
              recipe.tags.map((tag) => (
                <span key={tag} className={styles.tagBadge}>
                  {tag}
                </span>
              ))
            ) : (
              <span className={styles.metaMuted}>No tags</span>
            )}
          </div>
        </div>

        <div className={styles.metaGroup}>
          <p className={styles.metaLabel}>Source</p>
          {recipe.source_url ? (
            <a href={recipe.source_url} className={styles.sourceLink}>
              {recipe.source_name || recipe.source_url}
            </a>
          ) : recipe.source_name ? (
            <span className={styles.metaValue}>{recipe.source_name}</span>
          ) : (
            <span className={styles.metaMuted}>No source</span>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>

        {isEditingInstructions ? (
          <textarea
            className={styles.instructionsInput}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            onBlur={async () => {
              setIsEditingInstructions(false);
              if (instructions !== savedInstructions) {
                await updateRecipe({ instructions: instructions || null });
                setSavedInstructions(instructions);
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className={styles.instructionsView}
            onClick={() => setIsEditingInstructions(true)}
          >
            {instructions || "Add instructions..."}
          </div>
        )}
      </section>

      <button
        type="button"
        className={`hm-btn-text ${styles.deleteButton}`}
        onClick={deleteRecipe}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete recipe"}
      </button>
    </div>
  );
}
