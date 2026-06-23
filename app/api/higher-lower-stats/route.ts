import { NextResponse } from "next/server";
import { HIGHER_LOWER_ITEMS } from "../../lib/games/higher-lower-data";

export async function GET() {
  try {
    // TODO: Fetch licensed current stats here and normalize them to HigherLowerItem before returning.
    // Static data remains the resilient fallback until a provider and API key are configured.
    if (process.env.HIGHER_LOWER_STATS_API_URL && process.env.HIGHER_LOWER_STATS_API_KEY) {
      // Keep external API calls server-side so provider keys are never exposed to the browser.
    }
    return NextResponse.json({ source: "static", items: HIGHER_LOWER_ITEMS });
  } catch (error) {
    console.error("Higher / Lower stats fallback failed", error);
    return NextResponse.json({ source: "fallback", items: HIGHER_LOWER_ITEMS });
  }
}
