"use server";

import { getCurrentUser } from "@/actions/auth";
import { prisma } from "@/lib/prisma";

export interface DriverDashboardData {
  driver: {
    id: string;
    name: string;
    email: string;
    mobileNumber: string | null;
    isOnline: boolean;
    lat: number | null;
    lng: number | null;
    partnerStatus: string;
    videoKycStatus: string;
    partnerOnboardingStep: number;
  };
  vehicle: {
    id: string;
    model: string;
    number: string;
    type: string;
    status: string;
  } | null;
  stats: {
    todayEarnings: number;
    todayTripsCount: number;
    totalEarnings: number;
    totalTripsCount: number;
  };
  activeTrip: {
    id: string;
    pickupAddress: string;
    dropAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    fare: number;
    partnerAmount: number;
    status: string;
    riderName: string;
    riderMobile: string;
    createdAt: string;
  } | null;
  pendingRequests: Array<{
    id: string;
    pickupAddress: string;
    dropAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    fare: number;
    partnerAmount: number;
    riderName: string;
    riderMobile: string;
    vehicleType: string;
    createdAt: string;
  }>;
}

/**
 * Fetches all real-time stats, vehicle details, active trips, and incoming ride requests for driver dashboard.
 */
export async function getDriverDashboardDataAction(): Promise<{
  success: boolean;
  data?: DriverDashboardData;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }
    if (user.isGuest) {
      return { success: false, error: "Guest riders cannot access Driver Dashboard" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        vehicles: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!dbUser) {
      return { success: false, error: "User account not found" };
    }

    // 1. Calculate Today's Date Window (from 00:00:00 local time)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Fetch completed bookings for this driver
    const completedBookings = await prisma.booking.findMany({
      where: {
        driverId: dbUser.id,
        bookingStatus: "completed",
      },
      select: {
        partnerAmount: true,
        createdAt: true,
      },
    });

    const totalEarnings = completedBookings.reduce((acc, b) => acc + (b.partnerAmount || 0), 0);
    const totalTripsCount = completedBookings.length;

    const todayBookings = completedBookings.filter(
      (b) => new Date(b.createdAt) >= todayStart
    );
    const todayEarnings = todayBookings.reduce((acc, b) => acc + (b.partnerAmount || 0), 0);
    const todayTripsCount = todayBookings.length;

    // 3. Fetch active ongoing trip (if any: confirmed or started)
    const rawActiveTrip = await prisma.booking.findFirst({
      where: {
        driverId: dbUser.id,
        bookingStatus: { in: ["confirmed", "started"] },
      },
      include: {
        user: { select: { name: true, mobileNumber: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const activeTrip = rawActiveTrip
      ? {
          id: rawActiveTrip.id,
          pickupAddress: rawActiveTrip.pickUpAddress,
          dropAddress: rawActiveTrip.dropAddress,
          pickupLat: rawActiveTrip.pickUpLat,
          pickupLng: rawActiveTrip.pickUpLng,
          dropLat: rawActiveTrip.dropLat,
          dropLng: rawActiveTrip.dropLng,
          fare: rawActiveTrip.fare,
          partnerAmount: rawActiveTrip.partnerAmount,
          status: rawActiveTrip.bookingStatus,
          riderName: rawActiveTrip.user?.name || "Rider",
          riderMobile: rawActiveTrip.userMobileNumber,
          createdAt: rawActiveTrip.createdAt.toISOString(),
        }
      : null;

    // 4. Fetch pending ride requests (status === 'requested')
    // Driver gets requests assigned to them OR matching their vehicle type within last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const vehicleType = dbUser.vehicles[0]?.type || "car";

    const rawPending = await prisma.booking.findMany({
      where: {
        bookingStatus: "requested",
        createdAt: { gte: twoMinutesAgo },
        OR: [
          { driverId: dbUser.id },
          { vehicle: { type: vehicleType } },
        ],
      },
      include: {
        user: { select: { name: true } },
        vehicle: { select: { type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const pendingRequests = rawPending.map((p) => ({
      id: p.id,
      pickupAddress: p.pickUpAddress,
      dropAddress: p.dropAddress,
      pickupLat: p.pickUpLat,
      pickupLng: p.pickUpLng,
      dropLat: p.dropLat,
      dropLng: p.dropLng,
      fare: p.fare,
      partnerAmount: p.partnerAmount,
      riderName: p.user?.name || "Rider",
      riderMobile: p.userMobileNumber,
      vehicleType: p.vehicle?.type || vehicleType,
      createdAt: p.createdAt.toISOString(),
    }));

    const vehicle = dbUser.vehicles[0]
      ? {
          id: dbUser.vehicles[0].id,
          model: dbUser.vehicles[0].vehicleModel,
          number: dbUser.vehicles[0].number,
          type: dbUser.vehicles[0].type,
          status: dbUser.vehicles[0].status,
        }
      : null;

    return {
      success: true,
      data: {
        driver: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          mobileNumber: dbUser.mobileNumber,
          isOnline: dbUser.isOnline,
          lat: dbUser.lat,
          lng: dbUser.lng,
          partnerStatus: dbUser.partnerStatus,
          videoKycStatus: dbUser.videoKycStatus,
          partnerOnboardingStep: dbUser.partnerOnboardingStep,
        },
        vehicle,
        stats: {
          todayEarnings,
          todayTripsCount,
          totalEarnings,
          totalTripsCount,
        },
        activeTrip,
        pendingRequests,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard";
    console.error("[getDriverDashboardDataAction Error]:", message);
    return { success: false, error: message };
  }
}

/**
 * Toggle Driver Online / Offline Duty Status
 */
export async function toggleDriverOnlineAction(isOnline: boolean): Promise<{
  success: boolean;
  isOnline?: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline },
      select: { isOnline: true },
    });

    return { success: true, isOnline: updated.isOnline };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle status";
    return { success: false, error: message };
  }
}

/**
 * Update Driver's Live GPS Coordinates (Periodic broadcaster)
 */
export async function updateDriverLocationAction(
  lat: number,
  lng: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return { success: false, error: "Unauthorized" };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lat: Number(lat),
        lng: Number(lng),
      },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "GPS update failed" };
  }
}

/**
 * Driver Accepts an incoming ride request
 */
export async function acceptRideRequestAction(bookingId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  booking?: {
    id: string;
    status: string;
    driverName: string;
    driverMobile: string | null;
    vehicleModel: string;
    vehicleNumber: string;
  };
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking request not found" };
    }

    if (booking.bookingStatus !== "requested") {
      return {
        success: false,
        error: "This ride is no longer available (already accepted or expired)",
      };
    }

    const driverVehicle = await prisma.vehicle.findFirst({
      where: { ownerId: user.id },
    });

    // Assign driver, vehicle, and update status to confirmed
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        driverId: user.id,
        driverMobileNumber: user.mobileNumber || "9876500001",
        ...(driverVehicle ? { vehicleId: driverVehicle.id } : {}),
        bookingStatus: "confirmed",
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
            lat: true,
            lng: true,
          },
        },
        vehicle: true,
      },
    });

    return {
      success: true,
      message: "Ride accepted! Head to the pickup location.",
      booking: {
        id: updated.id,
        status: updated.bookingStatus,
        driverName: updated.driver.name,
        driverMobile: updated.driver.mobileNumber,
        vehicleModel: updated.vehicle.vehicleModel,
        vehicleNumber: updated.vehicle.number,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to accept ride";
    return { success: false, error: message };
  }
}

/**
 * Driver Declines / Rejects an incoming ride request
 */
export async function rejectRideRequestAction(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return { success: false, error: "Unauthorized" };

    await prisma.booking.updateMany({
      where: { id: bookingId, bookingStatus: "requested" },
      data: { bookingStatus: "rejected" },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to reject ride" };
  }
}

/**
 * Driver Verifies Rider's 4-digit Pickup OTP and Starts Trip
 */
export async function verifyPickupOtpAndStartTripAction(
  bookingId: string,
  enteredOtp: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.driverId !== user.id) {
      return { success: false, error: "Invalid booking session" };
    }

    if (!booking.pickUpOtp) {
      return { success: false, error: "No OTP associated with this booking" };
    }

    if (booking.pickUpOtp.trim() !== enteredOtp.trim()) {
      return {
        success: false,
        error: "Incorrect OTP. Please ask the passenger for the 4-digit code on their screen.",
      };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { bookingStatus: "started" },
    });

    return { success: true, message: "OTP Verified! Trip started." };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Verification failed" };
  }
}

/**
 * Complete the Trip and record payment
 */
export async function completeTripAction(
  bookingId: string,
  paymentMethod: "cash" | "paid" = "cash"
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.driverId !== user.id) {
      return { success: false, error: "Invalid booking session" };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "completed",
        paymentStatus: paymentMethod === "cash" ? "cash" : "paid",
      },
    });

    return {
      success: true,
      message: `Trip completed successfully! Fare of ₹${booking.fare} recorded.`,
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to complete trip" };
  }
}
