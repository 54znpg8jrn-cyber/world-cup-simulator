import { NextResponse } from "next/server";
import { WALL_CHART_FIXTURES } from "../../lib/wall-chart";

export async function GET() {
  try {
    // TODO: When a licensed live-data provider is configured, fetch and normalize its scores here.
    // Keep this endpoint's { source, fixtures, results } shape stable for calculator clients.
    if (process.env.WORLD_CUP_LIVE_API_URL && process.env.WORLD_CUP_LIVE_API_KEY) {
      // A provider integration intentionally belongs here, not in a client component.
    }
    return NextResponse.json({ source: "static", fixtures: WALL_CHART_FIXTURES, results: {} });
  } catch (error) {
    console.error("World Cup live data fallback failed", error);
    return NextResponse.json({ source: "fallback", fixtures: WALL_CHART_FIXTURES, results: {} });
  }
}
