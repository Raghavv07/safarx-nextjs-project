import { Resend } from "resend";
import { env } from "@/env";

/**
 * Resend Email Client Singleton
 * Initialized with validated environment variables.
 */
export const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Generic helper to send emails via Resend.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = env.RESEND_FROM_EMAIL,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error("[Resend] Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error while sending email";
    console.error("[Resend] Unexpected error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send a welcome email to newly registered riders or drivers.
 */
export async function sendWelcomeEmail({
  to,
  name,
  role = "rider",
}: {
  to: string;
  name: string;
  role?: "rider" | "driver";
}): Promise<SendEmailResult> {
  const isDriver = role === "driver";
  const title = isDriver ? "Welcome to SafarX Partner Network! 🚖" : "Welcome to SafarX! 🚀";
  const bodyText = isDriver
    ? "We are excited to have you on board as a driver partner. Complete your document verification to start accepting rides."
    : "Thank you for joining SafarX, your smart companion for seamless rides and intercity travel.";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
        .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
        p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin-bottom: 20px; }
        .highlight-box { background: #1f2937; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; }
        .highlight-box p { color: #e5e7eb; margin: 0; font-size: 14px; }
        .footer { border-top: 1px solid #1f2937; padding: 20px 28px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SafarX</div>
        </div>
        <div class="content">
          <h1>Hello ${name || "Traveler"},</h1>
          <p>${bodyText}</p>
          <div class="highlight-box">
            <p><strong>Account Role:</strong> ${role.toUpperCase()}<br/><strong>Registered Email:</strong> ${to}</p>
          </div>
          <p>Enjoy safe, fast, and transparent travel with SafarX.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SafarX Technologies Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: title,
    html,
  });
}

/**
 * Send booking confirmation email with trip details.
 */
export async function sendBookingConfirmationEmail({
  to,
  name,
  bookingId,
  pickup,
  dropoff,
  fare,
}: {
  to: string;
  name: string;
  bookingId: string;
  pickup: string;
  dropoff: string;
  fare: number | string;
}): Promise<SendEmailResult> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Ride Confirmed - SafarX</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 24px; margin: 0; }
        .box { max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 14px; padding: 28px; }
        .title { color: #10b981; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1f2937; }
        .label { color: #9ca3af; font-size: 14px; }
        .val { color: #ffffff; font-weight: 600; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="title">Ride Confirmed! 🚕</div>
        <p style="color: #9ca3af; font-size: 14px;">Hi ${name}, your booking <strong>#${bookingId.slice(0, 8)}</strong> has been confirmed.</p>
        <div style="margin: 20px 0;">
          <p style="margin: 8px 0;"><strong style="color: #10b981;">Pickup:</strong> ${pickup}</p>
          <p style="margin: 8px 0;"><strong style="color: #3b82f6;">Dropoff:</strong> ${dropoff}</p>
          <p style="margin: 8px 0;"><strong style="color: #f59e0b;">Total Fare:</strong> ₹${fare}</p>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Thank you for riding with SafarX.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Ride Confirmed (#${bookingId.slice(0, 8)}) - SafarX`,
    html,
  });
}
