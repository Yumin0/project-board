-- AlterTable: classify each project into one of four fixed dashboard
-- quadrants (main / side / life / learn). All existing projects default to
-- "side" since they are all client/sub-business work.
ALTER TABLE "projects" ADD COLUMN "dashboardCategory" TEXT NOT NULL DEFAULT 'side';

-- CreateTable
CREATE TABLE "dashboard_pins" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "dashboard_pins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_pins_category_key" ON "dashboard_pins"("category");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_pins_projectId_key" ON "dashboard_pins"("projectId");

-- AddForeignKey
ALTER TABLE "dashboard_pins" ADD CONSTRAINT "dashboard_pins_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-table id sequence, matching the convention used by every other table
-- (see 20260607130000_renumber_ids_sequential).
CREATE SEQUENCE IF NOT EXISTS dashboard_pins_id_seq;
ALTER TABLE "dashboard_pins" ALTER COLUMN "id" SET DEFAULT nextval('dashboard_pins_id_seq')::text;
