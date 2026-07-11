import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import Map from "@/components/Map";

// 1. Update the type to wrap the params in a Promise
type TripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default async function TripPage({ params }: TripPageProps) {
  // 2. Add the 'await' keyword right here!
  const { tripId } = await params;

  // 1. Fetch the trip and all associated inspiration items from Prisma
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      inspiration: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // 2. Fallback to a clean 404 page if the trip ID doesn't exist in the database
  if (!trip) {
    notFound();
  }

  // Separate processed items that have valid Mapbox coordinates from the pending queue
  const mappedItems = trip.inspiration.filter(
    (item) => item.latitude && item.longitude,
  );
  const pendingCount = trip.inspiration.filter(
    (item) => item.status === "pending",
  ).length;

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

          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-x-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 self-start md:self-center">
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
        </div>
      </div>

      {/* Map Section (Ticket 3) */}
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

        {/* Pass the fully typed inspiration items directly into the client-side Mapbox view */}
        <Map items={trip.inspiration} />
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
            {trip.inspiration.map((item) => {
              // Parse out the JSON object safely from the rawMetadata field
              const meta = item.rawMetadata as {
                businessName?: string;
                address?: string;
                city?: string;
                priceTier?: string;
                vibeTags?: string[];
              } | null;

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Business Name Header */}
                      <div className="flex items-start justify-between gap-x-2">
                        <h3 className="font-semibold text-stone-900 text-lg line-clamp-1">
                          {meta?.businessName ||
                            item.title ||
                            "Unidentified Location"}
                        </h3>
                        {meta?.priceTier && (
                          <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-1 text-xs font-mono text-stone-700">
                            {meta.priceTier}
                          </span>
                        )}
                      </div>

                      {/* Extracted Geolocation Address text */}
                      {(meta?.address || meta?.city) && (
                        <p className="mt-1 text-xs text-stone-500 flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5 text-stone-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
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

                  {/* Visual Status Indicator strip at the base of the card */}
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
