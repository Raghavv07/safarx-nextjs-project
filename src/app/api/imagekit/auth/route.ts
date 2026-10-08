import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";
import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/imagekit/auth
 * Official @imagekit/next upload auth endpoint.
 * Generates { token, signature, expire } for secure client-side uploads.
 */
export async function GET() {
  try {
    if (!env.IMAGEKIT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "IMAGEKIT_PRIVATE_KEY is not configured in .env" },
        { status: 500 }
      );
    }

    const authParams = getUploadAuthParams({
      privateKey: env.IMAGEKIT_PRIVATE_KEY,
      publicKey: env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "dummy_public_key",
    });

    return NextResponse.json(authParams);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "ImageKit Auth Error";
    console.error("[ImageKit Auth Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
