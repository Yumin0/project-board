-- CreateTable
CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_logs_date_category_key" ON "work_logs"("date", "category");

-- Per-table id sequence, matching the convention used by every other table
-- (see 20260607130000_renumber_ids_sequential).
CREATE SEQUENCE IF NOT EXISTS work_logs_id_seq;
ALTER TABLE "work_logs" ALTER COLUMN "id" SET DEFAULT nextval('work_logs_id_seq')::text;
