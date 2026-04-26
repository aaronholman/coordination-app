import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Document, Profile, Project, Task, TaskDocument } from "@/lib/types/database";

import { TaskDetailClient } from "./TaskDetailClient";

interface TaskDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    projectId?: string;
    projectName?: string;
  };
}

export default async function TaskDetailPage({
  params,
  searchParams,
}: TaskDetailPageProps) {
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .single<Task>();

  if (taskError || !task) {
    notFound();
  }

  const [{ data: projects }, { data: profiles }, { data: taskDocuments }] = await Promise.all([
    supabase.from("projects").select("*").returns<Project[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
    supabase
      .from("task_documents")
      .select("*")
      .eq("task_id", task.id)
      .returns<TaskDocument[]>(),
  ]);

  let linkedDocuments: (Document & { task_document_created_at: string })[] = [];
  const docIds = (taskDocuments ?? []).map((item) => item.document_id);
  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .in("id", docIds)
      .returns<Document[]>();

    const junctionByDoc = new Map(
      (taskDocuments ?? []).map((item) => [item.document_id, item]),
    );

    linkedDocuments = (docs ?? []).map((doc) => ({
      ...doc,
      task_document_created_at:
        junctionByDoc.get(doc.id)?.created_at ?? new Date().toISOString(),
    }));
  }

  const { data: allDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("tenant_id", task.tenant_id)
    .returns<Document[]>();

  const projectIdFromNav = searchParams?.projectId;
  const projectNameFromNav = searchParams?.projectName;
  const hasProjectNav = Boolean(projectIdFromNav && projectNameFromNav);

  return (
    <TaskDetailClient
      task={task}
      projects={projects ?? []}
      profiles={profiles ?? []}
      linkedDocuments={linkedDocuments}
      availableDocuments={allDocuments ?? []}
      backLinkHref={
        hasProjectNav ? `/projects/${projectIdFromNav}` : "/tasks"
      }
      backLinkLabel={hasProjectNav ? projectNameFromNav! : "Tasks"}
    />
  );
}
