import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types/database";

import { RecipeDetailClient } from "./RecipeDetailClient";

interface RecipeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", params.id)
    .single<Recipe>();

  if (error || !recipe) {
    notFound();
  }

  return <RecipeDetailClient recipe={recipe} />;
}
