import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentAction } from "@/actions/payments";

/**
 * POST /api/payments/verify
 * Validates dummy checkout response and updates booking / payment status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, orderId, paymentId, paymentMethod = "upi", failureSimulated } = body;

    if (!bookingId || !orderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: "bookingId, orderId and paymentId are required" },
        { status: 400 }
      );
    }

    const result = await verifyPaymentAction({
      bookingId,
      orderId,
      paymentId,
      paymentMethod,
      failureSimulated: Boolean(failureSimulated),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, paymentStatus: result.paymentStatus },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
