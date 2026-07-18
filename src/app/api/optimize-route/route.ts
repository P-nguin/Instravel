import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { tripId } = await req.json();
    const tripItems = await db.inspirationItem.findMany({
      where: { tripId, latitude: { not: null }, longitude: { not: null } },
    });

    if (tripItems.length < 2)
      return NextResponse.json({ error: "Need 2+ points" }, { status: 400 });

    // Revert to basic optimization URL to avoid 500 errors
    const coords = tripItems
      .map((i) => `${i.longitude},${i.latitude}`)
      .join(";");
    const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coords}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok")
      return NextResponse.json({ error: "Routing failed" }, { status: 500 });

    // Update indexes
    await Promise.all(
      data.waypoints.map((wp: any) =>
        db.inspirationItem.update({
          where: { id: tripItems[wp.waypoint_index].id },
          data: { orderIndex: wp.trips_index },
        }),
      ),
    );

    return NextResponse.json({ routeGeometry: data.trips[0].geometry });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
