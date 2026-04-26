import { createClient } from "@/lib/supabase/server";
import type { Profile, Recipe } from "@/lib/types/database";

import { RecipesClientView } from "./RecipesClientView";

export default async function RecipesPage() {
  const supabase = await createClient();

  const [{ data: recipes }, { data: profiles }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Recipe[]>(),
    supabase.from("profiles").select("*").returns<Profile[]>(),
  ]);

  return <RecipesClientView recipes={recipes ?? []} profiles={profiles ?? []} />;
}
