-- ============================================
-- SEED DATA — Imported from Notion
-- ============================================
-- NOTE: This seed uses placeholder UUIDs for created_by.
-- After Aaron signs up, run the following to claim ownership:
--   UPDATE projects SET created_by = '<aaron_user_id>';
--   UPDATE tasks SET created_by = '<aaron_user_id>';
--   UPDATE documents SET created_by = '<aaron_user_id>';
--   UPDATE recommendations SET created_by = '<aaron_user_id>';
--   UPDATE recipes SET created_by = '<aaron_user_id>';
-- We'll handle this in the app's first-run setup.

-- For now, we'll use a deferred approach: the app will seed data
-- on first admin login. This file documents the data structure.

-- ============================================
-- PROJECTS (from Notion export)
-- ============================================
-- These will be inserted via the app's seed endpoint:
--
-- 1.  Painting: 24 Central        (Done)
-- 2.  Final 21 Harrison Move Out  (Done)
-- 3.  The Darby                   (In progress)
-- 4.  HSCI                        (In progress)
-- 5.  Kids School                 (In progress)
-- 6.  Kids Health                 (In progress)
-- 7.  Health Care For All (HCFA)  (In progress)
-- 8.  21 Harrison Management      (Not started)
-- 9.  The Hoss                    (In progress)
-- 10. Exercise                    (Not started)
-- 11. Christmas 2025              (Done)
-- 12. Year end closeout           (Not started)
-- 13. Summer 2026                 (In progress)
-- 14. Live in Part Time Nanny     (In progress)
-- 15. Aaron Personal              (Not started)
-- 16. Budget                      (In progress)

-- ============================================
-- TASKS (52 from Notion export)
-- ============================================
-- Each task maps to a project above and is assigned to Aaron or Michaela.
-- Full data is in /src/lib/seed-data.ts

-- ============================================
-- DOCUMENTS (21 from Notion export)
-- ============================================
-- Tagged by category, linked to projects where applicable.

-- ============================================
-- RECOMMENDATIONS (9 from Notion export)
-- ============================================
-- Shows, movies, podcasts.

-- ============================================
-- RECIPES (7 from Notion export)
-- ============================================
-- Family recipe collection.
