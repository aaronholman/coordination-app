import { createClient } from "@/lib/supabase/server";
import type {
  GroceryItem,
  GroceryItemLocation,
  GroceryItemNote,
  GroceryListItem,
  GroceryStore,
  Profile,
} from "@/lib/types/database";

import { GroceryClientView } from "./GroceryClientView";

export default async function GroceryPage() {
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

  const [{ data: listItems }, { data: groceryItems }, { data: stores }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("grocery_list_items")
        .select("*")
        .eq("tenant_id", currentProfile.tenant_id)
        .order("created_at", { ascending: false })
        .returns<GroceryListItem[]>(),
      supabase
        .from("grocery_items")
        .select("*")
        .eq("tenant_id", currentProfile.tenant_id)
        .returns<GroceryItem[]>(),
      supabase
        .from("grocery_stores")
        .select("*")
        .eq("tenant_id", currentProfile.tenant_id)
        .order("sort_order", { ascending: true })
        .returns<GroceryStore[]>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", currentProfile.tenant_id)
        .returns<Profile[]>(),
    ]);

  const groceryItemIds = (groceryItems ?? []).map((item) => item.id);
  let locations: GroceryItemLocation[] = [];
  let notes: GroceryItemNote[] = [];

  if (groceryItemIds.length > 0) {
    const [{ data: locationData }, { data: noteData }] = await Promise.all([
      supabase
        .from("grocery_item_locations")
        .select("*")
        .in("item_id", groceryItemIds)
        .returns<GroceryItemLocation[]>(),
      supabase
        .from("grocery_item_notes")
        .select("*")
        .in("item_id", groceryItemIds)
        .returns<GroceryItemNote[]>(),
    ]);

    locations = locationData ?? [];
    notes = noteData ?? [];
  }

  return (
    <GroceryClientView
      tenantId={currentProfile.tenant_id}
      currentUserId={user.id}
      currentUserName={currentProfile.display_name ?? currentProfile.email}
      listItems={listItems ?? []}
      groceryItems={groceryItems ?? []}
      stores={stores ?? []}
      locations={locations ?? []}
      notes={notes ?? []}
      profiles={profiles ?? []}
    />
  );
}
