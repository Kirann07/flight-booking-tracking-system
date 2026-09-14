"use client";

import { useEffect, useRef } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 22.5937,
  lng: 78.9629,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlightMap = ({ flights }: { flights: any[] }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["marker"], // ✅ required for AdvancedMarker
  });

  const mapRef = useRef<google.maps.Map | null>(null);
const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // ✈️ Handle markers + animation
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.marker
    )
      return;

    flights.slice(0, 40).forEach((f, i) => {
      const lat = f[6];
      const lng = f[5];
      const heading = typeof f[10] === "number" ? f[10] : 0;

      if (lat === null || lng === null) return;

      const position = { lat, lng };

      // 🟢 Update existing marker
      if (markersRef.current[i]) {
        const marker = markersRef.current[i];

        marker.position = position;

        const el = marker.content as HTMLElement;
        el.style.transform = `rotate(${heading}deg)`;

        return;
      }

      // 🔵 Create new marker
      const plane = document.createElement("div");
      plane.style.width = "30px";
      plane.style.height = "30px";
      plane.style.backgroundImage = "url(/airplane-svgrepo-com.svg)";
      plane.style.backgroundSize = "contain";
      plane.style.backgroundRepeat = "no-repeat";
      plane.style.transition = "transform 0.5s linear";
      plane.style.transform = `rotate(${heading}deg)`;

      const marker =
        new window.google.maps.marker.AdvancedMarkerElement({
          position,
          content: plane,
          map: mapRef.current,
        });

      markersRef.current[i] = marker;
    });
  }, [flights]);

  // ⏳ Loading state
  if (!isLoaded) {
    return (
      <div className="h-150 flex items-center justify-center text-gray-400">
        Loading Map...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 🧠 Optional overlay message */}
      {flights.length === 0 && (
        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded z-10">
          No flights yet
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={3}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          mapId: "9247f9f43342852475d4aea0",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          minZoom: 2,
          maxZoom: 8,
          // styles: [
          //   {
          //     featureType: "poi",
          //     stylers: [{ visibility: "off" }],
          //   },
          // ],
        }}
      />
    </div>
  );
};

export default FlightMap;