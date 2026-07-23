CREATE TYPE "OwnerApplicationStatus" AS ENUM (
  'PENDING_REVIEW',
  'CONTACTING',
  'NEED_MORE_INFO',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

ALTER TABLE "OwnerLead"
  RENAME COLUMN "email" TO "legacyEmail";

ALTER TABLE "OwnerLead"
  ALTER COLUMN "legacyEmail" DROP NOT NULL,
  ADD COLUMN "applicationNumber" TEXT,
  ADD COLUMN "plateNumber" TEXT,
  ADD COLUMN "vehicleYear" INTEGER,
  ADD COLUMN "applicantNotes" TEXT,
  ADD COLUMN "adminNotes" TEXT,
  ADD COLUMN "status" "OwnerApplicationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "assignedStaffId" TEXT,
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "OwnerLead"
SET "applicationNumber" = 'OWN-LEGACY-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 8));

ALTER TABLE "OwnerLead"
  ALTER COLUMN "applicationNumber" SET NOT NULL,
  DROP COLUMN "legacyEmail";

CREATE UNIQUE INDEX "OwnerLead_applicationNumber_key" ON "OwnerLead"("applicationNumber");
CREATE INDEX "OwnerLead_phone_status_idx" ON "OwnerLead"("phone", "status");
CREATE INDEX "OwnerLead_status_createdAt_idx" ON "OwnerLead"("status", "createdAt");

ALTER TABLE "OwnerLead"
  ADD CONSTRAINT "OwnerLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "OwnerLead_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
  ADD COLUMN "providerMessageId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "NotificationLog_idempotencyKey_key" ON "NotificationLog"("idempotencyKey");
