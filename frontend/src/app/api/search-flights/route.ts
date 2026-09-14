import { NextResponse } from "next/server";

const AIRLINES = [
  { code: "6E", name: "IndiGo", priceFactor: 0 },
  { code: "AI", name: "Air India", priceFactor: 800 },
  { code: "UK", name: "Vistara", priceFactor: 1200 },
];

const ROUTE_BASE_PRICE: any = {
  DEL_BLR: 7500,
  BLR_DEL: 7500,
  DEL_BOM: 6000,
  BOM_DEL: 6000,
  BLR_BOM: 5500,
  BOM_BLR: 5500,
};

function getBasePrice(from: string, to: string) {
  return ROUTE_BASE_PRICE[`${from}_${to}`] || 6500;
}

function generateFlights(from: string, to: string, date: string, cabin: string) {
  const flights = [];
  const basePrice = getBasePrice(from, to);

  const today = new Date();
  const flightDate = new Date(date);
  const diffDays =
    (flightDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  const timeSlots = [
      "05:30", "06:15", "07:00",
      "08:30", "09:45", "10:30",
      "12:00", "13:15", "14:30",
      "16:00", "17:20", "18:45",
      "20:00", "21:30", "23:00"
    ];

  for (let i = 0; i < timeSlots.length; i++) {
    const airline = AIRLINES[i % AIRLINES.length];

    // ✈️ Price logic
    let price = basePrice;

    if (diffDays > 15) price -= 1000;
    if (diffDays < 5) price += 1500;

    if (i === 0) price += 800; // morning
    if (i === 3) price += 1000; // evening

    price += airline.priceFactor;

    // randomness
    price += Math.floor(Math.random() * 1500);
    // 🎯 Cabin pricing
if (cabin === "PREMIUM_ECONOMY") price *= 1.4;
if (cabin === "BUSINESS") price *= 2.2;
if (cabin === "FIRST") price *= 3;

    // times
    const dep = `${date}T${timeSlots[i]}:00`;
    const [h, m] = timeSlots[i].split(":").map(Number);
const arr = `${date}T${h + 2}:${m + Math.floor(Math.random() * 20)}:00`;
    // const arrHour = parseInt(timeSlots[i].split(":")[0]) + 2;
    // const arr = `${date}T${arrHour}:${timeSlots[i].split(":")[1]}:00`;

    flights.push({
      id: `${from}-${to}-${i}`,
      priceInr: Math.round(price),
      currency: "INR",
      airline: airline.code,
      flight: `${airline.code}${200 + i}`,
      from,
      to,
      dep,
      arr,
      duration: "2h 30m",
      cabin: cabin,
      fareClass: "T",
    });
  }

  return flights;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from") || "DEL";
  const to = searchParams.get("to") || "BOM";
  const date = searchParams.get("date") || "2026-04-20";
  const cabin = searchParams.get("cabin") || "ECONOMY";

  const offers = generateFlights(from, to, date, cabin);

  return NextResponse.json({ offers });
}