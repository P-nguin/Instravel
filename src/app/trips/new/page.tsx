import Link from "next/link";

export default function NewTripPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-clay">New trip</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Create trip</h1>
      </div>

      <form action="/api/trips" className="surface space-y-5 p-5" method="post">
        <div className="space-y-2">
          <label className="label" htmlFor="name">
            Trip name
          </label>
          <input
            className="field"
            id="name"
            name="name"
            placeholder="Japan 2026"
            required
            type="text"
          />
        </div>

        <div className="space-y-2">
          <label className="label" htmlFor="destinationText">
            Destination
          </label>
          <input
            className="field"
            id="destinationText"
            name="destinationText"
            placeholder="Tokyo, Kyoto"
            type="text"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="label" htmlFor="startDate">
              Start date
            </label>
            <input className="field" id="startDate" name="startDate" type="date" />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="endDate">
              End date
            </label>
            <input className="field" id="endDate" name="endDate" type="date" />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Link className="button-secondary" href="/trips">
            Cancel
          </Link>
          <button className="button-primary" type="submit">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
