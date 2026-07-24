ALTER TABLE "QuickBookingRequest"
  ADD COLUMN "bookingId" TEXT;

CREATE UNIQUE INDEX "QuickBookingRequest_bookingId_key"
  ON "QuickBookingRequest"("bookingId");

ALTER TABLE "QuickBookingRequest"
  ADD CONSTRAINT "QuickBookingRequest_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
