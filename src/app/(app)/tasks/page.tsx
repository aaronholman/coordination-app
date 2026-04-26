import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, Task } from "@/lib/types/database";

import { TasksClientView } from "./TasksClientView";

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }).returns<Task[]>(),
    supabase.from("projects").select("*").returns<Project[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
  ]);

  return (
    <TasksClientView
      tasks={tasks ?? []}
      projects={projects ?? []}
      profiles={profiles ?? []}
    />
  );
}
