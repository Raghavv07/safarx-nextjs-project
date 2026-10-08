import { StreamClient } from "@stream-io/node-sdk";
import { env } from "@/env";

let streamClientInstance: StreamClient | null = null;

/**
 * Returns a singleton instance of the Stream Node.js Server Client.
 */
export function getStreamServerClient(): StreamClient {
  if (!streamClientInstance) {
    const apiKey = env.STREAM_API_KEY || env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey || !env.STREAM_API_SECRET) {
      throw new Error(
        "Stream API Key and STREAM_API_SECRET must be configured in .env"
      );
    }
    streamClientInstance = new StreamClient(apiKey, env.STREAM_API_SECRET);
  }
  return streamClientInstance;
}

/**
 * Generates a secure JWT token for a specific user to connect to GetStream Video/Chat.
 * Valid for 24 hours by default.
 */
export function generateStreamUserToken(
  userId: string,
  validityInSeconds: number = 24 * 60 * 60
): string {
  const client = getStreamServerClient();
  const exp = Math.floor(Date.now() / 1000) + validityInSeconds;
  return client.createToken(userId, exp);
}

/**
 * Creates or retrieves a Video KYC call room on Stream Video.
 */
export async function getOrCreateVideoKycCall(
  callId: string,
  creatorUserId: string
) {
  const client = getStreamServerClient();
  const call = client.video.call("default", callId);

  await call.getOrCreate({
    data: {
      created_by_id: creatorUserId,
      custom: {
        type: "video_kyc",
        purpose: "partner_verification",
      },
    },
  });

  return call;
}
