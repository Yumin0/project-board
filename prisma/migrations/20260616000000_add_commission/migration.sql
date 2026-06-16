-- Add accountId to members (links a member to their income account)
ALTER TABLE "members" ADD COLUMN "accountId" TEXT;

ALTER TABLE "members" ADD CONSTRAINT "members_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable commission_records
CREATE SEQUENCE IF NOT EXISTS commission_records_id_seq;

CREATE TABLE "commission_records" (
    "id" TEXT NOT NULL DEFAULT nextval('commission_records_id_seq')::text,
    "month" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "consultingFee" INTEGER NOT NULL DEFAULT 0,
    "productionFee" INTEGER NOT NULL,
    "salesPaidAt" TIMESTAMP(3),
    "consultingPaidAt" TIMESTAMP(3),
    "productionPaidAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "productionMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commission_records_projectId_key" ON "commission_records"("projectId");

ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_productionMemberId_fkey"
  FOREIGN KEY ("productionMemberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
