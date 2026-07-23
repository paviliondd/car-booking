CREATE TABLE "OwnerLead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "carName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnerLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "channel" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "NotificationLog_userId_createdAt_idx" ON "NotificationLog"("userId", "createdAt");
