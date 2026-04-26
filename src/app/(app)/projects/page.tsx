import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types/database";

import { ProjectsClientView } from "./ProjectsClientView";
import styles from "./page.module.css";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const projects: Project[] = data ?? [];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Projects"
        action={
          <Link href="/projects/new" className={`hm-btn-primary ${styles.newProjectButton}`}>
            + New project
          </Link>
        }
      />

      {error ? (
        <p className={styles.emptyState}>Unable to load projects right now.</p>
      ) : (
        <ProjectsClientView projects={projects} />
      )}
    </div>
  );
}
