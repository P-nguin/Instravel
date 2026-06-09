import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { optionalString, readRequestBody } from "@/lib/request";

type TripPayload = {
  name?: unknown;
  destinationText?: unknown;
  startDate?: unknown;
  endDate?: unknown;
};

function parseDate(value: unknown) {
  const rawValue = optionalString(value);

  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const trips = await db.trip.findMany({
      where: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }]
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            members: true,
            inspiration: true
          }
        }
      }
    });

    return NextResponse.json({ trips });
  } catch {
    return NextResponse.json(
      { error: "Unable to list trips. Check the database connection." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readRequestBody<TripPayload>(request);
    const name = optionalString(payload.name);

    if (!name) {
      return NextResponse.json(
        { error: "Trip name is required." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    const trip = await db.trip.create({
      data: {
        name,
        destinationText: optionalString(payload.destinationText),
        startDate: parseDate(payload.startDate),
        endDate: parseDate(payload.endDate),
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner"
          }
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create trip. Check the database connection." },
      { status: 503 }
    );
  }
}
