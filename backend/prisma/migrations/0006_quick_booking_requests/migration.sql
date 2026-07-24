-- AuditLog.targetId is a polymorphic business target. The original foreign key
-- incorrectly restricted every audit entry to a Booking row.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_booking_fk";

CREATE TYPE "QuickBookingStatus" AS ENUM (
  'NEW',
  'CONTACTING',
  'CONTACTED',
  'CLOSED',
  'CANCELLED'
);

CREATE TYPE "QuickBookingSmsStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED'
);

CREATE TABLE "QuickBookingRequest" (
  "id" TEXT NOT NULL,
  "requestNumber" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "QuickBookingStatus" NOT NULL DEFAULT 'NEW',
  "smsStatus" "QuickBookingSmsStatus" NOT NULL DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "handledById" TEXT,
  "contactedAt" TIMESTAMP(3),
  "smsSentAt" TIMESTAMP(3),
  "smsLastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QuickBookingRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuickBookingRequest_requestNumber_key"
  ON "QuickBookingRequest"("requestNumber");
CREATE INDEX "QuickBookingRequest_phone_createdAt_idx"
  ON "QuickBookingRequest"("phone", "createdAt");
CREATE INDEX "QuickBookingRequest_status_createdAt_idx"
  ON "QuickBookingRequest"("status", "createdAt");
CREATE INDEX "QuickBookingRequest_vehicleId_startDate_endDate_idx"
  ON "QuickBookingRequest"("vehicleId", "startDate", "endDate");

ALTER TABLE "QuickBookingRequest"
  ADD CONSTRAINT "QuickBookingRequest_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuickBookingRequest"
  ADD CONSTRAINT "QuickBookingRequest_handledById_fkey"
  FOREIGN KEY ("handledById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
