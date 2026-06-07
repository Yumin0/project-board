-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateTable
CREATE TABLE "category_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "category_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_fields_categoryId_name_key" ON "category_fields"("categoryId", "name");

-- AddForeignKey
ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "categoryId" TEXT,
ADD COLUMN "customFieldValues" JSONB;

-- Backfill: turn each distinct existing free-text category into a Category row
INSERT INTO "categories" ("id", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, distinct_categories."category", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "category"
    FROM "projects"
    WHERE "category" IS NOT NULL AND "category" <> ''
) AS distinct_categories;

-- Backfill: link existing projects to their newly created category
UPDATE "projects" p
SET "categoryId" = c."id"
FROM "categories" c
WHERE p."category" = c."name";

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: drop the old free-text category column now that data lives in categories
ALTER TABLE "projects" DROP COLUMN "category";
