"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Give Mapbox your public token from the .env file
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

type MapProps = {
  items: {
    id: string;
    latitude: number | null;
    longitude: number | null;
    rawMetadata: any;
  }[];
};

export default function Map({ items }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // If the map is already loaded or the container isn't ready, do nothing
    if (map.current || !mapContainer.current) return;

    // Find the first item with valid coordinates to act as the center of the map
    const validItem = items.find((i) => i.latitude && i.longitude);
    const centerPoint = validItem
      ? ([validItem.longitude, validItem.latitude] as [number, number]) // Mapbox requires [Lng, Lat]
      : ([-73.985753, 40.749946] as [number, number]); // Default to NYC if no pins exist yet

    // 1. Initialize the Map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11", // A clean, modern aesthetic
      center: centerPoint,
      zoom: 12,
    });

    // 2. Loop through your AI-processed items and add markers
    items.forEach((item) => {
      if (item.latitude && item.longitude) {
        // Build a little popup that shows the name and address when clicked
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="font-size: 14px;">${item.rawMetadata?.businessName || "Location"}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
              ${item.rawMetadata?.address || ""}
            </p>
          </div>
        `);

        // Create the physical red pin and attach it to the map
        new mapboxgl.Marker({ color: "#FF5A5F" }) // A nice travel-app coral red
          .setLngLat([item.longitude, item.latitude])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    // Cleanup function when the user navigates away from the page
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [items]);

  return (
    <div
      ref={mapContainer}
      className="h-[600px] w-full rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
    />
  );
}
