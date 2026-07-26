import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { tripId } = await params;

    // 1. Verify the current user actually has access to this trip
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }]
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get the existing token, or create a new one if it doesn't exist
    let shareToken = await db.shareToken.findUnique({
      where: { tripId }
    });

    if (!shareToken) {
      shareToken = await db.shareToken.create({
        data: { tripId }
      });
    }

    return NextResponse.json({ token: shareToken.token }, { status: 200 });
  } catch (error) {
    console.error("Share Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}