import { createClient } from "@/lib/supabase/server";
import type { Profile, Recommendation } from "@/lib/types/database";

import { RecsClientView } from "./RecsClientView";

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const [{ data: recommendations }, { data: profiles }] = await Promise.all([
    supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Recommendation[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
  ]);

  return (
    <RecsClientView
      recommendations={recommendations ?? []}
      profiles={profiles ?? []}
    />
  );
}
