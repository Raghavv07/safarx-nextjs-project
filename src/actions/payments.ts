"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { fakeGateway, type FakeOrder } from "@/lib/payments/fake-gateway";
import { sendBookingConfirmationEmail } from "@/lib/resend";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";

export interface CreatePaymentOrderResponse {
  success: boolean;
  order?: FakeOrder;
  error?: string;
}

export interface VerifyPaymentInput {
  bookingId: string;
  orderId: string;
  paymentId: string;
  paymentMethod: "upi" | "card" | "netbanking" | "cash";
  failureSimulated?: boolean;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  paymentId?: string;
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
  error?: string;
}

/**
 * 1. Creates a payment order for a booking, sets status to awaiting_payment
 * and sets a 15-minute payment deadline.
 */
export async function createPaymentOrderAction(
  bookingId: string
): Promise<CreatePaymentOrderResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Please sign in to proceed with payment." };
    }

    if (!bookingId) {
      return { success: false, error: "Invalid booking ID." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking not found." };
    }

    if (booking.paymentStatus === "paid") {
      return { success: false, error: "This booking has already been paid for." };
    }

    // Set 15-minute deadline
    const deadline = new Date(Date.now() + 15 * 60 * 1000);

    // If booking is not started/completed, move to awaiting_payment
    const updateStatus =
      booking.bookingStatus === "idle" || booking.bookingStatus === "requested"
        ? "awaiting_payment"
        : booking.bookingStatus;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: updateStatus,
        paymentDeadline: deadline,
      },
    });

    // Create the Fake Razorpay order
    const order = fakeGateway.createOrder({
      amount: booking.fare,
      bookingId: booking.id,
      notes: {
        riderName: booking.user.name,
        pickupAddress: booking.pickUpAddress,
        dropAddress: booking.dropAddress,
      },
    });

    return {
      success: true,
      order,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment order";
    console.error("[createPaymentOrderAction error]:", err);
    return { success: false, error: message };
  }
}

/**
 * 2. Verifies dummy payment or processes failure simulation.
 * Splits platform commission (15%) and driver amount (85%),
 * updates booking status to confirmed/paid, and triggers Resend confirmation email.
 */
export async function verifyPaymentAction(
  input: VerifyPaymentInput
): Promise<VerifyPaymentResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    const { bookingId, orderId, paymentId, paymentMethod, failureSimulated } = input;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        driver: true,
        vehicle: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking record does not exist." };
    }

    // Simulated Failure Handler (For QA testing)
    if (failureSimulated) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "failed",
        },
      });

      return {
        success: false,
        error: "Payment declined by issuing bank (Simulated failure). Please try another method.",
        paymentStatus: "failed",
      };
    }

    // Verify orderId and paymentId format
    const verification = fakeGateway.verifyPayment({ orderId, paymentId });
    if (!verification.success) {
      return {
        success: false,
        error: verification.error || "Payment signature verification failed.",
      };
    }

    // Calculate Split Commissions
    const fare = booking.fare;
    const adminCommission = Math.round(fare * 0.15); // 15% platform commission
    const partnerAmount = Math.round(fare - adminCommission); // 85% driver earnings

    // Determine target booking status
    let nextBookingStatus: BookingStatus = booking.bookingStatus;
    if (
      booking.bookingStatus === "awaiting_payment" ||
      booking.bookingStatus === "requested" ||
      booking.bookingStatus === "idle"
    ) {
      nextBookingStatus = "confirmed";
    }

    const nextPaymentStatus: PaymentStatus =
      paymentMethod === "cash" ? "cash" : "paid";

    // Update in database
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: nextBookingStatus,
        paymentStatus: nextPaymentStatus,
        adminCommission,
        partnerAmount,
      },
    });

    // Send Confirmation Email via Resend in the background
    try {
      if (booking.user.email) {
        sendBookingConfirmationEmail({
          to: booking.user.email,
          name: booking.user.name,
          bookingId: booking.id,
          pickup: booking.pickUpAddress,
          dropoff: booking.dropAddress,
          fare: booking.fare,
        }).catch((emailErr) => {
          console.warn("[Resend Warning]: Could not send confirmation email:", emailErr);
        });
      }
    } catch (e) {
      console.warn("[Resend Trigger]:", e);
    }

    return {
      success: true,
      message: "Payment successfully verified and ride confirmed!",
      paymentId,
      bookingStatus: updated.bookingStatus,
      paymentStatus: updated.paymentStatus,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify payment";
    console.error("[verifyPaymentAction error]:", err);
    return { success: false, error: message };
  }
}

/**
 * 3. Fallback: Select Cash Payment
 * Immediately confirms ride with paymentStatus = 'cash'
 */
export async function chooseCashPaymentAction(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return { success: false, error: "Booking not found" };

    let nextStatus: BookingStatus = booking.bookingStatus;
    if (
      booking.bookingStatus === "awaiting_payment" ||
      booking.bookingStatus === "requested" ||
      booking.bookingStatus === "idle"
    ) {
      nextStatus = "confirmed";
    }

    const adminCommission = Math.round(booking.fare * 0.15);
    const partnerAmount = Math.round(booking.fare - adminCommission);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: nextStatus,
        paymentStatus: "cash",
        adminCommission,
        partnerAmount,
      },
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to set cash payment";
    return { success: false, error: message };
  }
}

/**
 * 4. Check if a booking's paymentDeadline has expired
 */
export async function checkPaymentDeadlineExpiredAction(
  bookingId: string
): Promise<{ expired: boolean }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        paymentDeadline: true,
        paymentStatus: true,
        bookingStatus: true,
      },
    });

    if (!booking || !booking.paymentDeadline) {
      return { expired: false };
    }

    const isExpired =
      new Date() > new Date(booking.paymentDeadline) &&
      booking.paymentStatus === "pending" &&
      booking.bookingStatus === "awaiting_payment";

    if (isExpired) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: "expired",
        },
      });
      return { expired: true };
    }

    return { expired: false };
  } catch (err) {
    console.error("checkPaymentDeadline error:", err);
    return { expired: false };
  }
}
