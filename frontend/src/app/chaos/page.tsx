"use client";

import { useEffect, useState } from "react";

type ChaosItem = {
  airport: string;
  city: string;
  severity: "low" | "medium" | "high";
  message: string;
};

type Weather = {
  condition: string;
  temp: number;
};

// 🌧️ MOCK WEATHER (we’ll replace with real API later)
const getWeather = async (city: string) => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}`
    );

    if (!res.ok) throw new Error("Weather failed");

    const data = await res.json();

    return {
      condition: data.weather[0].main,
      temp: Math.round(data.main.temp),
    };
  } catch {
    return {
      condition: "Unknown",
      temp: 0,
    };
  }
};

// 🤖 AI PREDICTION LOGIC
const getPrediction = (severity: string, weather: string) => {
  if (weather === "Storm" || weather === "Thunderstorm") {
    return "🚨 Severe weather — High delay risk";
  }

  if (weather === "Rain" && severity !== "low") {
    return "⚠️ Rain + delays — Expect disruptions";
  }

  if (severity === "high") {
    return "🚨 High operational congestion";
  }

  if (severity === "medium") {
    return "⚠️ Moderate delays expected";
  }

  return "✅ Smooth operations likely";
};

export default function ChaosRadarPage() {
  const [items, setItems] = useState<ChaosItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [airport, setAirport] = useState("");
  const [weatherMap, setWeatherMap] = useState<Record<string, any>>({});

  const fetchChaos = async () => {
    try {
      setLoading(true);
      setError("");
  
      const url = airport
        ? `/api/airlabs/chaos?iata=${airport}`
        : `/api/airlabs/chaos`;
  
      const res = await fetch(url);
  
      if (!res.ok) throw new Error("API failed");
  
      const data = await res.json();
      const chaosItems = data?.chaos ?? [];
  
      setItems(chaosItems);
  
      // 🌧️ FETCH WEATHER FOR EACH CITY
      const weatherData: Record<string, any> = {};
  
      await Promise.all(
        chaosItems.map(async (c: any) => {
          const weather = await getWeather(c.city);
          weatherData[c.city] = weather;
        })
      );
  
      setWeatherMap(weatherData);
  
    } catch {
      setError("Failed to load Chaos Radar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChaos();
  }, []);

  return (
    <div style={{ padding: "40px", color: "white", maxWidth: "900px", margin: "auto" }}>
      
      {/* HEADER */}
      <h1 style={{ fontSize: "34px", fontWeight: "bold" }}>
        🧨 AI Chaos Radar
      </h1>
      <p style={{ opacity: 0.7 }}>
        Smart flight disruption + weather intelligence
      </p>

      {/* SEARCH */}
      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Search airport (DEL, JFK...)"
          value={airport}
          onChange={(e) => setAirport(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid gray",
            marginRight: "10px",
            width: "220px",
          }}
        />

        <button
          onClick={fetchChaos}
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid gray",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <button
          onClick={() => {
            setAirport("");
            fetchChaos();
          }}
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid gray",
            marginLeft: "10px",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      {/* STATES */}
      {loading && <p style={{ marginTop: "20px" }}>Loading...</p>}
      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}

      {/* CARDS */}
      <div style={{ marginTop: "20px" }}>
        {items.map((c, i) => {
          const weather = weatherMap[c.city] || null;
          const prediction = getPrediction(
            c.severity,
            weather?.condition || ""
          );

          return (
            <div
              key={i}
              style={{
                border:
                  c.severity === "high"
                    ? "1px solid red"
                    : c.severity === "medium"
                    ? "1px solid orange"
                    : "1px solid green",

                background:
                  c.severity === "high"
                    ? "rgba(255,0,0,0.1)"
                    : c.severity === "medium"
                    ? "rgba(255,165,0,0.1)"
                    : "rgba(0,255,0,0.05)",

                padding: "16px",
                borderRadius: "12px",
                marginBottom: "14px",
                transition: "0.3s ease",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {c.city} ({c.airport})
              </h3>

              <p style={{ margin: "6px 0" }}>{c.message}</p>

              {/* WEATHER */}
              <p style={{ fontSize: "14px", opacity: 0.8 }}>
                🌧️ Weather: {weather?.condition || "Loading..."} |{" "} {weather?.temp ?? "--"}°C
              </p>

              {/* AI PREDICTION */}
              <p style={{ fontWeight: "bold", marginTop: "6px" }}>
                🤖 {prediction}
              </p>

              {/* ALERT */}
              {c.severity === "high" && (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  🚨 HIGH ALERT
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}