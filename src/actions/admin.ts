"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import type { PartnerStatus, VideoKycStatus, ApprovalStatus } from "@/generated/prisma/enums";

export interface AdminMetrics {
  totalRides: number;
  completedRides: number;
  activeDutyDrivers: number;
  totalPlatformCommission: number;
  totalGrossFare: number;
  pendingPartnersCount: number;
  pendingKycCount: number;
  approvedPartnersCount: number;
}

export interface PartnerVerificationItem {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  partnerStatus: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  partnerOnboardingStep: number;
  videoKycStatus: "not_required" | "pending" | "inprogress" | "approved" | "rejected";
  videoKycRoomId: string | null;
  videoKycRejectionReason: string | null;
  isOnline: boolean;
  createdAt: string;
  partnerDocs: {
    aadharUrl: string;
    rcUrl: string;
    licenseUrl: string;
    status: "pending" | "approved" | "rejected";
    rejectedReason: string | null;
  } | null;
  vehicles: Array<{
    id: string;
    type: string;
    vehicleModel: string;
    number: string;
    status: "pending" | "approved" | "rejected";
    rejectedReason: string | null;
  }>;
  partnerBank: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    upi: string | null;
    status: string;
  } | null;
}

export interface RecentBookingItem {
  id: string;
  pickUpAddress: string;
  dropAddress: string;
  fare: number;
  adminCommission: number;
  partnerAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    mobileNumber: string | null;
  };
  driver: {
    name: string;
    mobileNumber: string | null;
  } | null;
  vehicle: {
    vehicleModel: string;
    number: string;
    type: string;
  } | null;
}

export interface AdminOverviewData {
  metrics: AdminMetrics;
  partners: PartnerVerificationItem[];
  recentBookings: RecentBookingItem[];
}

/**
 * Ensures user is authenticated and has admin privileges.
 */
async function verifyAdminAuth() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Authentication required");
  }
  if (currentUser.role !== "admin") {
    throw new Error("Admin privileges required");
  }
  return currentUser;
}

/**
 * Promotes the current user to Admin (useful for initial platform setup & testing).
 */
export async function promoteCurrentUserToAdminAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Please log in first" };
    }

    // Upsert or update in Prisma DB
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "admin",
      },
      update: {
        role: "admin",
      },
    });

    // If guest session cookie exists, also update cookie role to admin
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get("safarx_guest_session")?.value;
    if (guestCookie) {
      try {
        const guestData = JSON.parse(guestCookie);
        guestData.role = "admin";
        cookieStore.set("safarx_guest_session", JSON.stringify(guestData), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
      } catch (e) {
        console.error("Failed to update guest cookie role", e);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to promote user";
    return { success: false, error: msg };
  }
}

/**
 * Fetches the complete admin dashboard overview (metrics, pending drivers, bookings).
 */
export async function getAdminOverviewAction(): Promise<{
  success: boolean;
  data?: AdminOverviewData;
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    // 1. Metrics aggregation
    const [
      totalRides,
      completedRides,
      activeDutyDrivers,
      commissionAgg,
      fareAgg,
      pendingPartnersCount,
      pendingKycCount,
      approvedPartnersCount,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { bookingStatus: "completed" } }),
      prisma.user.count({ where: { role: "partner", isOnline: true } }),
      prisma.booking.aggregate({ _sum: { adminCommission: true } }),
      prisma.booking.aggregate({ _sum: { fare: true } }),
      prisma.user.count({ where: { role: "partner", partnerStatus: "pending" } }),
      prisma.user.count({
        where: {
          role: "partner",
          videoKycStatus: { in: ["pending", "inprogress"] },
        },
      }),
      prisma.user.count({ where: { role: "partner", partnerStatus: "approved" } }),
    ]);

    // 2. Fetch driver partners
    const partnersData = await prisma.user.findMany({
      where: { role: "partner" },
      include: {
        partnerDocs: true,
        vehicles: true,
        partnerBank: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 3. Fetch recent bookings
    const bookingsData = await prisma.booking.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, mobileNumber: true } },
        driver: { select: { name: true, mobileNumber: true } },
        vehicle: { select: { vehicleModel: true, number: true, type: true } },
      },
    });

    const metrics: AdminMetrics = {
      totalRides,
      completedRides,
      activeDutyDrivers,
      totalPlatformCommission: commissionAgg._sum.adminCommission || 0,
      totalGrossFare: fareAgg._sum.fare || 0,
      pendingPartnersCount,
      pendingKycCount,
      approvedPartnersCount,
    };

    const partners: PartnerVerificationItem[] = partnersData.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      mobileNumber: p.mobileNumber,
      partnerStatus: p.partnerStatus as "pending" | "approved" | "rejected",
      rejectionReason: p.rejectionReason,
      partnerOnboardingStep: p.partnerOnboardingStep,
      videoKycStatus: p.videoKycStatus as "not_required" | "pending" | "inprogress" | "approved" | "rejected",
      videoKycRoomId: p.videoKycRoomId,
      videoKycRejectionReason: p.videoKycRejectionReason,
      isOnline: p.isOnline,
      createdAt: p.createdAt.toISOString(),
      partnerDocs: p.partnerDocs
        ? {
            aadharUrl: p.partnerDocs.aadharUrl,
            rcUrl: p.partnerDocs.rcUrl,
            licenseUrl: p.partnerDocs.licenseUrl,
            status: p.partnerDocs.status as "pending" | "approved" | "rejected",
            rejectedReason: p.partnerDocs.rejectedReason,
          }
        : null,
      vehicles: p.vehicles.map((v) => ({
        id: v.id,
        type: v.type,
        vehicleModel: v.vehicleModel,
        number: v.number,
        status: v.status as "pending" | "approved" | "rejected",
        rejectedReason: v.rejectedReason,
      })),
      partnerBank: p.partnerBank
        ? {
            accountHolder: p.partnerBank.accountHolder,
            accountNumber: p.partnerBank.accountNumber,
            ifsc: p.partnerBank.ifsc,
            upi: p.partnerBank.upi,
            status: p.partnerBank.status,
          }
        : null,
    }));

    const recentBookings: RecentBookingItem[] = bookingsData.map((b) => ({
      id: b.id,
      pickUpAddress: b.pickUpAddress,
      dropAddress: b.dropAddress,
      fare: b.fare,
      adminCommission: b.adminCommission,
      partnerAmount: b.partnerAmount,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      createdAt: b.createdAt.toISOString(),
      user: {
        name: b.user?.name || "Passenger",
        email: b.user?.email || "",
        mobileNumber: b.user?.mobileNumber || null,
      },
      driver: b.driver
        ? {
            name: b.driver.name,
            mobileNumber: b.driver.mobileNumber,
          }
        : null,
      vehicle: b.vehicle
        ? {
            vehicleModel: b.vehicle.vehicleModel,
            number: b.vehicle.number,
            type: b.vehicle.type,
          }
        : null,
    }));

    return {
      success: true,
      data: {
        metrics,
        partners,
        recentBookings,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load admin overview";
    console.error("[getAdminOverviewAction Error]:", message);
    return { success: false, error: message };
  }
}

/**
 * One-click approve or reject a driver partner profile.
 */
export async function updatePartnerApprovalAction(
  partnerId: string,
  status: "approved" | "rejected" | "pending",
  rejectionReason?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await verifyAdminAuth();

    if (!partnerId) {
      return { success: false, error: "Partner ID is required" };
    }

    const partnerStatusVal = status as PartnerStatus;
    const approvalStatusVal = status as ApprovalStatus;

    // 1. Update User partnerStatus
    await prisma.user.update({
      where: { id: partnerId },
      data: {
        partnerStatus: partnerStatusVal,
        rejectionReason: status === "rejected" ? rejectionReason || "Documents rejected by admin" : null,
        partnerOnboardingStep: status === "approved" ? 4 : undefined,
      },
    });

    // 2. Cascade status to PartnerDocs and Vehicles
    await prisma.partnerDocs.updateMany({
      where: { ownerId: partnerId },
      data: {
        status: approvalStatusVal,
        rejectedReason: status === "rejected" ? rejectionReason || "Documents rejected" : null,
      },
    });

    await prisma.vehicle.updateMany({
      where: { ownerId: partnerId },
      data: {
        status: approvalStatusVal,
        rejectedReason: status === "rejected" ? rejectionReason || "Vehicle rejected" : null,
      },
    });

    const msg =
      status === "approved"
        ? "Driver partner has been approved successfully. They can now go online."
        : status === "rejected"
        ? `Driver partner rejected: ${rejectionReason || "Reason not specified"}`
        : "Partner status updated.";

    return { success: true, message: msg };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update partner approval";
    console.error("[updatePartnerApprovalAction Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Update Driver Video KYC status (and optionally auto-approve entire profile).
 */
export async function updatePartnerKycStatusAction(
  partnerId: string,
  status: "approved" | "rejected" | "inprogress" | "pending",
  rejectionReason?: string,
  autoApprovePartner: boolean = false
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await verifyAdminAuth();

    if (!partnerId) {
      return { success: false, error: "Partner ID is required" };
    }

    const kycStatusVal = status as VideoKycStatus;

    await prisma.user.update({
      where: { id: partnerId },
      data: {
        videoKycStatus: kycStatusVal,
        videoKycRejectionReason: status === "rejected" ? rejectionReason || "Video KYC rejected" : null,
      },
    });

    // If autoApprovePartner is true and status is approved, also approve partner profile
    if (autoApprovePartner && status === "approved") {
      await updatePartnerApprovalAction(partnerId, "approved");
    }

    const msg =
      status === "approved"
        ? "Video KYC approved successfully!"
        : status === "rejected"
        ? `Video KYC rejected: ${rejectionReason || "Identity mismatch"}`
        : "Video KYC status updated.";

    return { success: true, message: msg };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update video KYC status";
    console.error("[updatePartnerKycStatusAction Error]:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetch a single driver's full document & KYC details for Compliance Officer view.
 */
export async function getPartnerDetailsForKycAction(partnerId: string): Promise<{
  success: boolean;
  data?: PartnerVerificationItem;
  error?: string;
}> {
  try {
    await verifyAdminAuth();

    const p = await prisma.user.findUnique({
      where: { id: partnerId },
      include: {
        partnerDocs: true,
        vehicles: true,
        partnerBank: true,
      },
    });

    if (!p) {
      return { success: false, error: "Driver partner not found" };
    }

    const item: PartnerVerificationItem = {
      id: p.id,
      name: p.name,
      email: p.email,
      mobileNumber: p.mobileNumber,
      partnerStatus: p.partnerStatus as "pending" | "approved" | "rejected",
      rejectionReason: p.rejectionReason,
      partnerOnboardingStep: p.partnerOnboardingStep,
      videoKycStatus: p.videoKycStatus as "not_required" | "pending" | "inprogress" | "approved" | "rejected",
      videoKycRoomId: p.videoKycRoomId,
      videoKycRejectionReason: p.videoKycRejectionReason,
      isOnline: p.isOnline,
      createdAt: p.createdAt.toISOString(),
      partnerDocs: p.partnerDocs
        ? {
            aadharUrl: p.partnerDocs.aadharUrl,
            rcUrl: p.partnerDocs.rcUrl,
            licenseUrl: p.partnerDocs.licenseUrl,
            status: p.partnerDocs.status as "pending" | "approved" | "rejected",
            rejectedReason: p.partnerDocs.rejectedReason,
          }
        : null,
      vehicles: p.vehicles.map((v) => ({
        id: v.id,
        type: v.type,
        vehicleModel: v.vehicleModel,
        number: v.number,
        status: v.status as "pending" | "approved" | "rejected",
        rejectedReason: v.rejectedReason,
      })),
      partnerBank: p.partnerBank
        ? {
            accountHolder: p.partnerBank.accountHolder,
            accountNumber: p.partnerBank.accountNumber,
            ifsc: p.partnerBank.ifsc,
            upi: p.partnerBank.upi,
            status: p.partnerBank.status,
          }
        : null,
    };

    return { success: true, data: item };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load partner KYC details";
    return { success: false, error: errorMsg };
  }
}
