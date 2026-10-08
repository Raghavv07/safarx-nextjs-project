import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { env } from "@/env";

/**
 * GET /api/health/email
 * Health check for Resend service integration.
 */
export async function GET() {
  const isKeyConfigured = Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY.startsWith("re_"));

  return NextResponse.json({
    ok: isKeyConfigured,
    service: "resend",
    fromEmail: env.RESEND_FROM_EMAIL,
    configured: isKeyConfigured,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/health/email
 * Send a verification/test email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body.to || "raghavbajpai2001@gmail.com";

    const result = await sendEmail({
      to: recipient,
      subject: "SafarX — Resend Integration Status Verified",
      html: `
        <div style="font-family: sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #10b981; margin-top: 0;">SafarX Email System Online! 🚀</h2>
          <p>Your Resend integration in SafarX (Next.js 16 + Turbopack) is verified and working perfectly.</p>
          <hr style="border: 0; border-top: 1px solid #1f2937; margin: 16px 0;" />
          <p style="font-size: 13px; color: #9ca3af;">Timestamp: ${new Date().toLocaleString("en-IN")}</p>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      messageId: result.id,
      recipient,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
