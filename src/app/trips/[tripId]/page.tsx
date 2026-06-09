const lanes = [
  {
    title: "Inbox",
    body: "Submitted links and notes will collect here before extraction."
  },
  {
    title: "Candidate places",
    body: "Possible places and activities will appear here for confirmation."
  },
  {
    title: "Itinerary",
    body: "Confirmed places will become day-by-day stops in a later milestone."
  }
];

type TripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default async function TripPage({ params }: TripPageProps) {
  const { tripId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-clay">Trip</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Trip board</h1>
          <p className="mt-2 text-sm text-stone-500">ID: {tripId}</p>
        </div>
        <div className="rounded-md bg-trail px-3 py-2 text-sm font-semibold text-white">
          Foundation
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface min-h-72 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Board</h2>
            <span className="text-sm text-stone-500">0 saved items</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {lanes.map((lane) => (
              <div
                className="rounded-lg border border-stone-200 bg-paper p-4"
                key={lane.title}
              >
                <h3 className="text-sm font-semibold text-ink">{lane.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {lane.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">Map</h2>
          <div className="mt-4 aspect-[4/3] rounded-lg border border-stone-200 bg-[linear-gradient(90deg,#ece6d9_1px,transparent_1px),linear-gradient(#ece6d9_1px,transparent_1px)] bg-[size:28px_28px]">
            <div className="relative h-full w-full">
              <span className="absolute left-[24%] top-[32%] h-3 w-3 rounded-full bg-clay" />
              <span className="absolute left-[54%] top-[47%] h-3 w-3 rounded-full bg-trail" />
              <span className="absolute left-[70%] top-[62%] h-3 w-3 rounded-full bg-sun" />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
