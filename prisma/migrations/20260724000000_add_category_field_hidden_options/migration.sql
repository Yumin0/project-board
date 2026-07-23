-- Options that stay in `options` (so existing projects keep their value) but
-- are no longer offered when picking a value in the project form.
ALTER TABLE "category_fields"
  ADD COLUMN IF NOT EXISTS "hiddenOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
