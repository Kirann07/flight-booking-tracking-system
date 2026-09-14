/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cache: any = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 min cache

async function airlabs(path: string, key: string) {
  const url = `https://airlabs.co/api/v9/${path}${path.includes("?") ? "&" : "?"}api_key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Airlabs ${path} failed: ${t}`);
  }
  return res.json();
}

export async function GET() {
  try {
    if (cache && Date.now() - lastFetch < CACHE_TTL) {
      return NextResponse.json({ ...cache, cached: true });
    }

    const API_KEY = process.env.AIRLABS_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "Missing AIRLABS_API_KEY" }, { status: 500 });
    }

    // 1) Live flights
    const flightsRes = await airlabs("flights", API_KEY);
    // 
    const schedulesRes = await airlabs("schedules?limit=100", API_KEY);
    const scheduleMap = new Map<string, any>(
      (schedulesRes?.response || []).map((s: any) => [
        s.flight_iata,
        s
      ])
    );

    // 2) Airports (limited sample to avoid heavy payload)
    const airportsRes = await airlabs("airports?limit=1000", API_KEY);
    const airportMap = new Map<string, any>(
      airportsRes.response.map((a: any) => [a.iata_code, a])
    );

    // 3) Airlines
    const airlinesRes = await airlabs("airlines", API_KEY);
    // const airlineMap = new Map(
    //   airlinesRes.response.map((a: any) => [a.iata_code, a])
    // );
    const airlineMap = new Map<string, any>(
      (airlinesRes?.response || []).map((a: any) => [a.iata_code, a])
    );
    // 4) Routes / schedules (sample – may be limited on free tier)
    const routesRes = await airlabs("routes?limit=50", API_KEY);

    // Normalize Flights (Live tracking + status + aircraft)
    // const flights =
    //   flightsRes?.response?.slice(0, 100).map((f: any) => ({

    //     flightNumber: f.flight_iata || f.flight_icao || "—",
    //     // airline: {
    //     //   name: f.airline_name || "—",
    //     //   iata: f.airline_iata || "—",
    //     //   icao: f.airline_icao || "—",
    //     // },

    //     airline: {
    //       name: airlineInfo?.name || f.airline_iata || "—",
    //       iata: f.airline_iata || "—",
    //       icao: f.airline_icao || "—",
    //       country: airlineInfo?.country || null
    //     },
    //     position: {
    //       lat: f.lat ?? null,
    //       lng: f.lng ?? null,
    //     },
    //     altitudeM: f.alt ?? null,
    //     speedKmh: f.speed ?? null,
    //     direction: f.dir ?? null,
    //     status: f.status || "—",
    //     departure: {
    //       iata: f.dep_iata || "—",
    //       icao: f.dep_icao || "—",
    //       scheduled: f.dep_time || null,
    //       actual: f.dep_time_actual || null,
    //       terminal: f.dep_terminal || null,
    //       gate: f.dep_gate || null,
    //       delayMin: f.dep_delay || null,
    //     },
    //     arrival: {
    //       iata: f.arr_iata || "—",
    //       icao: f.arr_icao || "—",
    //       scheduled: f.arr_time || null,
    //       actual: f.arr_time_actual || null,
    //       terminal: f.arr_terminal || null,
    //       gate: f.arr_gate || null,
    //       delayMin: f.arr_delay || null,
    //     },
    //     aircraft: {
    //       type: f.aircraft_icao || "—",
    //       registration: f.reg_number || "—",
    //       manufacturer: f.manufacturer || "—",
    //     },
    //   })) || [];
    const flights =
      flightsRes?.response?.slice(0, 100).map((f: any) => {

        const airlineInfo = airlineMap.get(f.airline_iata) as any;
        const depAirport = airportMap.get(f.dep_iata);
        const arrAirport = airportMap.get(f.arr_iata);
        const schedule = scheduleMap.get(f.flight_iata) as any;

        return {
          flightNumber: f.flight_iata || f.flight_icao || "—",

          airline: {
            name: airlineInfo?.name || f.airline_iata || "—",
            iata: f.airline_iata || "—",
            icao: f.airline_icao || "—",
            country: airlineInfo?.country || null,
          },

          country:
            depAirport?.country ||
            arrAirport?.country ||
            airlineInfo?.country ||
            null,

          position: {
            lat: f.lat ?? null,
            lng: f.lng ?? null,
          },

          altitudeM: f.alt ?? null,
          speedKmh: f.speed ?? null,
          direction: f.dir ?? null,
          status: f.status || "—",

          departure: {
            iata: f.dep_iata || "—",
            icao: f.dep_icao || "—",
            scheduled: schedule?.dep_time || null,
            actual: schedule?.dep_time_actual || null,
            terminal: f.dep_terminal || null,
            gate: f.dep_gate || null,
            delayMin: f.dep_delay || null,
          },

          arrival: {
            iata: f.arr_iata || "—",
            icao: f.arr_icao || "—",
            scheduled: schedule?.arr_time || null,
            actual: schedule?.arr_time_actual || null,
            terminal: f.arr_terminal || null,
            gate: f.arr_gate || null,
            delayMin: f.arr_delay || null,
          },

          aircraft: {
            type: f.aircraft_icao || "—",
            registration: f.reg_number || "—",
            manufacturer: f.manufacturer || "—",
          },
        };

      }) || [];
    // Normalize Airports
    const airports =
      airportsRes?.response?.slice(0, 50).map((a: any) => ({
        name: a.name || "—",
        iata: a.iata_code || "—",
        icao: a.icao_code || "—",
        city: a.city || "—",
        country: a.country || "—",
        lat: a.lat || null,
        lng: a.lng || null,
      })) || [];

    // Normalize Airlines
    const airlines =
      airlinesRes?.response?.slice(0, 50).map((al: any) => ({
        name: al.name || "—",
        iata: al.iata_code || "—",
        icao: al.icao_code || "—",
        country: al.country || "—",
        fleet: al.fleet || null,
      })) || [];

    // Normalize Routes / Schedules
    const routes =
      routesRes?.response?.slice(0, 50).map((r: any) => ({
        from: r.dep_iata || "—",
        to: r.arr_iata || "—",
        days: r.days || [],
        active: r.active ?? null,
      })) || [];

    const payload = { flights, airports, airlines, routes };
    cache = payload;
    lastFetch = Date.now();

    return NextResponse.json({ ...payload, cached: false });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Airlabs aggregate route crashed", message: err?.message || "fetch failed" },
      { status: 500 }
    );
  }
}
