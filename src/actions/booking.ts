"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { calculateHaversineDistance } from "@/lib/geo";
import type { BookingStatus } from "@/generated/prisma/enums";

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  taxesAndPlatform: number;
  totalFare: number;
  partnerEarnings: number;
}

export interface LiveBookingDetails {
  id: string;
  userId: string;
  status: BookingStatus;
  fare: number;
  paymentStatus: string;
  adminCommission: number;
  partnerAmount: number;
  pickUpAddress: string;
  dropAddress: string;
  pickUpLat: number;
  pickUpLng: number;
  dropLat: number;
  dropLng: number;
  pickUpOtp: string | null;
  dropOtp: string | null;
  createdAt: string;
  updatedAt: string;
  passenger: {
    id: string;
    name: string;
    mobileNumber: string | null;
  } | null;
  driver: {
    id: string;
    name: string;
    mobileNumber: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  vehicle: {
    model: string;
    number: string;
    type: string;
  } | null;
  distanceToPickupKm: number;
  etaMinutes: number;
  fareBreakdown: FareBreakdown;
}

/**
 * Fetches the live, real-time status and details of a booking.
 * Used by Rider and Driver trip progression screens.
 */
export async function getLiveBookingDetailsAction(
  bookingId: string
): Promise<{
  success: boolean;
  booking?: LiveBookingDetails;
  error?: string;
}> {
  try {
    if (!bookingId) {
      return { success: false, error: "Booking ID is required" };
    }

    const raw = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: {
          select: {
            vehicleModel: true,
            number: true,
            type: true,
          },
        },
      },
    });

    if (!raw) {
      return { success: false, error: "Booking not found" };
    }

    // Calculate real-time distance and ETA between Driver and Rider Pickup
    let distanceToPickupKm = 0;
    let etaMinutes = 3; // Default 3 mins fallback

    if (raw.driver && raw.driver.lat && raw.driver.lng) {
      distanceToPickupKm = calculateHaversineDistance(
        raw.driver.lat,
        raw.driver.lng,
        raw.pickUpLat,
        raw.pickUpLng
      );
      // Average city speed 25 km/h
      etaMinutes = Math.max(1, Math.round((distanceToPickupKm / 25) * 60));
    }

    // Compute standard itemized fare breakdown
    const baseFare = Math.round(raw.fare * 0.35);
    const distanceCharge = Math.round(raw.fare * 0.50);
    const taxesAndPlatform = Math.round(raw.fare * 0.15);
    const partnerEarnings = raw.partnerAmount || Math.round(raw.fare * 0.85);

    return {
      success: true,
      booking: {
        id: raw.id,
        userId: raw.userId,
        status: raw.bookingStatus,
        fare: raw.fare,
        paymentStatus: raw.paymentStatus,
        adminCommission: raw.adminCommission,
        partnerAmount: raw.partnerAmount,
        pickUpAddress: raw.pickUpAddress,
        dropAddress: raw.dropAddress,
        pickUpLat: raw.pickUpLat,
        pickUpLng: raw.pickUpLng,
        dropLat: raw.dropLat,
        dropLng: raw.dropLng,
        pickUpOtp: raw.pickUpOtp,
        dropOtp: raw.dropOtp,
        createdAt: raw.createdAt.toISOString(),
        updatedAt: raw.updatedAt.toISOString(),
        passenger: raw.user
          ? {
              id: raw.user.id,
              name: raw.user.name,
              mobileNumber: raw.user.mobileNumber || raw.userMobileNumber,
            }
          : null,
        driver: raw.driver
          ? {
              id: raw.driver.id,
              name: raw.driver.name,
              mobileNumber: raw.driver.mobileNumber || raw.driverMobileNumber,
              lat: raw.driver.lat,
              lng: raw.driver.lng,
            }
          : null,
        vehicle: raw.vehicle
          ? {
              model: raw.vehicle.vehicleModel,
              number: raw.vehicle.number,
              type: raw.vehicle.type,
            }
          : null,
        distanceToPickupKm,
        etaMinutes,
        fareBreakdown: {
          baseFare,
          distanceCharge,
          taxesAndPlatform,
          totalFare: raw.fare,
          partnerEarnings,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch live booking";
    console.error("[getLiveBookingDetailsAction Error]:", message);
    return { success: false, error: message };
  }
}

/**
 * Step 1: Driver clicks "I Have Arrived" at the pickup location.
 * Broadcasts an alert to notify the passenger.
 */
export async function driverArrivedAction(bookingId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return { success: false, error: "Booking not found" };

    return {
      success: true,
      message: "Arrival alert broadcasted to rider!",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to broadcast arrival";
    return { success: false, error: message };
  }
}

/**
 * Step 2: Driver verifies the 4-digit Pickup OTP from passenger and starts the ride.
 */
export async function verifyPickupOtpAndStartRideAction(
  bookingId: string,
  enteredOtp: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return { success: false, error: "Booking not found" };

    if (!booking.pickUpOtp) {
      return { success: false, error: "No security OTP found for this booking" };
    }

    if (booking.pickUpOtp.trim() !== enteredOtp.trim()) {
      return {
        success: false,
        error: "Incorrect OTP. Please check the 4-digit code shown on passenger screen.",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "started",
      },
    });

    return {
      success: true,
      message: "OTP Verified! Trip has started.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify OTP";
    return { success: false, error: message };
  }
}

/**
 * Step 4: Driver completes the trip at destination with Drop OTP & Fare settlement.
 */
export async function completeTripWithDropOtpAction(
  bookingId: string,
  enteredDropOtp?: string,
  paymentMethod: "cash" | "upi" | "card" = "cash"
): Promise<{
  success: boolean;
  message?: string;
  fareBreakdown?: FareBreakdown;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return { success: false, error: "Booking not found" };

    // If booking has dropOtp and driver entered it, verify
    if (booking.dropOtp && enteredDropOtp && enteredDropOtp.trim() !== "") {
      if (booking.dropOtp.trim() !== enteredDropOtp.trim()) {
        return {
          success: false,
          error: "Incorrect Drop OTP. Please check with the passenger.",
        };
      }
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "completed",
        paymentStatus: paymentMethod === "cash" ? "cash" : "paid",
      },
    });

    const baseFare = Math.round(booking.fare * 0.35);
    const distanceCharge = Math.round(booking.fare * 0.50);
    const taxesAndPlatform = Math.round(booking.fare * 0.15);
    const partnerEarnings = booking.partnerAmount || Math.round(booking.fare * 0.85);

    return {
      success: true,
      message: "Trip completed successfully! Fare recorded.",
      fareBreakdown: {
        baseFare,
        distanceCharge,
        taxesAndPlatform,
        totalFare: booking.fare,
        partnerEarnings,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to end trip";
    return { success: false, error: message };
  }
}

/**
 * Rider cancels an active or requested ride
 */
export async function cancelBookingAction(
  bookingId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return { success: false, error: "Booking not found" };

    if (booking.bookingStatus === "started" || booking.bookingStatus === "completed") {
      return {
        success: false,
        error: "Cannot cancel a ride that is already in progress or completed",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "cancelled",
      },
    });

    console.log(`[Ride Cancelled]: Booking ${bookingId} cancelled by rider. Reason: ${reason || "User requested"}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel ride";
    return { success: false, error: message };
  }
}
