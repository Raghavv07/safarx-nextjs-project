"use server";

import { getCurrentUser } from "@/actions/auth";
import { generateStreamUserToken, getOrCreateVideoKycCall } from "@/lib/stream";
import { prisma } from "@/lib/prisma";

export interface VideoKycSessionResult {
  success: boolean;
  callId?: string;
  token?: string;
  apiKey?: string;
  userId?: string;
  userName?: string;
  error?: string;
}

/**
 * Server Action to initialize a Video KYC Room for a Driver / Partner.
 */
export async function startVideoKycSessionAction(
  targetPartnerId?: string
): Promise<VideoKycSessionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Authentication required" };
    }

    const partnerId = targetPartnerId || currentUser.id;
    const callId = `kyc_${partnerId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    // 1. Get or create call on Stream Video
    await getOrCreateVideoKycCall(callId, currentUser.id);

    // 2. Generate secure token for the user
    const token = generateStreamUserToken(currentUser.id);

    // 3. Update videoKycRoomId in database if partner user
    try {
      await prisma.user.updateMany({
        where: { id: partnerId },
        data: {
          videoKycRoomId: callId,
          videoKycStatus: "inprogress",
        },
      });
    } catch (dbErr) {
      console.warn("DB update skipped for video KYC room:", dbErr);
    }

    return {
      success: true,
      callId,
      token,
      apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
      userId: currentUser.id,
      userName: currentUser.name,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to start Video KYC session";
    console.error("[Start Video KYC Error]:", message);
    return { success: false, error: message };
  }
}
