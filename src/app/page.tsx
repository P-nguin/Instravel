import Link from "next/link";

const boardColumns = [
  {
    title: "Inbox",
    count: "12 items",
    items: ["Shibuya food reel", "Kyoto temple walk", "Hidden cocktail bar"]
  },
  {
    title: "Candidates",
    count: "8 places",
    items: ["Tsukiji Outer Market", "teamLab Borderless", "Fushimi Inari"]
  },
  {
    title: "Itinerary",
    count: "3 days",
    items: ["Tokyo arrival night", "Markets and museums", "Kyoto day trip"]
  }
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase text-clay">
            Shared trip planning
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-ink sm:text-5xl">
              Instravel
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700">
              Save travel inspiration into a shared board, confirm the places
              that matter, and turn the group shortlist into a realistic trip
              plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/trips/new">
              Create trip
            </Link>
            <Link className="button-secondary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Japan 2026</p>
                <p className="text-xs text-stone-500">Collaborative board</p>
              </div>
              <div className="rounded-md bg-trail px-3 py-1 text-xs font-semibold text-white">
                Planning
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-3">
            {boardColumns.map((column) => (
              <div
                className="rounded-lg border border-stone-200 bg-paper p-3"
                key={column.title}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-ink">
                    {column.title}
                  </h2>
                  <span className="text-xs font-medium text-stone-500">
                    {column.count}
                  </span>
                </div>
                <div className="space-y-2">
                  {column.items.map((item) => (
                    <div
                      className="rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-700"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5">
          <h2 className="text-base font-semibold text-ink">User controlled</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Items are submitted intentionally by travelers through app flows
            such as forms, extensions, share sheets, or future bot handoffs.
          </p>
        </div>
        <div className="surface p-5">
          <h2 className="text-base font-semibold text-ink">Collaborative</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Trips are built around members, shared inspiration, confirmation
            steps, and later voting.
          </p>
        </div>
        <div className="surface p-5">
          <h2 className="text-base font-semibold text-ink">Traceable</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Future itinerary stops can keep their source items and group
            rationale visible.
          </p>
        </div>
      </section>
    </div>
  );
}
