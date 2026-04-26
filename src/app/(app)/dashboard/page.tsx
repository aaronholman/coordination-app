import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { GroceryItem, GroceryListItem, Profile, Task, TaskPriority } from "@/lib/types/database";

import { ResponsiveCalendarEmbed } from "./ResponsiveCalendarEmbed";
import styles from "./page.module.css";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
}

function categoryLabel(value: string) {
  return value.replace(/_/g, " ");
}

function priorityClass(priority: TaskPriority) {
  if (priority === "urgent") return styles.priorityUrgent;
  if (priority === "high") return styles.priorityHigh;
  if (priority === "medium") return styles.priorityMedium;
  return styles.priorityLow;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  const [{ data: tasks }, { data: listItems }, { data: groceryItems }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .eq("assignee_id", user.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8)
      .returns<Task[]>(),
    supabase
      .from("grocery_list_items")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .eq("checked", false)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<GroceryListItem[]>(),
    supabase
      .from("grocery_items")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .returns<GroceryItem[]>(),
  ]);

  const itemById = new Map((groceryItems ?? []).map((item) => [item.id, item] as const));
  const groceryRows = (listItems ?? [])
    .map((listItem) => {
      const item = itemById.get(listItem.item_id);
      if (!item) return null;
      return item;
    })
    .filter((item): item is GroceryItem => Boolean(item));

  return (
    <div className={styles.page}>
      <section className={styles.quickActions}>
        <Link href="/tasks/new" className={styles.quickAction}>
          <span className={styles.quickActionIcon}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </span>
          <span>Add task</span>
        </Link>
        <Link href="/grocery?quickAdd=1" className={styles.quickAction}>
          <span className={styles.quickActionIcon}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14l-1.2 10.2A2 2 0 0 1 15.8 19H8.2a2 2 0 0 1-2-1.8L5 7Z" />
              <path d="M8 7V5h8v2" />
            </svg>
          </span>
          <span>Add grocery item</span>
        </Link>
        <Link href="/documents/new" className={styles.quickAction}>
          <span className={styles.quickActionIcon}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3h7l5 5v13H7z" />
              <path d="M14 3v6h5" />
            </svg>
          </span>
          <span>Add document</span>
        </Link>
      </section>

      <section className={styles.widgetGrid}>
        <article className={`hm-card ${styles.widget}`}>
          <h3 className={styles.widgetTitle}>My Tasks</h3>
          {(tasks ?? []).length > 0 ? (
            <div className={styles.taskList}>
              {(tasks ?? []).map((task) => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskMain}>
                    <span className={`${styles.priorityDot} ${priorityClass(task.priority)}`} />
                    <Link href={`/tasks/${task.id}`} className={styles.taskLink}>
                      {task.title}
                    </Link>
                  </div>
                  <span className={styles.taskDue}>{formatDate(task.due_date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No open tasks right now.</p>
          )}
          <Link href="/tasks" className={styles.viewAll}>
            View all {"\u2192"}
          </Link>
        </article>

        <article className={`hm-card ${styles.widget}`}>
          <h3 className={styles.widgetTitle}>Grocery List</h3>
          {groceryRows.length > 0 ? (
            <div className={styles.groceryList}>
              {groceryRows.map((item) => (
                <div key={item.id} className={styles.groceryRow}>
                  <span className={styles.groceryName}>{item.name}</span>
                  <span className={styles.groceryCategory}>{categoryLabel(item.category)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No grocery items to pick up.</p>
          )}
          <Link href="/grocery" className={styles.viewAll}>
            View all {"\u2192"}
          </Link>
        </article>
      </section>

      <article className={`hm-card ${styles.widget} ${styles.calendarWidget}`}>
        <h3 className={styles.widgetTitle}>Family Calendar</h3>
        <div className={styles.calendarFrame}>
          <ResponsiveCalendarEmbed />
        </div>
      </article>
    </div>
  );
}
