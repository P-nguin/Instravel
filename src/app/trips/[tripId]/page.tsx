import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import TripClientView from "./TripClientView";

type TripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default async function TripPage({ params }: TripPageProps) {
  const { tripId } = await params;

  // 1. Fetch the trip and items, sorting by the new Mapbox orderIndex first!
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      inspiration: {
        orderBy: [
          { orderIndex: "asc" }, // <-- The new Mapbox optimized order
          { createdAt: "desc" }, // <-- Fallback for items not yet optimized
        ],
      },
    },
  });

  if (!trip) {
    notFound();
  }

  // 2. Pass the data to the interactive client component
  return <TripClientView trip={trip} />;
}
