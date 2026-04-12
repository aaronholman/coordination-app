-- ============================================
-- DROP OLD COORDINATION-APP SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ============================================
-- This removes the old couple-based app tables while preserving
-- auth.users (your login accounts stay intact).

-- Drop old triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON shopping_items;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
DROP TRIGGER IF EXISTS update_packing_items_updated_at ON packing_items;

-- Drop old functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_couple_id(UUID) CASCADE;

-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS packing_items CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS couples CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop old types if any exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS week_indicator CASCADE;
DROP TYPE IF EXISTS recommendation_type CASCADE;
DROP TYPE IF EXISTS project_member_role CASCADE;

-- Verify clean slate
-- You should see no tables when you run: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
