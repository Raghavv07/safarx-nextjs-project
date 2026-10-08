"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import type { PayoutMethod, PayoutStatus, BankStatus } from "@/generated/prisma/enums";

export interface WalletMetrics {
  lifetimeEarnings: number;
  totalTrips: number;
  settledAmount: number;
  pendingPayoutAmount: number;
  withdrawableBalance: number;
}

export interface BankDetailsData {
  accountHolder: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifsc: string;
  upi: string | null;
  status: string;
}

export interface PayoutItem {
  id: string;
  amount: number;
  method: "bank" | "upi";
  status: "pending" | "processing" | "completed" | "rejected";
  accountNumber?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
  referenceId?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  title: string;
  subtitle: string;
  referenceId: string;
  status: "completed" | "pending" | "processing" | "rejected";
  date: string;
}

export interface DriverWalletData {
  metrics: WalletMetrics;
  bankDetails: BankDetailsData | null;
  payouts: PayoutItem[];
  ledger: LedgerTransaction[];
}

/**
 * Ensures authenticated driver partner
 */
async function getAuthenticatedPartner() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Fetches all driver wallet statistics, bank details, payouts, and transaction ledger.
 */
export async function getDriverWalletDataAction(): Promise<{
  success: boolean;
  data?: DriverWalletData;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedPartner();

    // 1. Fetch completed trips for this driver
    const completedTrips = await prisma.booking.findMany({
      where: {
        driverId: user.id,
        bookingStatus: "completed",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fare: true,
        partnerAmount: true,
        adminCommission: true,
        pickUpAddress: true,
        dropAddress: true,
        createdAt: true,
      },
    });

    // 2. Fetch payout requests for this driver
    const payoutRecords = await prisma.payoutRequest.findMany({
      where: { partnerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch linked bank account
    const partnerBank = await prisma.partnerBank.findUnique({
      where: { ownerId: user.id },
    });

    // 4. Calculate Financial Balances
    const lifetimeEarnings = completedTrips.reduce(
      (sum, trip) => sum + (trip.partnerAmount || 0),
      0
    );

    const settledAmount = payoutRecords
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayoutAmount = payoutRecords
      .filter((p) => p.status === "pending" || p.status === "processing")
      .reduce((sum, p) => sum + p.amount, 0);

    const withdrawableBalance = Math.max(
      0,
      lifetimeEarnings - settledAmount - pendingPayoutAmount
    );

    // 5. Build Unified Transaction Ledger
    const tripCredits: LedgerTransaction[] = completedTrips.map((trip) => ({
      id: `trip_${trip.id}`,
      type: "credit",
      amount: trip.partnerAmount,
      title: `Ride Earnings · #${trip.id.slice(0, 8)}`,
      subtitle: `${trip.pickUpAddress.split(",")[0]} ➔ ${trip.dropAddress.split(",")[0]}`,
      referenceId: trip.id,
      status: "completed",
      date: trip.createdAt.toISOString(),
    }));

    const payoutDebits: LedgerTransaction[] = payoutRecords.map((p) => ({
      id: `payout_${p.id}`,
      type: "debit",
      amount: p.amount,
      title:
        p.method === "upi"
          ? `Instant UPI Payout (${p.upiId || "UPI"})`
          : `Bank IMPS Transfer (${p.accountNumber ? `••••${p.accountNumber.slice(-4)}` : "Bank"})`,
      subtitle: p.referenceId ? `Ref UTR: ${p.referenceId}` : `Status: ${p.status}`,
      referenceId: p.referenceId || p.id,
      status: p.status as "completed" | "pending" | "processing" | "rejected",
      date: p.createdAt.toISOString(),
    }));

    // Combine & Sort descending by date
    const ledger = [...tripCredits, ...payoutDebits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const payouts: PayoutItem[] = payoutRecords.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method as "bank" | "upi",
      status: p.status as "pending" | "processing" | "completed" | "rejected",
      accountNumber: p.accountNumber,
      ifsc: p.ifsc,
      upiId: p.upiId,
      referenceId: p.referenceId,
      failureReason: p.failureReason,
      createdAt: p.createdAt.toISOString(),
    }));

    const bankDetails: BankDetailsData | null = partnerBank
      ? {
          accountHolder: partnerBank.accountHolder,
          accountNumber: partnerBank.accountNumber,
          maskedAccountNumber: `•••• •••• ${partnerBank.accountNumber.slice(-4)}`,
          ifsc: partnerBank.ifsc,
          upi: partnerBank.upi,
          status: partnerBank.status,
        }
      : null;

    return {
      success: true,
      data: {
        metrics: {
          lifetimeEarnings,
          totalTrips: completedTrips.length,
          settledAmount,
          pendingPayoutAmount,
          withdrawableBalance,
        },
        bankDetails,
        payouts,
        ledger,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load wallet data";
    console.error("[getDriverWalletDataAction Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Processes an instant withdrawal request to driver's bank account or UPI handle.
 */
export async function requestPayoutAction(
  amount: number,
  method: "bank" | "upi"
): Promise<{
  success: boolean;
  message?: string;
  payoutId?: string;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedPartner();

    if (!amount || amount < 10) {
      return { success: false, error: "Minimum withdrawal amount is ₹10" };
    }

    // 1. Fetch bank profile
    const partnerBank = await prisma.partnerBank.findUnique({
      where: { ownerId: user.id },
    });

    if (!partnerBank) {
      return {
        success: false,
        error: "Please link your Bank Account or UPI ID before requesting a payout.",
      };
    }

    if (method === "upi" && !partnerBank.upi) {
      return {
        success: false,
        error: "No UPI ID registered. Please update your UPI details or choose Bank Transfer.",
      };
    }

    // 2. Check Withdrawable Balance
    const completedTrips = await prisma.booking.findMany({
      where: { driverId: user.id, bookingStatus: "completed" },
      select: { partnerAmount: true },
    });

    const lifetimeEarnings = completedTrips.reduce(
      (sum, t) => sum + (t.partnerAmount || 0),
      0
    );

    const existingPayouts = await prisma.payoutRequest.findMany({
      where: {
        partnerId: user.id,
        status: { in: ["completed", "pending", "processing"] },
      },
      select: { amount: true },
    });

    const totalDeducted = existingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, lifetimeEarnings - totalDeducted);

    if (amount > availableBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available withdrawable balance is ₹${availableBalance.toFixed(
          2
        )}`,
      };
    }

    // 3. Generate instant simulated payout reference UTR
    const utrNumber = `SAFARX${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    const payout = await prisma.payoutRequest.create({
      data: {
        partnerId: user.id,
        amount,
        method: method as PayoutMethod,
        status: "completed" as PayoutStatus, // Instantly settled via SafarX FastPay
        accountNumber: method === "bank" ? partnerBank.accountNumber : null,
        ifsc: method === "bank" ? partnerBank.ifsc : null,
        upiId: method === "upi" ? partnerBank.upi : null,
        referenceId: utrNumber,
      },
    });

    const destination =
      method === "upi"
        ? `UPI ID (${partnerBank.upi})`
        : `Bank Account ending in ••••${partnerBank.accountNumber.slice(-4)}`;

    return {
      success: true,
      message: `₹${amount} successfully transferred to your ${destination}! (UTR: ${utrNumber})`,
      payoutId: payout.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payout request failed";
    console.error("[requestPayoutAction Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Updates or adds driver partner bank/UPI account details.
 */
export async function updatePartnerBankDetailsAction(data: {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  upi?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const user = await getAuthenticatedPartner();

    if (!data.accountHolder?.trim() || !data.accountNumber?.trim() || !data.ifsc?.trim()) {
      return { success: false, error: "Account holder, Account number, and IFSC are required" };
    }

    await prisma.partnerBank.upsert({
      where: { ownerId: user.id },
      create: {
        ownerId: user.id,
        accountHolder: data.accountHolder.trim(),
        accountNumber: data.accountNumber.trim(),
        ifsc: data.ifsc.trim().toUpperCase(),
        upi: data.upi?.trim() || null,
        status: "verified" as BankStatus,
      },
      update: {
        accountHolder: data.accountHolder.trim(),
        accountNumber: data.accountNumber.trim(),
        ifsc: data.ifsc.trim().toUpperCase(),
        upi: data.upi?.trim() || null,
        status: "verified" as BankStatus,
      },
    });

    return {
      success: true,
      message: "Bank and UPI details updated successfully!",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update bank details";
    console.error("[updatePartnerBankDetailsAction Error]:", msg);
    return { success: false, error: msg };
  }
}
