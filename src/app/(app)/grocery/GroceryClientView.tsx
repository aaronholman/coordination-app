"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/client";
import type {
  GroceryCategory,
  GroceryItem,
  GroceryItemLocation,
  GroceryItemNote,
  GroceryListItem,
  GroceryStore,
  Profile,
} from "@/lib/types/database";
import { formatEnumLabel } from "@/lib/utils/formatting";
import { categorizeGroceryItem, findSimilarItems } from "@/lib/utils/grocery";

import styles from "./GroceryClientView.module.css";

interface GroceryClientViewProps {
  tenantId: string;
  currentUserId: string;
  currentUserName: string;
  listItems: GroceryListItem[];
  groceryItems: GroceryItem[];
  stores: GroceryStore[];
  locations: GroceryItemLocation[];
  notes: GroceryItemNote[];
  profiles: Profile[];
}

interface GroceryRow {
  listItem: GroceryListItem;
  item: GroceryItem;
}

const categoryOrder: GroceryCategory[] = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "bakery",
  "pantry",
  "frozen",
  "beverages",
  "snacks",
  "household",
  "personal_care",
  "other",
];

function categoryLabel(category: GroceryCategory) {
  return formatEnumLabel(category);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function AisleEditor({
  value,
  justSaved,
  onChange,
  onBlur,
}: {
  value: string;
  justSaved: boolean;
  onChange: (next: string) => void;
  onBlur: () => void;
}) {
  const sizerRef = useRef<HTMLSpanElement | null>(null);
  const [width, setWidth] = useState<number>(42);

  useEffect(() => {
    if (!sizerRef.current) return;
    const next = Math.max(42, sizerRef.current.offsetWidth + 14);
    setWidth(next);
  }, [value]);

  return (
    <span className={styles.aisleWrap}>
      <span ref={sizerRef} className={styles.aisleSizer}>
        {value || "Aisle"}
      </span>
      <input
        className={`${styles.aisleInput} ${justSaved ? styles.aisleInputSaved : ""}`}
        style={{ width }}
        value={value}
        placeholder="Aisle"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </span>
  );
}

export function GroceryClientView({
  tenantId,
  currentUserId,
  currentUserName,
  listItems: initialListItems,
  groceryItems: initialGroceryItems,
  stores,
  locations: initialLocations,
  notes: initialNotes,
  profiles,
}: GroceryClientViewProps) {
  const supabase = useMemo(() => createClient(), []);

  const [listItems, setListItems] = useState(initialListItems);
  const [groceryItems, setGroceryItems] = useState(initialGroceryItems);
  const [locations, setLocations] = useState(initialLocations);
  const [notes, setNotes] = useState(initialNotes);
  const [activeStoreId, setActiveStoreId] = useState(stores[0]?.id ?? "");
  const [quickAdd, setQuickAdd] = useState("");
  const [expandedNotesItemId, setExpandedNotesItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [aisleDrafts, setAisleDrafts] = useState<Record<string, string>>({});
  const [savedAisleKey, setSavedAisleKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GroceryItem[]>([]);
  const [pendingAddName, setPendingAddName] = useState<string | null>(null);

  // Fetch fresh data on mount to avoid stale server-rendered content
  useEffect(() => {
    async function refreshOnMount() {
      const [{ data: freshListItems }, { data: freshGroceryItems }] = await Promise.all([
        supabase
          .from("grocery_list_items")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .returns<GroceryListItem[]>(),
        supabase
          .from("grocery_items")
          .select("*")
          .eq("tenant_id", tenantId)
          .returns<GroceryItem[]>(),
      ]);
      if (freshListItems) setListItems(freshListItems);
      if (freshGroceryItems) setGroceryItems(freshGroceryItems);
    }
    void refreshOnMount();
  }, [supabase, tenantId]);

  useEffect(() => {
    const channel = supabase
      .channel("grocery-list-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_list_items",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async () => {
          const { data } = await supabase
            .from("grocery_list_items")
            .select("*")
            .eq("tenant_id", tenantId)
            .returns<GroceryListItem[]>();
          if (data) {
            setListItems(data);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, tenantId]);

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile] as const)),
    [profiles],
  );
  const itemById = useMemo(
    () => new Map(groceryItems.map((item) => [item.id, item] as const)),
    [groceryItems],
  );
  const locationByStoreItem = useMemo(() => {
    const map = new Map<string, GroceryItemLocation>();
    locations.forEach((location) => {
      map.set(`${location.store_id}:${location.item_id}`, location);
    });
    return map;
  }, [locations]);

  const rows = useMemo<GroceryRow[]>(() => {
    return listItems
      .map((listItem) => {
        const item = itemById.get(listItem.item_id);
        if (!item) return null;
        return { listItem, item };
      })
      .filter((row): row is GroceryRow => Boolean(row));
  }, [itemById, listItems]);

  const uncheckedRows = rows.filter((row) => !row.listItem.checked);
  const checkedRows = rows.filter((row) => row.listItem.checked);

  const groupedUnchecked = useMemo(() => {
    return categoryOrder.map((category) => ({
      category,
      rows: uncheckedRows.filter((row) => row.item.category === category),
    }));
  }, [uncheckedRows]);

  const notesByItem = useMemo(() => {
    const map = new Map<string, GroceryItemNote[]>();
    notes.forEach((note) => {
      const existing = map.get(note.item_id) ?? [];
      existing.push(note);
      map.set(note.item_id, existing);
    });
    return map;
  }, [notes]);

  async function toggleChecked(row: GroceryRow, checked: boolean) {
    setListItems((current) =>
      current.map((item) =>
        item.id === row.listItem.id
          ? {
              ...item,
              checked,
              checked_by: checked ? currentUserId : null,
              checked_at: checked ? new Date().toISOString() : null,
            }
          : item,
      ),
    );

    await supabase
      .from("grocery_list_items")
      .update({
        checked,
        checked_by: checked ? currentUserId : null,
        checked_at: checked ? new Date().toISOString() : null,
      })
      .eq("id", row.listItem.id);
  }

  async function updateLocation(itemId: string, value: string) {
    if (!activeStoreId) return;
    const key = `${activeStoreId}:${itemId}`;
    const existing = locationByStoreItem.get(key);
    const nextLocation = value.trim();
    const persisted = existing?.location ?? "";

    if (nextLocation === persisted) {
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("grocery_item_locations")
        .update({ location: nextLocation || null })
        .eq("id", existing.id);
      if (error) return;

      setLocations((current) =>
        current.map((location) =>
          location.id === existing.id
            ? { ...location, location: nextLocation || null }
            : location,
        ),
      );

      setAisleDrafts((current) => ({ ...current, [key]: nextLocation }));
      setSavedAisleKey(key);
      setTimeout(() => setSavedAisleKey((current) => (current === key ? null : current)), 700);
      return;
    }

    const { data } = await supabase
      .from("grocery_item_locations")
      .insert({
        id: crypto.randomUUID(),
        item_id: itemId,
        store_id: activeStoreId,
        location: nextLocation || null,
      })
      .select("*")
      .single<GroceryItemLocation>();

    if (data) {
      setLocations((current) => [...current, data]);
      setAisleDrafts((current) => ({ ...current, [key]: nextLocation }));
      setSavedAisleKey(key);
      setTimeout(() => setSavedAisleKey((current) => (current === key ? null : current)), 700);
    }
  }

  async function addItemToList(targetItem: GroceryItem) {
    const existingListEntry = listItems.find(
      (listItem) => listItem.item_id === targetItem.id && !listItem.checked,
    );
    if (existingListEntry) {
      setQuickAdd("");
      setSuggestions([]);
      setPendingAddName(null);
      return;
    }

    const { data: createdListItem } = await supabase
      .from("grocery_list_items")
      .insert({
        tenant_id: tenantId,
        item_id: targetItem.id,
        checked: false,
        added_by: currentUserId,
      })
      .select("*")
      .single<GroceryListItem>();

    if (createdListItem) {
      setListItems((current) => [createdListItem, ...current]);
      setQuickAdd("");
      setSuggestions([]);
      setPendingAddName(null);
    }
  }

  async function createAndAddItem(name: string) {
    const { data: createdItem } = await supabase
      .from("grocery_items")
      .insert({
        tenant_id: tenantId,
        name,
        category: categorizeGroceryItem(name),
      })
      .select("*")
      .single<GroceryItem>();

    if (!createdItem) return;
    setGroceryItems((current) => [createdItem, ...current]);
    await addItemToList(createdItem);
  }

  async function handleQuickAdd() {
    const name = quickAdd.trim();
    if (!name) return;

    // Exact match — use existing item directly
    const exactMatch =
      groceryItems.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null;

    if (exactMatch) {
      await addItemToList(exactMatch);
      return;
    }

    // Check for similar items before creating a new one
    const similar = findSimilarItems(name, groceryItems);
    if (similar.length > 0) {
      setSuggestions(similar);
      setPendingAddName(name);
      return;
    }

    // No matches at all — create new item
    await createAndAddItem(name);
  }

  function dismissSuggestions() {
    setSuggestions([]);
    setPendingAddName(null);
  }

  async function clearChecked() {
    const checkedIds = checkedRows.map((row) => row.listItem.id);
    if (checkedIds.length === 0) return;

    await supabase.from("grocery_list_items").delete().in("id", checkedIds);
    setListItems((current) => current.filter((row) => !checkedIds.includes(row.id)));
  }

  async function deleteListItem(listItemId: string) {
    await supabase.from("grocery_list_items").delete().eq("id", listItemId);
    setListItems((current) => current.filter((item) => item.id !== listItemId));
  }

  async function saveNote(itemId: string) {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;

    const { data } = await supabase
      .from("grocery_item_notes")
      .insert({
        item_id: itemId,
        user_id: currentUserId,
        note: trimmed,
      })
      .select("*")
      .single<GroceryItemNote>();

    if (data) {
      setNotes((current) => [...current, data]);
      setNoteDraft("");
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Grocery" />

      <div className={styles.storePills}>
        {stores.map((store) => {
          const active = store.id === activeStoreId;
          return (
            <button
              key={store.id}
              type="button"
              className={`${styles.storePill} ${active ? styles.storePillActive : ""}`}
              onClick={() => setActiveStoreId(store.id)}
            >
              {store.name}
            </button>
          );
        })}
      </div>

      <form
        className={styles.quickAdd}
        onSubmit={(event) => {
          event.preventDefault();
          void handleQuickAdd();
        }}
      >
        <input
          className={`hm-input ${styles.quickAddInput}`}
          placeholder="Add an item..."
          value={quickAdd}
          onChange={(event) => {
            const next = event.target.value;
            setQuickAdd(next);
            if (pendingAddName && next.trim().toLowerCase() !== pendingAddName.toLowerCase()) {
              setSuggestions([]);
              setPendingAddName(null);
            }
          }}
        />
        <button type="submit" className={`hm-btn-primary ${styles.quickAddButton}`}>
          +
        </button>
      </form>

      {suggestions.length > 0 && pendingAddName ? (
        <div className={styles.suggestionsPanel}>
          <p className={styles.suggestionsPrompt}>
            Did you mean one of these?
          </p>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.suggestionButton}
              onClick={() => void addItemToList(item)}
            >
              {item.name}
            </button>
          ))}
          <button
            type="button"
            className={styles.suggestionNewButton}
            onClick={() => {
              void createAndAddItem(pendingAddName);
            }}
          >
            Add &ldquo;{pendingAddName}&rdquo; as new item
          </button>
        </div>
      ) : null}

      <div className={styles.list}>
        {groupedUnchecked.map((group) =>
          group.rows.length > 0 ? (
            <section key={group.category} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <span>{categoryLabel(group.category)}</span>
                <span className={styles.categoryDivider} />
              </div>

              {group.rows.map((row) => {
                const locationKey = `${activeStoreId}:${row.item.id}`;
                const persistedLocation =
                  locationByStoreItem.get(locationKey)?.location ?? "";
                const location = aisleDrafts[locationKey] ?? persistedLocation;
                const itemNotes = notesByItem.get(row.item.id) ?? [];
                return (
                  <div key={row.listItem.id}>
                    <div className={styles.itemRow}>
                      <label className={styles.mainTapRow}>
                        <input
                          type="checkbox"
                          checked={row.listItem.checked}
                          onChange={(event) => void toggleChecked(row, event.target.checked)}
                        />
                        <span className={styles.itemName}>{row.item.name}</span>
                      </label>

                      <div className={styles.rowMeta}>
                        <AisleEditor
                          value={location}
                          justSaved={savedAisleKey === locationKey}
                          onChange={(next) => {
                            setAisleDrafts((current) => ({
                              ...current,
                              [locationKey]: next,
                            }));
                          }}
                          onBlur={() => {
                            void updateLocation(row.item.id, location);
                          }}
                        />
                        <button
                          type="button"
                          className={styles.notesBadge}
                          onClick={() => {
                            setExpandedNotesItemId((current) =>
                              current === row.item.id ? null : row.item.id,
                            );
                            setNoteDraft("");
                          }}
                        >
                          {itemNotes.length > 0 ? itemNotes.length : "..."}
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => void deleteListItem(row.listItem.id)}
                        >
                          x
                        </button>
                      </div>
                    </div>
                    {expandedNotesItemId === row.item.id ? (
                      <div className={styles.inlineNotes}>
                        <div className={styles.inlineNotesHeader}>
                          <span className={styles.inlineNotesTitle}>Notes</span>
                          <button
                            type="button"
                            className={styles.inlineNotesClose}
                            onClick={() => setExpandedNotesItemId(null)}
                          >
                            Close
                          </button>
                        </div>

                        <div className={styles.inlineNotesList}>
                          {itemNotes.length > 0 ? (
                            itemNotes.map((note) => {
                              const author = profileById.get(note.user_id);
                              const authorName =
                                author?.display_name ?? author?.email ?? currentUserName;
                              return (
                                <div key={note.id} className={styles.inlineNoteItem}>
                                  <p className={styles.noteText}>{note.note}</p>
                                  <p className={styles.noteMeta}>
                                    {authorName} · {formatTimestamp(note.created_at)}
                                  </p>
                                </div>
                              );
                            })
                          ) : (
                            <p className={styles.emptyText}>No notes yet.</p>
                          )}
                        </div>

                        <form
                          className={styles.inlineNoteInputRow}
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveNote(row.item.id);
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
                            className={`hm-btn-primary ${styles.noteAddButton}`}
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ) : null,
        )}
      </div>

      {checkedRows.length > 0 ? (
        <section className={styles.checkedSection}>
          <div className={styles.checkedHeader}>
            <h3 className={styles.checkedTitle}>Checked</h3>
            <button type="button" className="hm-btn-text" onClick={() => void clearChecked()}>
              Clear checked
            </button>
          </div>
          {checkedRows.map((row) => (
            <label key={row.listItem.id} className={styles.checkedRow}>
              <input
                type="checkbox"
                checked={row.listItem.checked}
                onChange={(event) => void toggleChecked(row, event.target.checked)}
              />
              <span className={styles.checkedName}>{row.item.name}</span>
            </label>
          ))}
        </section>
      ) : null}

    </div>
  );
}
