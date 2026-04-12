export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'member' | 'collaborator'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'member' | 'collaborator'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'member' | 'collaborator'
          avatar_url?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'not_started' | 'in_progress' | 'done'
          color: string | null
          icon: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'done'
          color?: string | null
          icon?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'done'
          color?: string | null
          icon?: string | null
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string | null
          assigned_to: string | null
          status: 'not_started' | 'in_progress' | 'done' | 'abandoned'
          due_date: string | null
          week_indicator: 'this_week' | 'next_week' | 'later' | null
          priority: 'low' | 'medium' | 'high' | null
          notify: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'not_started' | 'in_progress' | 'done' | 'abandoned'
          due_date?: string | null
          week_indicator?: 'this_week' | 'next_week' | 'later' | null
          priority?: 'low' | 'medium' | 'high' | null
          notify?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          project_id?: string | null
          assigned_to?: string | null
          status?: 'not_started' | 'in_progress' | 'done' | 'abandoned'
          due_date?: string | null
          week_indicator?: 'this_week' | 'next_week' | 'later' | null
          priority?: 'low' | 'medium' | 'high' | null
          notify?: boolean
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          content: string | null
          url: string | null
          project_id: string | null
          tags: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          content?: string | null
          url?: string | null
          project_id?: string | null
          tags?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          content?: string | null
          url?: string | null
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          name: string
          type: 'show' | 'movie' | 'podcast' | 'book' | 'other'
          description: string | null
          origin: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: 'show' | 'movie' | 'podcast' | 'book' | 'other'
          description?: string | null
          origin?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          name?: string
          type?: 'show' | 'movie' | 'podcast' | 'book' | 'other'
          description?: string | null
          origin?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          url: string | null
          tags: string[] | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          tags?: string[] | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          url?: string | null
          tags?: string[] | null
          notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'member' | 'collaborator'
      project_status: 'not_started' | 'in_progress' | 'done'
      task_status: 'not_started' | 'in_progress' | 'done' | 'abandoned'
      task_priority: 'low' | 'medium' | 'high'
      week_indicator: 'this_week' | 'next_week' | 'later'
      recommendation_type: 'show' | 'movie' | 'podcast' | 'book' | 'other'
      project_member_role: 'owner' | 'editor' | 'viewer'
    }
  }
}
