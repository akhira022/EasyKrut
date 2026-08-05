-- AlterTable
ALTER TABLE "OrgTemplate" ADD COLUMN "agencyName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrgTemplate" ADD COLUMN "agencyAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrgTemplate" ADD COLUMN "contactUnit" TEXT NOT NULL DEFAULT '';

-- Backfill from legacy department
UPDATE "OrgTemplate" SET "agencyName" = "department" WHERE "agencyName" = '' AND "department" != '';
