"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 1. Prevent the browser from navigating away to the raw API route
    e.preventDefault();
    setIsLoading(true);

    // 2. Gather the form data
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      destinationText: formData.get("destinationText"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    };

    try {
      // 3. Send the data to your backend
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      const data = await response.json();

      // 4. The Magic Wire: Redirect the user directly to their new trip board!
      router.push(`/trips/${data.trip.id}`);
      router.refresh(); // Ensures the server fetches the absolute latest data
    } catch (error) {
      console.error("Error creating trip:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-clay">New trip</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Create trip</h1>
      </div>

      {/* Swap 'action' for React's 'onSubmit' handler */}
      <form onSubmit={handleSubmit} className="surface space-y-5 p-5">
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="label" htmlFor="startDate">
              Start date
            </label>
            <input
              className="field"
              id="startDate"
              name="startDate"
              type="date"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="endDate">
              End date
            </label>
            <input
              className="field"
              id="endDate"
              name="endDate"
              type="date"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Link className="button-secondary" href="/trips">
            Cancel
          </Link>

          {/* Add a loading state so users don't click twice */}
          <button className="button-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
