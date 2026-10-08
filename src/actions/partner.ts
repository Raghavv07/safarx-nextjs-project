"use server";

import { getCurrentUser } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import type { VehicleType } from "@/generated/prisma/enums";

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  nextStep?: number;
}

/**
 * Step 1: Save Partner Contact / Profile details
 */
export async function savePartnerPersonalInfoAction(formData: {
  mobileNumber: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Authentication required" };
    if (user.isGuest) {
      return {
        success: false,
        error: "Guest riders cannot register as partners. Please sign up or log in with a permanent account.",
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mobileNumber: formData.mobileNumber,
        role: "partner",
        partnerOnboardingStep: 1,
      },
    });

    return { success: true, nextStep: 2, message: "Profile saved successfully" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save profile";
    return { success: false, error: message };
  }
}

/**
 * Step 2: Save Vehicle details
 */
export async function savePartnerVehicleAction(data: {
  type: VehicleType;
  vehicleModel: string;
  number: string;
  imageUrl?: string;
  baseFare?: number;
  pricePerKm?: number;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Authentication required" };
    if (user.isGuest) {
      return {
        success: false,
        error: "Guest riders cannot register as partners. Please sign up or log in.",
      };
    }

    // Check if vehicle with same plate number exists
    const existing = await prisma.vehicle.findUnique({
      where: { number: data.number },
    });

    if (existing && existing.ownerId !== user.id) {
      return {
        success: false,
        error: "A vehicle with this registration plate number is already registered.",
      };
    }

    if (existing) {
      await prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          type: data.type,
          vehicleModel: data.vehicleModel,
          imageUrl: data.imageUrl,
          baseFare: data.baseFare || 50,
          pricePerKm: data.pricePerKm || 15,
        },
      });
    } else {
      await prisma.vehicle.create({
        data: {
          ownerId: user.id,
          type: data.type,
          vehicleModel: data.vehicleModel,
          number: data.number,
          imageUrl: data.imageUrl,
          baseFare: data.baseFare || 50,
          pricePerKm: data.pricePerKm || 15,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { partnerOnboardingStep: 2 },
    });

    return { success: true, nextStep: 3, message: "Vehicle registered successfully" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to register vehicle";
    return { success: false, error: message };
  }
}

/**
 * Step 3: Save Document URLs (Aadhaar, Driving License, RC)
 */
export async function savePartnerDocsAction(data: {
  aadharUrl: string;
  licenseUrl: string;
  rcUrl: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Authentication required" };
    if (user.isGuest) {
      return {
        success: false,
        error: "Guest riders cannot register as partners. Please sign up or log in.",
      };
    }

    await prisma.partnerDocs.upsert({
      where: { ownerId: user.id },
      create: {
        ownerId: user.id,
        aadharUrl: data.aadharUrl,
        licenseUrl: data.licenseUrl,
        rcUrl: data.rcUrl,
        status: "pending",
      },
      update: {
        aadharUrl: data.aadharUrl,
        licenseUrl: data.licenseUrl,
        rcUrl: data.rcUrl,
        status: "pending",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { partnerOnboardingStep: 3 },
    });

    return { success: true, nextStep: 4, message: "Documents submitted for verification" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save documents";
    return { success: false, error: message };
  }
}

/**
 * Step 4: Save Bank Account details
 */
export async function savePartnerBankAction(data: {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  upi?: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Authentication required" };
    if (user.isGuest) {
      return {
        success: false,
        error: "Guest riders cannot register as partners. Please sign up or log in.",
      };
    }

    await prisma.partnerBank.upsert({
      where: { ownerId: user.id },
      create: {
        ownerId: user.id,
        accountHolder: data.accountHolder,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc.toUpperCase(),
        upi: data.upi,
        status: "added",
      },
      update: {
        accountHolder: data.accountHolder,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc.toUpperCase(),
        upi: data.upi,
        status: "added",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        partnerOnboardingStep: 4,
        partnerStatus: "pending",
        videoKycStatus: "pending",
      },
    });

    return { success: true, nextStep: 5, message: "Bank details saved successfully" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save bank details";
    return { success: false, error: message };
  }
}

/**
 * Fetches the current user's onboarding progress and submitted details
 */
export async function getPartnerOnboardingDetailsAction() {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) return null;

    const partnerData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        vehicles: true,
        partnerDocs: true,
        partnerBank: true,
      },
    });

    return partnerData;
  } catch {
    return null;
  }
}

/**
 * Checks if the current user is eligible to onboard as a partner (not a guest)
 */
export async function checkPartnerEligibilityAction() {
  const user = await getCurrentUser();
  if (!user) return { isAuthenticated: false, isGuest: false, name: "" };
  return { isAuthenticated: true, isGuest: user.isGuest, name: user.name };
}

