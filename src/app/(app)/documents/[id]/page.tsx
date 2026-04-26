import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Document, Profile, Project } from "@/lib/types/database";

import { DocumentDetailClient } from "./DocumentDetailClient";

interface FileMeta {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
}

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: document, error: documentError }, { data: profile }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", params.id).single<Document>(),
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
  ]);

  if (documentError || !document || !profile) {
    notFound();
  }

  const [{ data: fileMeta }, { data: project }, { data: projects }] = await Promise.all([
    document.file_id
      ? supabase
          .from("files")
          .select("id, original_name, mime_type, size_bytes, storage_path")
          .eq("id", document.file_id)
          .single<FileMeta>()
      : Promise.resolve({ data: null }),
    document.project_id
      ? supabase.from("projects").select("*").eq("id", document.project_id).single<Project>()
      : Promise.resolve({ data: null }),
    supabase
      .from("projects")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("name", { ascending: true })
      .returns<Project[]>(),
  ]);

  return (
    <DocumentDetailClient
      document={document}
      fileMeta={fileMeta}
      project={project}
      projects={projects ?? []}
      profile={profile}
    />
  );
}
