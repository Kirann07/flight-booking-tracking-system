import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.AIRLABS_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const res = await fetch(
      `https://airlabs.co/api/v9/airports?limit=200&api_key=${API_KEY}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    // Remove duplicates
    const seen = new Set();

    const airports = data.response
      .filter((a: any) => {
        if (!a.iata_code) return false;
        const key = a.iata_code + a.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((a: any) => ({
        code: a.iata_code,
        name: a.name,
        city: a.city || a.city_code || null,
      }));

    return NextResponse.json({ airports });

  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch airports" }, { status: 500 });
  }
}
