-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_key" ON "accounts"("name");

-- CreateTable
CREATE TABLE "income_records" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "accountId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Per-table id sequences, matching the convention used by every other table
-- (see 20260607130000_renumber_ids_sequential): ids are sequential integers
-- stored as text, with new rows defaulting to nextval(<table>_id_seq).
CREATE SEQUENCE IF NOT EXISTS accounts_id_seq;
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT nextval('accounts_id_seq')::text;

CREATE SEQUENCE IF NOT EXISTS income_records_id_seq;
ALTER TABLE "income_records" ALTER COLUMN "id" SET DEFAULT nextval('income_records_id_seq')::text;

-- Seed the initial virtual income accounts
INSERT INTO "accounts" ("id", "name", "createdAt", "updatedAt") VALUES
    (nextval('accounts_id_seq')::text, '專案總收入帳戶', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('accounts_id_seq')::text, 'Yumin收入帳戶', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (nextval('accounts_id_seq')::text, '業務收入帳戶', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
