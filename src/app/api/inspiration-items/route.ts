import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { optionalString, readRequestBody } from "@/lib/request";

type InspirationItemPayload = {
  tripId?: unknown;
  sourceType?: unknown;
  sourcePlatform?: unknown;
  sourceUrl?: unknown;
  title?: unknown;
  description?: unknown;
  userNote?: unknown;
  rawMetadata?: unknown;
};

function isJsonObject(value: unknown): value is Prisma.InputJsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const payload = await readRequestBody<InspirationItemPayload>(request);
    const tripId = optionalString(payload.tripId);
    const sourceType = optionalString(payload.sourceType);

    if (!tripId || !sourceType) {
      return NextResponse.json(
        { error: "tripId and sourceType are required." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const membership = await db.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: user.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Current user is not a member of this trip." },
        { status: 403 }
      );
    }

    const item = await db.inspirationItem.create({
      data: {
        tripId,
        submittedById: user.id,
        sourceType,
        sourcePlatform: optionalString(payload.sourcePlatform),
        sourceUrl: optionalString(payload.sourceUrl),
        title: optionalString(payload.title),
        description: optionalString(payload.description),
        userNote: optionalString(payload.userNote),
        ...(isJsonObject(payload.rawMetadata)
          ? { rawMetadata: payload.rawMetadata }
          : {})
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to create inspiration item. Check the database connection."
      },
      { status: 503 }
    );
  }
}
