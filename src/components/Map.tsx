"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

interface MapProps {
  items: any[];
  routeGeometry?: any;
}

export default function Map({ items, routeGeometry }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-73.985753, 40.749946],
        zoom: 13,
      });

      map.current.on("load", () => {
        if (!map.current) return;
        map.current.addSource("optimized-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });
        map.current.addLayer({
          id: "route-layer",
          type: "line",
          source: "optimized-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });
      });
    }

    const update = () => {
      if (!map.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      items.forEach((item, index) => {
        if (item.latitude && item.longitude) {
          const el = document.createElement("div");
          el.style.cssText =
            "background:#1c1917; color:white; width:28px; height:28px; border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:12px;";

          // FIX: Use orderIndex + 1 if available, otherwise fallback to array index + 1
          const displayLabel =
            item.orderIndex !== null && item.orderIndex !== undefined
              ? item.orderIndex + 1
              : index + 1;

          el.innerText = displayLabel.toString();

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([item.longitude, item.latitude])
            .addTo(map.current!);
          markersRef.current.push(marker);
        }
      });

      if (routeGeometry && map.current.getSource("optimized-route")) {
        (
          map.current.getSource("optimized-route") as mapboxgl.GeoJSONSource
        ).setData({
          type: "Feature",
          properties: {},
          geometry: routeGeometry,
        });
      }
    };

    if (map.current.isStyleLoaded()) update();
    else map.current.once("load", update);
  }, [items, routeGeometry]);

  return (
    <div
      ref={mapContainer}
      className="h-[600px] w-full rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
    />
  );
}
