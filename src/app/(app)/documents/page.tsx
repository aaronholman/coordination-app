import { createClient } from "@/lib/supabase/server";
import type { Document, Profile, Project } from "@/lib/types/database";

import { DocumentsClientView } from "./DocumentsClientView";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const [{ data: documents }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Document[]>(),
    supabase.from("projects").select("*").returns<Project[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
  ]);

  return (
    <DocumentsClientView
      documents={documents ?? []}
      projects={projects ?? []}
      profiles={profiles ?? []}
    />
  );
}
