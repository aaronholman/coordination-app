export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Feature, FeatureNote, Profile } from "@/lib/types/database";

import { FeatureDetailClient } from "./FeatureDetailClient";

interface FeatureDetailPageProps {
  params: {
    id: string;
  };
}

export default async function FeatureDetailPage({ params }: FeatureDetailPageProps) {
  const supabase = await createClient();

  const { data: feature, error: featureError } = await supabase
    .from("features")
    .select("*")
    .eq("id", params.id)
    .single<Feature>();

  if (featureError || !feature) {
    notFound();
  }

  const [{ data: notes }, { data: profiles }] = await Promise.all([
    supabase
      .from("feature_notes")
      .select("*")
      .eq("feature_id", feature.id)
      .order("created_at", { ascending: true })
      .returns<FeatureNote[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", feature.tenant_id)
      .returns<Profile[]>(),
  ]);

  return (
    <FeatureDetailClient
      feature={feature}
      notes={notes ?? []}
      profiles={profiles ?? []}
    />
  );
}
