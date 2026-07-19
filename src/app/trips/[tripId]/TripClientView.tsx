"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Map from "@/components/Map";

// Define the expected props based on what Prisma returns
type TripClientViewProps = {
  trip: any; // You can replace 'any' with your exact Prisma Trip payload type
};

export default function TripClientView({ trip }: TripClientViewProps) {
  const router = useRouter();
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Separate processed items from the pending queue
  const mappedItems = trip.inspiration.filter(
    (item: any) => item.latitude && item.longitude,
  );

  const pendingCount = trip.inspiration.filter(
    (item: any) => item.status === "pending",
  ).length;

  // The Optimization Engine
  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch("/api/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id }),
      });

      const data = await response.json();

      // FIX: Check for errors, not just routeGeometry.
      // Set geometry (or null to clear old lines) and ALWAYS refresh the router!
      if (!data.error) {
        setRouteGeometry(data.routeGeometry || null);
        router.refresh();
      } else {
        console.error("Optimization failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to optimize route:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const openInGoogleMaps = () => {
    // 1. Sort items to ensure they are in the exact Mapbox order
    const sortedItems = [...mappedItems].sort((a, b) => {
      const orderA = a.orderIndex || 0;
      const orderB = b.orderIndex || 0;
      return orderA - orderB;
    });

    if (sortedItems.length < 2) return;

    // 2. Extract Origin and Destination
    const origin = `${sortedItems[0].latitude},${sortedItems[0].longitude}`;
    const destination = `${sortedItems[sortedItems.length - 1].latitude},${sortedItems[sortedItems.length - 1].longitude}`;

    // 3. Extract Waypoints (everything in between)
    const waypointsList = sortedItems.slice(1, -1);
    const waypoints =
      waypointsList.length > 0
        ? `&waypoints=${waypointsList.map((i) => `${i.latitude},${i.longitude}`).join("|")}`
        : "";

    // 4. Construct the universal URL
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=walking`;

    // 5. Open in a new tab (which triggers the native app on mobile)
    window.open(googleMapsUrl, "_blank");
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="border-b border-stone-200 pb-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">
              {trip.name}
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              {trip.destinationText || "No destination specified yet"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {pendingCount > 0 && (
              <div className="inline-flex items-center gap-x-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                <svg
                  className="h-1.5 w-1.5 fill-amber-500"
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                >
                  <circle cx={3} cy={3} r={3} />
                </svg>
                {pendingCount} item{pendingCount > 1 ? "s" : ""} awaiting
                processing
              </div>
            )}

            {/* GOOGLE MAPS BUTTON */}
            <button
              onClick={openInGoogleMaps}
              disabled={mappedItems.length < 2}
              className="bg-white text-stone-900 border border-stone-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              Open in Google Maps
            </button>

            {/* OPTIMIZE BUTTON */}
            <button
              onClick={handleOptimizeRoute}
              disabled={isOptimizing || mappedItems.length < 2}
              className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {isOptimizing ? "Calculating Route..." : "Optimize Route"}
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-stone-900">
            Interactive Route Map
          </h2>
          <span className="text-sm text-stone-500">
            Showing {mappedItems.length} mapped pinpoint
            {mappedItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Pass BOTH the items and the newly calculated routeGeometry to your Map */}
        <Map items={trip.inspiration} routeGeometry={routeGeometry} />
      </section>

      {/* Grid of Collected Travel Milestones */}
      <section>
        <h2 className="text-xl font-semibold text-stone-900 mb-6">
          Your Inspiration Board
        </h2>

        {trip.inspiration.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-stone-300 rounded-2xl">
            <p className="text-stone-500 text-sm">
              No items added to this trip yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trip.inspiration.map((item: any, index: number) => {
              const meta = item.rawMetadata as {
                businessName?: string;
                address?: string;
                city?: string;
                priceTier?: string;
                vibeTags?: string[];
              } | null;

              // Calculate the display number (use Mapbox's order, or fallback to list index)
              const displayNum =
                item.orderIndex > 0 ? item.orderIndex : index + 1;

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Business Name Header with Number Badge */}
                      <div className="flex items-start justify-between gap-x-2">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                            {displayNum}
                          </span>
                          <h3 className="font-semibold text-stone-900 text-lg line-clamp-1">
                            {meta?.businessName ||
                              item.title ||
                              "Unidentified Location"}
                          </h3>
                        </div>
                        {meta?.priceTier && (
                          <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-mono text-stone-700">
                            {meta.priceTier}
                          </span>
                        )}
                      </div>

                      {/* Extracted Geolocation Address text */}
                      {(meta?.address || meta?.city) && (
                        <p className="mt-2 text-xs text-stone-500 flex items-center gap-1">
                          {meta.address}
                          {meta.address && meta.city ? ", " : ""}
                          {meta.city}
                        </p>
                      )}

                      {/* Original Input Instagram/Platform Caption snippet */}
                      <p className="mt-4 text-sm text-stone-600 line-clamp-3 italic">
                        "{item.description || "No caption description saved."}"
                      </p>
                    </div>

                    {/* Vibe Tags Footer */}
                    {meta?.vibeTags && meta.vibeTags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-1.5">
                        {meta.vibeTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-500/10"
                          >
                            #{tag.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visual Status Indicator strip */}
                  <div
                    className={`h-1.5 w-full ${
                      item.status === "processed"
                        ? "bg-emerald-500"
                        : item.status === "failed_extraction"
                          ? "bg-rose-500"
                          : "bg-amber-400 animate-pulse"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
