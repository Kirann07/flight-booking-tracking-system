/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

type Cab = {
  provider: string;
  type: string;
  base: number;
  perKm: number;
  speed: number;
  icon: string;
};

const CABS: Cab[] = [
  { provider: "Uber", type: "Go", base: 50, perKm: 14, speed: 35, icon: "🚗" },
  { provider: "Uber", type: "Premier", base: 80, perKm: 18, speed: 40, icon: "🚘" },
  { provider: "Uber", type: "XL", base: 100, perKm: 22, speed: 38, icon: "🚙" },
  { provider: "Uber", type: "Auto", base: 30, perKm: 10, speed: 30, icon: "🛺" },
  { provider: "Uber", type: "Moto", base: 20, perKm: 8, speed: 45, icon: "🏍️" },

  { provider: "Ola", type: "Mini", base: 45, perKm: 13, speed: 34, icon: "🚕" },
  { provider: "Ola", type: "Prime", base: 75, perKm: 17, speed: 38, icon: "🚖" },
  { provider: "Ola", type: "Prime SUV", base: 110, perKm: 23, speed: 36, icon: "🚐" },
  { provider: "Ola", type: "Auto", base: 28, perKm: 9, speed: 30, icon: "🛺" },
  { provider: "Ola", type: "Bike", base: 18, perKm: 7, speed: 45, icon: "🏍️" },

  { provider: "Rapido", type: "Bike", base: 15, perKm: 6, speed: 48, icon: "🏍️" },
  { provider: "Rapido", type: "Auto", base: 25, perKm: 9, speed: 32, icon: "🛺" },
  { provider: "Rapido", type: "Cab", base: 40, perKm: 12, speed: 34, icon: "🚗" },
  { provider: "Rapido", type: "Premium Bike", base: 22, perKm: 8, speed: 50, icon: "🏍️" },
  { provider: "Rapido", type: "Rental", base: 60, perKm: 11, speed: 30, icon: "🚘" },
];

type ToastType = "success" | "error" | "info";

export default function CabComparePage() {
  const [pickup, setPickup] = useState("Fetching location...");
  const [drop, setDrop] = useState("");
  const [distance, setDistance] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<any>(null);
const [useCurrentLocation, setUseCurrentLocation] = useState(true);
const [topPicks, setTopPicks] = useState<any[]>([]);


  // 🔔 Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    show: boolean;
  }>({ message: "", type: "info", show: false });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 3500);
  };

  const [pickupCoords, setPickupCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [dropCoords, setDropCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  // // 🔥 AUTO LOCATION FETCH


const getDistance = async (pickup: any, drop: any) => {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup.lon},${pickup.lat};${drop.lon},${drop.lat}?overview=false`
    );

    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const distanceInKm = data.routes[0].distance / 1000; // meters → km
      const durationInMin = data.routes[0].duration / 60; // seconds → minutes

      return {
        distance: Math.round(distanceInKm),
        duration: Math.round(durationInMin),
      };
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getMLPrice = async (distance: number, cabType: string) => {
  try {
    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        distance,
        cab_type: cabType,
        hour: new Date().getHours(),
        demand: 1.2, // you can make this dynamic later
      }),
    });

    const data = await res.json();
    return data.predicted_price;
  } catch (error) {
    console.error(error);
    return null;
  }
};
  useEffect(() => {
    if (!navigator.geolocation) {
      setPickup("Geolocation not supported");
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setPickupCoords({ lat, lon });
  
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
  
          setPickup(
            data.address.suburb ||
            data.address.city ||
            data.address.town ||
            "Current Location"
          );
        } catch {
          setPickup("Current Location");
        }
      },
      (error) => {
        console.error(error);
  
        if (error.code === 1) {
          // Permission denied
          setPickup("Permission denied (enable location)");
        } else {
          setPickup("Unable to fetch location");
        }
      }
    );
  }, []);

  const compareCabs = async () => {
    if (!drop) {
      showToast("Enter drop location", "error");
      return;
    }
  
    setLoading(true);
  
    if (!dropCoords) {
      showToast("Please select a location from suggestions", "error");
      setLoading(false);
      return;
    }
    
    const coords = dropCoords;
  
    if (!pickupCoords) {
      showToast("Pickup location not available", "error");
      setLoading(false);
      return;
    }
  
    const route = await getDistance(pickupCoords, coords);
    if (!route) {
      showToast("Unable to calculate distance", "error");
      setLoading(false);
      return;
    }
  
    const km = route.distance;
  
    const calculated = await Promise.all(
      CABS.map(async (cab) => {
        let type = "cab";
  
        if (cab.type.toLowerCase().includes("bike")) type = "bike";
        else if (cab.type.toLowerCase().includes("auto")) type = "auto";
  
        const predicted = await getMLPrice(km, type);
  
        const fare = predicted ?? Math.round(cab.base + km * cab.perKm);
  
        const eta = route.duration;
  
        return { ...cab, fare, eta };
      })
    );
    const sorted = [...calculated].sort((a, b) => a.fare - b.fare);
    const best = sorted[0];
const better = sorted[1];
const average = sorted[2];

const rest = sorted.slice(3);

setTopPicks([
  { ...best, label: "BEST" },
  { ...better, label: "BETTER" },
  { ...average, label: "AVERAGE" },
]);

setResults(rest);
  
    setDistance(km);
    // 💰 Cheapest
const cheapest = Math.min(...calculated.map(c => c.fare));

// ⚡ Fastest
const fastest = Math.min(...calculated.map(c => c.eta));

// 🧠 Best overall (weighted score)
const bestCab = calculated.reduce((best, cab) => {
  const score = cab.fare * 0.7 + cab.eta * 0.3;
  const bestScore = best.fare * 0.7 + best.eta * 0.3;
  return score < bestScore ? cab : best;
});

// 🏷️ Add tags
const enhanced = calculated.map(cab => {
  let tag = "";

  if (cab.fare === cheapest) tag = "💰 Cheapest";
  else if (cab.eta === fastest) tag = "⚡ Fastest";
  else if (cab === bestCab) tag = "🧠 Best Choice";

  return { ...cab, tag };
});
// Set states
setResults(enhanced);

    setLoading(false);
    showToast("Best cab options calculated", "success");
  };

  return (
    <>
      {/* 🔔 TOAST */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-toast-in">
          <div
            className={`relative min-w-70 rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-slate-900/90
            ${
              toast.type === "success"
                ? "border-green-500/40 text-green-300"
                : toast.type === "error"
                ? "border-red-500/40 text-red-300"
                : "border-sky-500/40 text-sky-300"
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/10 overflow-hidden rounded-b-xl">
              <div
                className={`h-full ${
                  toast.type === "success"
                    ? "bg-green-400"
                    : toast.type === "error"
                    ? "bg-red-400"
                    : "bg-sky-400"
                } animate-toast-progress`}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold mb-2">Cab Comparison</h1>
        <p className="text-gray-400 mb-8">
          Compare nearby cab services based on your location.
        </p>
        <button
  onClick={() => {
    const newState = !useCurrentLocation;
    setUseCurrentLocation(newState);
  
    if (newState) {
      // switching to current location
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
  
        setPickupCoords({ lat, lon });
        setPickup("Current Location");
      });
    } else {
      // switching to manual
      setPickup("");
      setPickupCoords(null);
    }
  }}
  className="mb-4 text-sm text-sky-400"
>
  {useCurrentLocation ? "Enter pickup manually" : "Use current location"}
</button>
        {/* INPUTS */}

        <LoadScript
  googleMapsApiKey="AIzaSyDgYEg-8e7nvJ6zqB4QwnqjhGJl-oSKMuE"
  libraries={["places"]}
>
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 grid md:grid-cols-2 gap-4 mb-6">

    {/* PICKUP */}
    {useCurrentLocation ? (
      <input className="input opacity-60 cursor-not-allowed" value={pickup} disabled />
    ) : (
      <Autocomplete
        onLoad={(auto) => setPickupAutocomplete(auto)}
        onPlaceChanged={() => {
          if (!pickupAutocomplete) return;

          const place = pickupAutocomplete.getPlace();

          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setPickup(place.formatted_address);
            setPickupCoords({ lat, lon: lng });
          }
        }}
      >
        <input
          className="input"
          placeholder="Enter pickup location"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
        />
      </Autocomplete>
    )}

    {/* DROP */}
    <Autocomplete
      onLoad={(auto) => setAutocomplete(auto)}
      onPlaceChanged={() => {
        if (!autocomplete) return;

        const place = autocomplete.getPlace();

        if (place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setDrop(place.formatted_address);
          setDropCoords({ lat, lon: lng });
        }
      }}
    >
      <input
        className="input"
        placeholder="Enter drop location"
        value={drop}
        onChange={(e) => setDrop(e.target.value)}
      />
    </Autocomplete>

  </div>
</LoadScript>

        <button
          onClick={compareCabs}
          disabled={loading}
          className="bg-sky-500 px-6 py-3 rounded-lg text-black font-semibold flex items-center gap-2 hover:bg-sky-400 transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></span>
              Comparing...
            </>
          ) : (
            "Compare Cabs"
          )}
        </button>

{/* TOP PICKS */}
        {topPicks.length > 0 && (
  <>
    <h2 className="text-xl font-semibold mt-6 mb-3">Top Picks</h2>

    <div className="grid md:grid-cols-3 gap-4">
      {topPicks.map((cab, i) => (
        <div
          key={i}
          className={`rounded-2xl p-6 border transition
            ${
              cab.label === "BEST"
                ? "border-green-400 bg-green-400/10"
                : cab.label === "BETTER"
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-sky-400 bg-sky-400/10"
            }
          `}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {cab.icon} {cab.provider} {cab.type}
            </h2>
            <span className="text-xs font-medium">
              {cab.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-400">
            ETA: {cab.eta} mins
          </p>

          <p className="mt-2 font-semibold text-lg">
            ₹ {cab.fare}
          </p>
        </div>
      ))}
    </div>
  </>
)}

        {/* RESULTS */}
        {results.length > 0 && (
          <>
            <p className="mt-6 text-gray-400">
              Estimated distance:{" "}
              <span className="text-white">{distance} km</span>
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {results.map((cab, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-sky-400/40 transition"
                >
                  <h2 className="text-lg font-semibold mb-1">
  {cab.icon} {cab.provider} {cab.type}
</h2>

{cab.tag && (
  <span className="text-xs px-2 py-1 bg-sky-500/20 text-sky-300 rounded">
    {cab.tag}
  </span>
)}
                  <p className="text-gray-300">Fare: ₹{cab.fare}</p>
                  <p className="text-gray-300">ETA: {cab.eta} mins</p>

                  <button
                    onClick={() => setPopup(cab.provider)}
                    className="mt-3 w-full bg-white/10 py-2 rounded-lg hover:bg-white/20 transition"
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-8">
              * Prices are approximate. Final fare will be shown in partner app.
            </p>
          </>
        )}

        {/* POPUP */}
        {popup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center max-w-sm w-full">
              <h2 className="text-xl font-bold mb-3">Redirect Notice</h2>

              <p className="text-gray-400 mb-6">
                This will open in{" "}
                <span className="text-white font-semibold">{popup}</span> App only.
              </p>

              <button
                onClick={() => setPopup(null)}
                className="bg-sky-500 px-6 py-2 rounded-lg text-black font-semibold hover:bg-sky-400 transition"
              >
                Okay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 Animations */}
      <style jsx global>{`
        @keyframes toast-in {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-toast-in {
          animation: toast-in 0.4s ease-out;
        }

        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-toast-progress {
          animation: toast-progress 3.5s linear forwards;
        }
      `}</style>
    </>
  );
  }