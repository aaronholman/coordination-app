export const dynamic = "force-dynamic";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Feature, Profile } from "@/lib/types/database";

import { PipelineClientView } from "./PipelineClientView";
import styles from "./page.module.css";

export default async function PipelinePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!currentProfile) {
    return null;
  }

  const [{ data: features, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("features")
      .select("*")
      .eq("tenant_id", currentProfile.tenant_id)
      .order("updated_at", { ascending: false })
      .returns<Feature[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", currentProfile.tenant_id)
      .returns<Profile[]>(),
  ]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Pipeline"
        action={
          <Link href="/pipeline/new" className={`hm-btn-primary ${styles.newButton}`}>
            + New feature
          </Link>
        }
      />

      {error ? (
        <p className={styles.emptyState}>Unable to load features right now.</p>
      ) : (
        <PipelineClientView
          features={features ?? []}
          profiles={profiles ?? []}
        />
      )}
    </div>
  );
}
