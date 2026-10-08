import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/auth";
import { generateStreamUserToken } from "@/lib/stream";

export const dynamic = "force-dynamic";

/**
 * GET /api/stream/token
 * Returns authenticated Stream Video JWT token for the currently logged in user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to join video calls." },
        { status: 401 }
      );
    }

    const token = generateStreamUserToken(user.id);

    return NextResponse.json({
      token,
      userId: user.id,
      userName: user.name,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    console.error("[Stream Token Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
