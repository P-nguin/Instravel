import Link from "next/link";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch real counts from the database for the current user
  const tripsCount = await db.trip.count({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
  });

  const itemsCount = await db.inspirationItem.count({
    where: {
      trip: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
  });

  const pendingCount = await db.inspirationItem.count({
    where: {
      status: "pending",
      trip: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
    },
  });

  // 2. Map the data to your UI
  const stats = [
    { label: "Trips", value: tripsCount.toString() },
    { label: "Inspiration items", value: itemsCount.toString() },
    { label: "Pending confirmations", value: pendingCount.toString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-clay">Workspace</p>
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
