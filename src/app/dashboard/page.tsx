import Link from "next/link";

const stats = [
  { label: "Trips", value: "0" },
  { label: "Inspiration items", value: "0" },
  { label: "Pending confirmations", value: "0" }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-clay">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Dashboard</h1>
        </div>
        <Link className="button-primary" href="/trips/new">
          New trip
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div className="surface p-5" key={stat.label}>
            <p className="text-sm font-medium text-stone-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
            <p className="mt-1 text-sm text-stone-600">
              New trip and inspiration activity will appear here.
            </p>
          </div>
          <Link className="button-secondary" href="/trips">
            View trips
          </Link>
        </div>
      </section>
    </div>
  );
}
