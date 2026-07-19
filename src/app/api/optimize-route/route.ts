// app/api/optimize-route/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// Manhattan Distance formula (Taxicab geometry)
// Calculates distance as if walking on a grid, heavily penalizing long diagonal trips
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km

  // Convert differences to radians
  const dLat = Math.abs(lat2 - lat1) * (Math.PI / 180);
  const dLon = Math.abs(lon2 - lon1) * (Math.PI / 180);

  // Distance moving purely North/South
  const distLat = R * dLat;

  // Distance moving purely East/West (adjusted for Earth's curvature at this latitude)
  const avgLat = (lat1 + lat2) / 2;
  const distLon = R * dLon * Math.cos(avgLat * (Math.PI / 180));

  // The magic: Instead of a straight diagonal line, we add the two grid legs together
  return distLat + distLon;
}

export async function POST(req: Request) {
  try {
    const { tripId } = await req.json();

    const tripItems = await db.inspirationItem.findMany({
      where: { tripId, latitude: { not: null }, longitude: { not: null } },
    });

    if (tripItems.length < 2) {
      return NextResponse.json({ error: "Need 2+ points" }, { status: 400 });
    }

    // --- THE UPGRADE: Test every starting point to find the true shortest path ---
    let bestOrder: typeof tripItems = [];
    let shortestTotalDistance = Infinity;

    for (let startIndex = 0; startIndex < tripItems.length; startIndex++) {
      let unvisited = [...tripItems];
      let currentPoint = unvisited.splice(startIndex, 1)[0];
      let currentOrder = [currentPoint];
      let currentRouteDistance = 0;

      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          // Using our Manhattan Distance formula
          const dist = getDistance(
            currentPoint.latitude!,
            currentPoint.longitude!,
            unvisited[i].latitude!,
            unvisited[i].longitude!,
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = i;
          }
        }

        currentRouteDistance += minDistance;
        currentPoint = unvisited.splice(nearestIndex, 1)[0];
        currentOrder.push(currentPoint);
      }

      // If this starting point yields a shorter overall trip, save it!
      if (currentRouteDistance < shortestTotalDistance) {
        shortestTotalDistance = currentRouteDistance;
        bestOrder = currentOrder;
      }
    }

    const optimizedOrder = bestOrder;

    // --- UPDATE DATABASE ---
    // Save the 1-based order index back to the database
    await Promise.all(
      optimizedOrder.map((item, index) =>
        db.inspirationItem.update({
          where: { id: item.id },
          data: { orderIndex: index + 1 }, // 1-based index
        }),
      ),
    );

    // --- GENERATE GEOMETRY ---
    // Create the GeoJSON LineString coordinates Mapbox expects
    const routeCoordinates = optimizedOrder.map((item) => [
      item.longitude,
      item.latitude,
    ]);

    const routeGeometry = {
      type: "LineString",
      coordinates: routeCoordinates,
    };

    return NextResponse.json({ routeGeometry });
  } catch (e) {
    console.error("Routing Error:", e);
    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 },
    );
  }
}
