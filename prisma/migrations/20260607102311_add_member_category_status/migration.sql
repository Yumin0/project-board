-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "category" TEXT,
ALTER COLUMN "status" SET DEFAULT 'not_started';

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_name_key" ON "members"("name");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
