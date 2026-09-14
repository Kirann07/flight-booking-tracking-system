import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChaosItem = {
  airport: string;
  city: string;
  severity: "low" | "medium" | "high";
  message: string;
};

// 🇮🇳 Default airports (dashboard mode)
const INDIA_AIRPORTS = [
  { iata: "DEL", city: "Delhi" },
  { iata: "BOM", city: "Mumbai" },
  { iata: "BLR", city: "Bengaluru" },
  { iata: "HYD", city: "Hyderabad" },
  { iata: "CCU", city: "Kolkata" },
  { iata: "MAA", city: "Chennai" },
  { iata: "GOI", city: "Goa" },
  { iata: "AMD", city: "Ahmedabad" },
  { iata: "PNQ", city: "Pune" },
  { iata: "JAI", city: "Jaipur" },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const airport = searchParams.get("iata");

    const key = process.env.AIRLABS_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "Missing AIRLABS_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `https://airlabs.co/api/v9/flights?api_key=${key}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "AirLabs failed", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const flights: any[] = data?.response || [];

    // 🧠 Core logic (reusable)
    const getChaos = (code: string, city: string): ChaosItem => {
      const related = flights.filter(
        (f) => f?.dep_iata === code || f?.arr_iata === code
      );

      if (related.length === 0) {
        return {
          airport: code,
          city,
          severity: "low",
          message: "No flight data available",
        };
      }

      const delayed = related.filter((f) => {
        const status = f?.status?.toLowerCase();

        return (
          status === "delayed" ||
          status === "cancelled" ||
          f?.dep_delay > 15 ||
          f?.arr_delay > 15
        );
      }).length;

      const ratio = delayed / related.length;

      let severity: ChaosItem["severity"] = "low";
      if (ratio > 0.4) severity = "high";
      else if (ratio > 0.2) severity = "medium";

      return {
        airport: code,
        city,
        severity,
        message:
          severity === "high"
            ? `Heavy delays (${Math.round(ratio * 100)}%)`
            : severity === "medium"
            ? `Moderate delays (${Math.round(ratio * 100)}%)`
            : "Operations normal",
      };
    };

    // 🔍 SEARCH MODE
    if (airport && airport.trim() !== "") {
      const code = airport.toUpperCase();
      const result = getChaos(code, code);

      return NextResponse.json({
        chaos: [result],
      });
    }

    // 🌍 DASHBOARD MODE (default)
    const chaos = INDIA_AIRPORTS.map((ap) =>
      getChaos(ap.iata, ap.city)
    );

    return NextResponse.json({ chaos });

  } catch (err: any) {
    console.error("Chaos API error:", err);

    return NextResponse.json(
      {
        error: "Chaos API crashed",
        message: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}