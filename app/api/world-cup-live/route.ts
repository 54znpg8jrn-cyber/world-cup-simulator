import { NextResponse } from "next/server";
import { WALL_CHART_FIXTURES } from "../../lib/wall-chart";
import {
  getFallbackCalculatorScores,
  type CalculatorScores,
} from "../../lib/world-cup-calculator";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProviderFixture = {
  fixture?: { status?: { short?: string } };
  teams?: { home?: { code?: string; name?: string }; away?: { code?: string; name?: string } };
  goals?: { home?: number | null; away?: number | null };
};

function normalizeProviderResults(payload: unknown) {
  const data = payload as { results?: CalculatorScores; response?: ProviderFixture[] };
  if (data.results && typeof data.results === "object") return { results: data.results, liveFixtureIds: [] as string[] };
  return (data.response ?? []).reduce<{ results: CalculatorScores; liveFixtureIds: string[] }>((accumulator, match) => {
    const home = match.teams?.home;
    const away = match.teams?.away;
    const fixture = WALL_CHART_FIXTURES.find((candidate) =>
      (candidate.home.code === home?.code || candidate.home.name === home?.name) &&
      (candidate.away.code === away?.code || candidate.away.name === away?.name),
    );
    if (!fixture) return accumulator;
    const status = match.fixture?.status?.short;
    if (status && !["FT", "AET", "PEN"].includes(status)) accumulator.liveFixtureIds.push(fixture.id);
    if (match.goals?.home !== null && match.goals?.home !== undefined && match.goals?.away !== null && match.goals?.away !== undefined) {
      accumulator.results[fixture.id] = { home: String(match.goals.home), away: String(match.goals.away) };
    }
    return accumulator;
  }, { results: {}, liveFixtureIds: [] });
}

export async function GET() {
  const fallback = getFallbackCalculatorScores();
  const url = process.env.WORLD_CUP_LIVE_API_URL;
  const apiKey = process.env.WORLD_CUP_LIVE_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ status: "demo", fixtures: WALL_CHART_FIXTURES, results: fallback, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  try {
    // TODO: Set the provider URL to its 2026 World Cup feed and extend this normalizer for provider-specific fields.
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!response.ok) throw new Error(`Live data provider responded ${response.status}`);
    const live = normalizeProviderResults(await response.json());
    return NextResponse.json({ status: "live", fixtures: WALL_CHART_FIXTURES, results: { ...fallback, ...live.results }, liveFixtureIds: live.liveFixtureIds, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("World Cup live data request failed", error);
    return NextResponse.json({ status: "unavailable", fixtures: WALL_CHART_FIXTURES, results: fallback, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
