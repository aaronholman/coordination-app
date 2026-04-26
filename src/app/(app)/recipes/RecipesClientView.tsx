"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type { Profile, Recipe } from "@/lib/types/database";

import styles from "./RecipesClientView.module.css";

interface RecipeRow extends Recipe {
  addedByName: string;
  tagsLabel: string;
}

interface RecipesClientViewProps {
  recipes: Recipe[];
  profiles: Profile[];
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function RecipesClientView({ recipes, profiles }: RecipesClientViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );

  const rows = useMemo<RecipeRow[]>(
    () =>
      recipes.map((recipe) => {
        const addedBy = profileById.get(recipe.added_by);
        return {
          ...recipe,
          addedByName: addedBy?.display_name ?? addedBy?.email ?? "Unknown",
          tagsLabel: recipe.tags.join(", "),
        };
      }),
    [profileById, recipes],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((recipe) => recipe.name.toLowerCase().includes(query));
  }, [rows, search]);

  const columns: DataTableColumn<RecipeRow>[] = [
    {
      key: "recipe",
      label: "Recipe",
      getValue: (row) => row.name,
      sortable: true,
      filterable: true,
      render: (row) => (
        <button type="button" className={styles.recipeButton}>
          {row.name}
        </button>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      getValue: (row) => row.tagsLabel,
      getFilterValues: (row) => row.tags,
      sortable: true,
      filterable: true,
      render: (row) =>
        row.tags.length > 0 ? (
          <span className={styles.tagsWrap}>
            {row.tags.map((tag) => (
              <span key={tag} className={styles.tagBadge}>
                {tag}
              </span>
            ))}
          </span>
        ) : (
          "\u2014"
        ),
    },
    {
      key: "source",
      label: "Source",
      getValue: (row) => row.source_name ?? row.source_url ?? "",
      sortable: true,
      filterable: true,
      render: (row) => {
        if (row.source_name) return row.source_name;
        if (row.source_url) {
          return (
            <a href={row.source_url} className={styles.sourceLink}>
              {row.source_url}
            </a>
          );
        }
        return "\u2014";
      },
    },
    {
      key: "added",
      label: "Added",
      getValue: (row) => row.created_at,
      sortable: true,
      sortLabels: {
        asc: "Oldest first",
        desc: "Newest first",
      },
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "by",
      label: "By",
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
    <div className={styles.page}>
      <PageHeader
        title="Recipes"
        action={
          <div className={styles.headerControls}>
            <input
              className={`hm-input ${styles.searchInput}`}
              placeholder="Search recipes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Link href="/recipes/new" className={`hm-btn-primary ${styles.newButton}`}>
              + New recipe
            </Link>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredRows}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/recipes/${row.id}`)}
      />
    </div>
  );
}
