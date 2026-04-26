import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Document, Profile, Project, Task } from "@/lib/types/database";

import { ProjectDetailClient } from "./ProjectDetailClient";
import styles from "./page.module.css";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const supabase = await createClient();

  const [{ data: project, error: projectError }, { data: tasks }, { data: documents }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single<Project>(),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<Task[]>(),
      supabase
        .from("documents")
        .select("*")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<Document[]>(),
    ]);

  if (projectError || !project) {
    notFound();
  }

  const profileIds = new Set<string>();
  (tasks ?? []).forEach((task) => {
    if (task.assignee_id) {
      profileIds.add(task.assignee_id);
    }
  });
  (documents ?? []).forEach((document) => profileIds.add(document.added_by));

  let profiles: Profile[] = [];
  if (profileIds.size > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .in("id", [...profileIds])
      .returns<Profile[]>();

    profiles = profileData ?? [];
  }

  return (
    <div className={styles.page}>
      <Link href="/projects" className={styles.backLink}>
        {"\u2190"} Projects
      </Link>

      <ProjectDetailClient
        project={project}
        tasks={tasks ?? []}
        documents={documents ?? []}
        profiles={profiles}
      />
    </div>
  );
}
