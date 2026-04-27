export type ProfileRole = "owner" | "member";
export type ProjectStatus = "not_started" | "active" | "inactive" | "done" | "archived";
export type TaskStatus = "not_started" | "active" | "inactive" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type DocumentCategory =
  | "legal"
  | "insurance"
  | "maintenance"
  | "tax"
  | "financial"
  | "medical"
  | "notes"
  | "other";
export type GroceryCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "seafood"
  | "bakery"
  | "pantry"
  | "frozen"
  | "beverages"
  | "snacks"
  | "household"
  | "personal_care"
  | "other";
export type RecommendationType = "show" | "movie" | "podcast" | "book";
export type RecommendationStatus = "not_yet" | "watching" | "watched";
export type SharePermission = "view" | "edit" | "admin";

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  display_name: string | null;
  email: string;
  preferred_email: string | null;
  secondary_email: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
}

export interface Project {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_ids: string[] | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Document {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  category: DocumentCategory;
  file_id: string | null;
  url: string | null;
  added_by: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  tenant_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface TaskDocument {
  task_id: string;
  document_id: string;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  tenant_id: string;
  name: string;
  category: GroceryCategory;
  created_at: string;
}

export interface GroceryListItem {
  id: string;
  tenant_id: string;
  item_id: string;
  checked: boolean;
  added_by: string;
  checked_by: string | null;
  created_at: string;
  checked_at: string | null;
}

export interface GroceryStore {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface GroceryItemLocation {
  id: string;
  item_id: string;
  store_id: string;
  location: string | null;
}

export interface GroceryItemNote {
  id: string;
  item_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  tenant_id: string;
  name: string;
  tags: string[];
  source_url: string | null;
  source_name: string | null;
  instructions: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  tenant_id: string;
  title: string;
  type: RecommendationType;
  status: RecommendationStatus;
  recommended_by: string | null;
  notes: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface Share {
  id: string;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  shared_with_email: string;
  permission: SharePermission;
  shared_by: string;
  expires_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  resource_type: string | null;
  resource_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  task_assignments: boolean;
  task_completions: boolean;
  share_invites: boolean;
  grocery_updates: boolean;
  weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  dashboard_layout: Record<string, unknown> | null;
  default_project_id: string | null;
  theme: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantInsert {
  id?: string;
  name: string;
  created_at?: string;
}

export type TenantUpdate = Partial<TenantInsert>;

export interface ProfileInsert {
  id?: string;
  tenant_id: string;
  display_name: string | null;
  email: string;
  preferred_email: string | null;
  secondary_email: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at?: string;
}

export type ProfileUpdate = Partial<ProfileInsert>;

export interface ProjectInsert {
  id?: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  category: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export type ProjectUpdate = Partial<ProjectInsert>;

export interface TaskInsert {
  id?: string;
  tenant_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_ids?: string[] | null;
  due_date: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export type TaskUpdate = Partial<TaskInsert>;

export interface DocumentInsert {
  id?: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  category: DocumentCategory;
  file_id: string | null;
  url: string | null;
  added_by: string;
  created_at?: string;
}

export type DocumentUpdate = Partial<DocumentInsert>;

export interface FileRecordInsert {
  id?: string;
  tenant_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at?: string;
}

export type FileRecordUpdate = Partial<FileRecordInsert>;

export interface TaskDocumentInsert {
  task_id: string;
  document_id: string;
  created_at?: string;
}

export type TaskDocumentUpdate = Partial<TaskDocumentInsert>;

export interface GroceryItemInsert {
  id?: string;
  tenant_id: string;
  name: string;
  category: GroceryCategory;
  created_at?: string;
}

export type GroceryItemUpdate = Partial<GroceryItemInsert>;

export interface GroceryListItemInsert {
  id?: string;
  tenant_id: string;
  item_id: string;
  checked: boolean;
  added_by: string;
  checked_by: string | null;
  created_at?: string;
  checked_at?: string | null;
}

export type GroceryListItemUpdate = Partial<GroceryListItemInsert>;

export interface GroceryStoreInsert {
  id?: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

export type GroceryStoreUpdate = Partial<GroceryStoreInsert>;

export interface GroceryItemLocationInsert {
  id?: string;
  item_id: string;
  store_id: string;
  location: string | null;
}

export type GroceryItemLocationUpdate = Partial<GroceryItemLocationInsert>;

export interface GroceryItemNoteInsert {
  id?: string;
  item_id: string;
  user_id: string;
  note: string;
  created_at?: string;
}

export type GroceryItemNoteUpdate = Partial<GroceryItemNoteInsert>;

export interface RecipeInsert {
  id?: string;
  tenant_id: string;
  name: string;
  tags: string[];
  source_url: string | null;
  source_name: string | null;
  instructions: string | null;
  added_by: string;
  created_at?: string;
  updated_at?: string;
}

export type RecipeUpdate = Partial<RecipeInsert>;

export interface RecommendationInsert {
  id?: string;
  tenant_id: string;
  title: string;
  type: RecommendationType;
  status: RecommendationStatus;
  recommended_by: string | null;
  notes: string | null;
  added_by: string;
  created_at?: string;
  updated_at?: string;
}

export type RecommendationUpdate = Partial<RecommendationInsert>;

export interface ShareInsert {
  id?: string;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  shared_with_email: string;
  permission: SharePermission;
  shared_by: string;
  expires_at: string | null;
  created_at?: string;
}

export type ShareUpdate = Partial<ShareInsert>;

export interface NotificationInsert {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  resource_type: string | null;
  resource_id: string | null;
  read: boolean;
  created_at?: string;
}

export type NotificationUpdate = Partial<NotificationInsert>;

export interface NotificationPreferenceInsert {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  task_assignments: boolean;
  task_completions: boolean;
  share_invites: boolean;
  grocery_updates: boolean;
  weekly_digest: boolean;
  created_at?: string;
  updated_at?: string;
}

export type NotificationPreferenceUpdate = Partial<NotificationPreferenceInsert>;

export interface ActivityLogInsert {
  id?: string;
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at?: string;
}

export type ActivityLogUpdate = Partial<ActivityLogInsert>;

export interface UserPreferenceInsert {
  id?: string;
  user_id: string;
  dashboard_layout: Record<string, unknown> | null;
  default_project_id: string | null;
  theme: string | null;
  created_at?: string;
  updated_at?: string;
}

export type UserPreferenceUpdate = Partial<UserPreferenceInsert>;

type TableDefinition<TRow, TInsert, TUpdate> = {
  Row: TRow;
  Insert: TInsert;
  Update: TUpdate;
};

export type Database = {
  public: {
    Tables: {
      tenants: TableDefinition<Tenant, TenantInsert, TenantUpdate>;
      profiles: TableDefinition<Profile, ProfileInsert, ProfileUpdate>;
      projects: TableDefinition<Project, ProjectInsert, ProjectUpdate>;
      tasks: TableDefinition<Task, TaskInsert, TaskUpdate>;
      documents: TableDefinition<Document, DocumentInsert, DocumentUpdate>;
      files: TableDefinition<FileRecord, FileRecordInsert, FileRecordUpdate>;
      task_documents: TableDefinition<
        TaskDocument,
        TaskDocumentInsert,
        TaskDocumentUpdate
      >;
      grocery_items: TableDefinition<
        GroceryItem,
        GroceryItemInsert,
        GroceryItemUpdate
      >;
      grocery_list_items: TableDefinition<
        GroceryListItem,
        GroceryListItemInsert,
        GroceryListItemUpdate
      >;
      grocery_stores: TableDefinition<
        GroceryStore,
        GroceryStoreInsert,
        GroceryStoreUpdate
      >;
      grocery_item_locations: TableDefinition<
        GroceryItemLocation,
        GroceryItemLocationInsert,
        GroceryItemLocationUpdate
      >;
      grocery_item_notes: TableDefinition<
        GroceryItemNote,
        GroceryItemNoteInsert,
        GroceryItemNoteUpdate
      >;
      recipes: TableDefinition<Recipe, RecipeInsert, RecipeUpdate>;
      recommendations: TableDefinition<
        Recommendation,
        RecommendationInsert,
        RecommendationUpdate
      >;
      shares: TableDefinition<Share, ShareInsert, ShareUpdate>;
      notifications: TableDefinition<
        Notification,
        NotificationInsert,
        NotificationUpdate
      >;
      notification_preferences: TableDefinition<
        NotificationPreference,
        NotificationPreferenceInsert,
        NotificationPreferenceUpdate
      >;
      activity_log: TableDefinition<ActivityLog, ActivityLogInsert, ActivityLogUpdate>;
      user_preferences: TableDefinition<
        UserPreference,
        UserPreferenceInsert,
        UserPreferenceUpdate
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
