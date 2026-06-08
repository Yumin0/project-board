-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "note" TEXT,
    "projectId" TEXT,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Per-table id sequence, matching the convention used by every other table
-- (see 20260607130000_renumber_ids_sequential).
CREATE SEQUENCE IF NOT EXISTS transfers_id_seq;
ALTER TABLE "transfers" ALTER COLUMN "id" SET DEFAULT nextval('transfers_id_seq')::text;

-- New virtual accounts referenced by historical transfer records
INSERT INTO "accounts" ("id", "name", "createdAt", "updatedAt") VALUES
    (nextval('accounts_id_seq')::text, '耀輝收入', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('accounts_id_seq')::text, '哥哥收入', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('accounts_id_seq')::text, '3元收入', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
