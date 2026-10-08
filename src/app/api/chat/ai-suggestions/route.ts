import { NextRequest, NextResponse } from "next/server";
import { generateChatSuggestions } from "@/lib/ai";

/**
 * POST /api/chat/ai-suggestions
 * Generates 6 smart quick-reply suggestions for in-ride chat using DeepSeek via APInex.
 *
 * Body:
 * {
 *   "lastMessage": "Main gate par pahunch gaya hu",
 *   "role": "user" | "rider" | "driver" | "partner"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const lastMessage = typeof body.lastMessage === "string" ? body.lastMessage : "";
    const role = body.role || "rider";

    if (!lastMessage.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "lastMessage string is required in request body",
        },
        { status: 400 }
      );
    }

    const suggestions = await generateChatSuggestions({
      lastMessage,
      role,
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("[AI Suggestions API Error]:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/ai-suggestions?message=...&role=...
 * Useful for browser testing and health-checking the DeepSeek suggestion service.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const message = searchParams.get("message") || "Main gate par aa gaya hu";
  const role = (searchParams.get("role") as "rider" | "driver") || "rider";

  const suggestions = await generateChatSuggestions({
    lastMessage: message,
    role,
  });

  return NextResponse.json({
    success: true,
    model: "free/deepseek-v4.1-flash",
    provider: "APInex Gateway",
    input: { message, role },
    suggestions,
  });
}
