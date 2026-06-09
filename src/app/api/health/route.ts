import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  if (!databaseConfigured) {
    return NextResponse.json({
      status: "ok",
      service: "instravel",
      database: {
        configured: false,
        status: "not_configured"
      }
    });
  }

  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "instravel",
      database: {
        configured: true,
        status: "connected"
      }
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        service: "instravel",
        database: {
          configured: true,
          status: "unavailable"
        }
      },
      { status: 503 }
    );
  }
}
