-- CreateTable: Prisma implicit many-to-many join table for Project <-> Member
CREATE TABLE "_MemberToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Migrate existing single assigneeId data into the join table
INSERT INTO "_MemberToProject" ("A", "B")
SELECT "assigneeId", "id"
FROM "projects"
WHERE "assigneeId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_MemberToProject_AB_unique" ON "_MemberToProject"("A", "B");
CREATE INDEX "_MemberToProject_B_index" ON "_MemberToProject"("B");

-- AddForeignKey
ALTER TABLE "_MemberToProject" ADD CONSTRAINT "_MemberToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MemberToProject" ADD CONSTRAINT "_MemberToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_assigneeId_fkey";

-- DropColumn
ALTER TABLE "projects" DROP COLUMN "assigneeId";
