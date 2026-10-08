import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health/db — Prisma + Supabase connection test
export async function GET() {
  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.vehicle.count(),
    prisma.booking.count(),
    prisma.chatMessage.count(),
  ]);

  return NextResponse.json({
    ok: true,
    db: "supabase-postgres",
    orm: "prisma-v7",
    counts: {
      users: counts[0],
      vehicles: counts[1],
      bookings: counts[2],
      chatMessages: counts[3],
    },
  });
}
