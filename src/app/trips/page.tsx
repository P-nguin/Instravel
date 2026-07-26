import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TripsPage() {
  // 1. Get the current user
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch the real trips from the database
  const trips = await db.trip.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      // 3. Count the nested items so we can show real numbers on the cards!
      _count: {
        select: {
          members: true,
          inspiration: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-clay">Trips</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Trip boards</h1>
        </div>
        <Link className="button-primary" href="/trips/new">
          Create trip
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {trips.map((trip) => (
          <Link
            className="surface block p-5 transition hover:border-stone-400 shadow-sm hover:shadow-md"
            href={`/trips/${trip.id}`}
            key={trip.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{trip.name}</h2>
                <p className="mt-1 text-sm font-medium text-stone-600">
                  {trip.destinationText || "No destination set"}
                </p>
              </div>
              <span className="rounded-md bg-trail px-3 py-1 text-xs font-semibold text-white">
                Planning
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm border-t border-stone-100 pt-4">
              <div>
                <p className="font-bold text-ink">{trip._count.members}</p>
                <p className="font-medium text-stone-500">Members</p>
              </div>
              <div>
                <p className="font-bold text-ink">{trip._count.inspiration}</p>
                <p className="font-medium text-stone-500">Items</p>
              </div>
              <div>
                <p className="font-bold text-ink">0</p>
                <p className="font-medium text-stone-500">Stops</p>
              </div>
            </div>
          </Link>
        ))}

        {/* Show a helpful message if they haven't created any trips yet */}
        {trips.length === 0 && (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center surface border-dashed">
            <p className="text-stone-500 font-medium">No trips created yet.</p>
            <Link className="button-secondary mt-4" href="/trips/new">
              Create your first trip
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
