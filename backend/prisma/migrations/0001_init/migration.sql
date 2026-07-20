CREATE SCHEMA IF NOT EXISTS "public";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER', 'OWNER');
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'LOCKED');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RENTING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DEPOSITED', 'PAID', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('MOMO', 'BANK_TRANSFER', 'CASH');
CREATE TYPE "CustomerSegment" AS ENUM ('REGULAR', 'VIP', 'BLACKLIST');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL,
  "name" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "avatar" TEXT, "phone" TEXT, "idCardNo" TEXT, "address" TEXT,
  "isVerifiedOwner" BOOLEAN NOT NULL DEFAULT false, "ownerRequestAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Customer" (
  "id" TEXT NOT NULL, "userId" TEXT, "phone" TEXT NOT NULL, "fullName" TEXT NOT NULL,
  "idCardNo" TEXT NOT NULL, "idCardFront" TEXT, "idCardBack" TEXT, "driverLicense" TEXT,
  "segment" "CustomerSegment" NOT NULL DEFAULT 'REGULAR', "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "affiliateId" TEXT, CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL, "plateNumber" TEXT NOT NULL, "brand" TEXT NOT NULL, "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL, "seats" INTEGER NOT NULL, "transmission" TEXT NOT NULL, "fuel" TEXT NOT NULL,
  "color" TEXT NOT NULL, "dailyPrice" DOUBLE PRECISION NOT NULL, "weekendPrice" DOUBLE PRECISION NOT NULL,
  "holidayPrice" DOUBLE PRECISION NOT NULL, "penaltyRate" DOUBLE PRECISION NOT NULL, "images" TEXT[],
  "videoUrl" TEXT, "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE', "limitKmPerDay" DOUBLE PRECISION,
  "overLimitFee" DOUBLE PRECISION, "pickupLocation" TEXT NOT NULL DEFAULT 'Showroom Khuất Duy Tiến',
  "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION, "terms" TEXT, "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Booking" (
  "id" TEXT NOT NULL, "bookingNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL, "vehicleId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL, "pickupLocation" TEXT NOT NULL,
  "dropoffLocation" TEXT NOT NULL, "totalDays" INTEGER NOT NULL, "basePrice" DOUBLE PRECISION NOT NULL,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "totalPrice" DOUBLE PRECISION NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING', "notes" TEXT, "couponCode" TEXT, "staffId" TEXT,
  "insuranceType" TEXT NOT NULL DEFAULT 'NONE', "insuranceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "depositPercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0, "depositAmount" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID', "method" "PaymentMethod" NOT NULL,
  "transactionId" TEXT, "paidAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Contract" (
  "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "renterSignature" TEXT, "ownerSignature" TEXT,
  "signedAt" TIMESTAMP(3), "pdfUrl" TEXT, "terms" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Review" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "rating" INTEGER NOT NULL,
  "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "subject" TEXT NOT NULL, "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "reply" TEXT, "repliedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL, "senderId" TEXT NOT NULL, "receiverId" TEXT NOT NULL, "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Maintenance" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "type" TEXT NOT NULL, "scheduledDate" TIMESTAMP(3) NOT NULL,
  "completedDate" TIMESTAMP(3), "cost" DOUBLE PRECISION NOT NULL DEFAULT 0, "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Expense" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "category" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Revenue" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Coupon" (
  "code" TEXT NOT NULL, "discountType" TEXT NOT NULL, "value" DOUBLE PRECISION NOT NULL,
  "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0, "maxDiscount" DOUBLE PRECISION,
  "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3) NOT NULL, "usageLimit" INTEGER NOT NULL,
  "usedCount" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("code")
);
CREATE TABLE "Affiliate" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05, "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "targetTable" TEXT NOT NULL,
  "targetId" TEXT NOT NULL, "oldValue" JSONB, "newValue" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_idCardNo_key" ON "User"("idCardNo");
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "Customer_idCardNo_key" ON "Customer"("idCardNo");
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE UNIQUE INDEX "Contract_bookingId_key" ON "Contract"("bookingId");
CREATE UNIQUE INDEX "Revenue_bookingId_key" ON "Revenue"("bookingId");
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_couponCode_fkey" FOREIGN KEY ("couponCode") REFERENCES "Coupon"("code") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_booking_fk" FOREIGN KEY ("targetId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
