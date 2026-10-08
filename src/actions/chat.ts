"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import type { ChatSender } from "@/generated/prisma/enums";

export interface ChatMessageItem {
  id: string;
  bookingId: string;
  sender: "user" | "driver";
  text: string;
  createdAt: string;
}

/**
 * Fetches all chat messages for a specific booking.
 */
export async function getChatMessagesAction(
  bookingId: string
): Promise<{
  success: boolean;
  messages?: ChatMessageItem[];
  error?: string;
}> {
  try {
    if (!bookingId) {
      return { success: false, error: "Booking ID is required" };
    }

    const messages = await prisma.chatMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return {
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        bookingId: m.bookingId,
        sender: m.sender as "user" | "driver",
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load chat messages";
    console.error("[getChatMessagesAction Error]:", message);
    return { success: false, error: message };
  }
}

/**
 * Sends a new chat message for a booking.
 */
export async function sendChatMessageAction(
  bookingId: string,
  text: string,
  senderRole?: "user" | "driver"
): Promise<{
  success: boolean;
  message?: ChatMessageItem;
  error?: string;
}> {
  try {
    if (!bookingId || !text || !text.trim()) {
      return { success: false, error: "Message text cannot be empty" };
    }

    const user = await getCurrentUser();
    let role: ChatSender = senderRole === "driver" ? "driver" : "user";

    // Auto-determine role if not specified
    if (!senderRole && user) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { driverId: true, userId: true },
      });
      if (booking && booking.driverId === user.id) {
        role = "driver";
      } else {
        role = "user";
      }
    }

    const created = await prisma.chatMessage.create({
      data: {
        bookingId,
        text: text.trim(),
        sender: role,
      },
    });

    return {
      success: true,
      message: {
        id: created.id,
        bookingId: created.bookingId,
        sender: created.sender as "user" | "driver",
        text: created.text,
        createdAt: created.createdAt.toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    console.error("[sendChatMessageAction Error]:", message);
    return { success: false, error: message };
  }
}
