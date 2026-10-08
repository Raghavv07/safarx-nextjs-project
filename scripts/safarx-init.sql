-- SafarX init migration — Prisma schema ke barabar SQL (Supabase Postgres).

CREATE TYPE "Role" AS ENUM ('user', 'partner', 'admin');
CREATE TYPE "PartnerStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "VideoKycStatus" AS ENUM ('not_required', 'pending', 'inprogress', 'approved', 'rejected');
CREATE TYPE "VehicleType" AS ENUM ('bike', 'car', 'loading', 'truck', 'auto');
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "BankStatus" AS ENUM ('not_added', 'added', 'verified');
CREATE TYPE "BookingStatus" AS ENUM ('idle', 'requested', 'awaiting_payment', 'confirmed', 'started', 'completed', 'cancelled', 'rejected', 'expired');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'cash', 'failed');
CREATE TYPE "ChatSender" AS ENUM ('user', 'driver');

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT,
  "role" "Role" NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "otp" TEXT,
  "otpExpiresAt" TIMESTAMPTZ,
  "socketId" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "mobileNumber" TEXT,
  "partnerOnboardingStep" INTEGER NOT NULL DEFAULT 0,
  "partnerStatus" "PartnerStatus" NOT NULL DEFAULT 'pending',
  "rejectionReason" TEXT,
  "videoKycStatus" "VideoKycStatus" NOT NULL DEFAULT 'not_required',
  "videoKycRoomId" TEXT,
  "videoKycRejectionReason" TEXT
);
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isOnline_idx" ON "User"("isOnline");
CREATE INDEX "User_partnerStatus_idx" ON "User"("partnerStatus");

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" "VehicleType" NOT NULL,
  "vehicleModel" TEXT NOT NULL,
  "number" TEXT NOT NULL UNIQUE,
  "imageUrl" TEXT,
  "baseFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "waitingCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pricePerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
  "rejectedReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");
CREATE INDEX "Vehicle_type_status_isActive_idx" ON "Vehicle"("type", "status", "isActive");

CREATE TABLE "PartnerDocs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "aadharUrl" TEXT NOT NULL,
  "rcUrl" TEXT NOT NULL,
  "licenseUrl" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
  "rejectedReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PartnerBank" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "accountHolder" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL UNIQUE,
  "ifsc" TEXT NOT NULL,
  "upi" TEXT,
  "status" "BankStatus" NOT NULL DEFAULT 'not_added',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "driverId" TEXT NOT NULL REFERENCES "User"("id"),
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
  "pickUpAddress" TEXT NOT NULL,
  "dropAddress" TEXT NOT NULL,
  "pickUpLat" DOUBLE PRECISION NOT NULL,
  "pickUpLng" DOUBLE PRECISION NOT NULL,
  "dropLat" DOUBLE PRECISION NOT NULL,
  "dropLng" DOUBLE PRECISION NOT NULL,
  "fare" DOUBLE PRECISION NOT NULL,
  "userMobileNumber" TEXT NOT NULL,
  "driverMobileNumber" TEXT NOT NULL,
  "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'idle',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "paymentDeadline" TIMESTAMPTZ,
  "adminCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "partnerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pickUpOtp" TEXT,
  "pickUpOtpExpires" TIMESTAMPTZ,
  "dropOtp" TEXT,
  "dropOtpExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_driverId_idx" ON "Booking"("driverId");
CREATE INDEX "Booking_vehicleId_idx" ON "Booking"("vehicleId");
CREATE INDEX "Booking_bookingStatus_idx" ON "Booking"("bookingStatus");

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookingId" TEXT NOT NULL REFERENCES "Booking"("id") ON DELETE CASCADE,
  "sender" "ChatSender" NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "ChatMessage_bookingId_createdAt_idx" ON "ChatMessage"("bookingId", "createdAt");
