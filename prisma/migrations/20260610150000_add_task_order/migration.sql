-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve existing creation order per project
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "tasks"
)
UPDATE "tasks"
SET "order" = ranked.rn
FROM ranked
WHERE "tasks".id = ranked.id;
