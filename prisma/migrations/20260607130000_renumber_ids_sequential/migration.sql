-- Renumber existing rows in every table to sequential integers stored as text
-- ("1", "2", "3", ...), ordered by createdAt, then make new rows default to
-- the next number in a per-table sequence so ids stay sequential going forward.
--
-- All foreign keys here were created with ON UPDATE CASCADE, so updating a
-- parent row's id automatically rewrites the matching child foreign-key
-- columns. The one reference that ISN'T a real foreign key is
-- projects.customFieldValues, a JSON object keyed by category_fields.id —
-- that gets rewritten explicitly using an old-id -> new-id map.

-- 1. members (cascades to projects.assigneeId)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn FROM members
)
UPDATE members m SET id = ranked.rn::text
FROM ranked WHERE m.id = ranked.id;

-- 2. categories (cascades to projects.categoryId and category_fields.categoryId)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn FROM categories
)
UPDATE categories c SET id = ranked.rn::text
FROM ranked WHERE c.id = ranked.id;

-- 3. category_fields: build an old -> new id map first so the JSON keys in
--    projects.customFieldValues can be rewritten before the ids change.
CREATE TEMP TABLE category_field_id_map AS
SELECT id AS old_id, ROW_NUMBER() OVER (ORDER BY "createdAt")::text AS new_id
FROM category_fields;

UPDATE projects p
SET "customFieldValues" = remapped.value
FROM (
  SELECT p2.id AS project_id,
         jsonb_object_agg(COALESCE(m.new_id, kv.key), kv.value) AS value
  FROM projects p2
  CROSS JOIN LATERAL jsonb_each(p2."customFieldValues") AS kv
  LEFT JOIN category_field_id_map m ON m.old_id = kv.key
  WHERE p2."customFieldValues" IS NOT NULL AND p2."customFieldValues" <> '{}'::jsonb
  GROUP BY p2.id
) AS remapped
WHERE p.id = remapped.project_id;

UPDATE category_fields cf SET id = m.new_id
FROM category_field_id_map m WHERE cf.id = m.old_id;

DROP TABLE category_field_id_map;

-- 4. projects (cascades to tasks.projectId)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn FROM projects
)
UPDATE projects p SET id = ranked.rn::text
FROM ranked WHERE p.id = ranked.id;

-- 5. tasks
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn FROM tasks
)
UPDATE tasks t SET id = ranked.rn::text
FROM ranked WHERE t.id = ranked.id;

-- Per-table sequences positioned past the highest existing id, wired up as
-- the id column's default so future inserts keep counting up from there.
-- setval's 2nd argument must be >= 1, so empty tables need is_called = false
-- (next nextval() returns 1) instead of setval(seq, 0) which errors out.
CREATE SEQUENCE IF NOT EXISTS members_id_seq;
SELECT setval('members_id_seq', GREATEST(max_id, 1), max_id IS NOT NULL)
FROM (SELECT MAX(id::int) AS max_id FROM members) t;
ALTER TABLE members ALTER COLUMN id SET DEFAULT nextval('members_id_seq')::text;

CREATE SEQUENCE IF NOT EXISTS categories_id_seq;
SELECT setval('categories_id_seq', GREATEST(max_id, 1), max_id IS NOT NULL)
FROM (SELECT MAX(id::int) AS max_id FROM categories) t;
ALTER TABLE categories ALTER COLUMN id SET DEFAULT nextval('categories_id_seq')::text;

CREATE SEQUENCE IF NOT EXISTS category_fields_id_seq;
SELECT setval('category_fields_id_seq', GREATEST(max_id, 1), max_id IS NOT NULL)
FROM (SELECT MAX(id::int) AS max_id FROM category_fields) t;
ALTER TABLE category_fields ALTER COLUMN id SET DEFAULT nextval('category_fields_id_seq')::text;

CREATE SEQUENCE IF NOT EXISTS projects_id_seq;
SELECT setval('projects_id_seq', GREATEST(max_id, 1), max_id IS NOT NULL)
FROM (SELECT MAX(id::int) AS max_id FROM projects) t;
ALTER TABLE projects ALTER COLUMN id SET DEFAULT nextval('projects_id_seq')::text;

CREATE SEQUENCE IF NOT EXISTS tasks_id_seq;
SELECT setval('tasks_id_seq', GREATEST(max_id, 1), max_id IS NOT NULL)
FROM (SELECT MAX(id::int) AS max_id FROM tasks) t;
ALTER TABLE tasks ALTER COLUMN id SET DEFAULT nextval('tasks_id_seq')::text;
