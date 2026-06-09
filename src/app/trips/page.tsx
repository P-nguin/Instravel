import Link from "next/link";

const placeholderTrips = [
  {
    id: "sample-japan-2026",
    name: "Japan 2026",
    destination: "Tokyo, Kyoto",
    status: "Planning"
  },
  {
    id: "sample-portugal-summer",
    name: "Portugal summer",
    destination: "Lisbon, Porto",
    status: "Draft"
  }
];

export default function TripsPage() {
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
        {placeholderTrips.map((trip) => (
          <Link
            className="surface block p-5 transition hover:border-stone-400"
            href={`/trips/${trip.id}`}
            key={trip.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{trip.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {trip.destination}
                </p>
              </div>
              <span className="rounded-md bg-sun/20 px-3 py-1 text-xs font-semibold text-stone-800">
                {trip.status}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-semibold text-ink">0</p>
                <p className="text-stone-500">Members</p>
              </div>
              <div>
                <p className="font-semibold text-ink">0</p>
                <p className="text-stone-500">Items</p>
              </div>
              <div>
                <p className="font-semibold text-ink">0</p>
                <p className="text-stone-500">Stops</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
