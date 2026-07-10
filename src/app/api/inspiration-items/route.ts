import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tripId,
      sourceType,
      sourcePlatform,
      sourceUrl,
      description,
      rawMetadata,
    } = body;

    const user = await getCurrentUser();

    // Save the incoming reel to the database
    const item = await db.inspirationItem.create({
      data: {
        tripId,
        submittedById: user.id,
        sourceType,
        sourcePlatform,
        sourceUrl,
        description,
        rawMetadata,
        status: "pending",
      },
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error("Failed to save item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
