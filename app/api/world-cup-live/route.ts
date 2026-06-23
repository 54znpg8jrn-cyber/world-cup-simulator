import { NextResponse } from "next/server";
import { WALL_CHART_FIXTURES } from "../../lib/wall-chart";
import {
  getFallbackCalculatorScores,
  type CalculatorScores,
} from "../../lib/world-cup-calculator";

function normalizeProviderResults(payload: unknown): CalculatorScores {
  const data = payload as { results?: CalculatorScores; response?: Array<{ teams?: { home?: { code?: string; name?: string }; away?: { code?: string; name?: string } }; goals?: { home?: number | null; away?: number | null } }> };
  if (data.results && typeof data.results === "object") return data.results;
  const fixtures = data.response ?? [];
  return fixtures.reduce<CalculatorScores>((scores, match) => {
    const home = match.teams?.home;
    const away = match.teams?.away;
    const homeGoals = match.goals?.home;
    const awayGoals = match.goals?.away;
    if (!home || !away || homeGoals === null || homeGoals === undefined || awayGoals === null || awayGoals === undefined) return scores;
    const fixture = WALL_CHART_FIXTURES.find((candidate) =>
      (candidate.home.code === home.code || candidate.home.name === home.name) &&
      (candidate.away.code === away.code || candidate.away.name === away.name),
    );
    if (fixture) scores[fixture.id] = { home: String(homeGoals), away: String(awayGoals) };
    return scores;
  }, {});
}

export async function GET() {
  const fallback = getFallbackCalculatorScores();
  try {
    const url = process.env.WORLD_CUP_LIVE_API_URL;
    const apiKey = process.env.WORLD_CUP_LIVE_API_KEY;
    if (!url || !apiKey) {
      return NextResponse.json({ source: "fallback", fixtures: WALL_CHART_FIXTURES, results: fallback, updatedAt: new Date().toISOString() });
    }

    // TODO: Configure the provider URL for the 2026 World Cup and adapt this normalizer if its payload differs.
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Live data provider responded ${response.status}`);
    const liveResults = normalizeProviderResults(await response.json());
    return NextResponse.json({ source: "live", fixtures: WALL_CHART_FIXTURES, results: { ...fallback, ...liveResults }, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("World Cup live data fallback failed", error);
    return NextResponse.json({ source: "fallback", fixtures: WALL_CHART_FIXTURES, results: fallback, updatedAt: new Date().toISOString() });
  }
}
