import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Recommendation } from "@/lib/types/database";

import { RecDetailClient } from "./RecDetailClient";

interface RecommendationDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RecommendationDetailPage({
  params,
}: RecommendationDetailPageProps) {
  const supabase = await createClient();

  const { data: recommendation, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("id", params.id)
    .single<Recommendation>();

  if (error || !recommendation) {
    notFound();
  }

  return <RecDetailClient recommendation={recommendation} />;
}
