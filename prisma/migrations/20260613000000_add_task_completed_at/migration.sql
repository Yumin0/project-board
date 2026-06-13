-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tasks_status_completedAt_idx" ON "tasks"("status", "completedAt");
