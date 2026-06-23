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

const providerNameAliases: Record<string, string> = {
  "Korea Republic": "South Korea",
  Czechia: "Czech Republic",
  "IR Iran": "Iran",
  "Côte d'Ivoire": "Ivory Coast",
  "Cabo Verde": "Cape Verde",
  "Congo DR": "DR Congo",
  "Türkiye": "Turkey",
  "United States": "USA",
  "Curacao": "Curaçao",
};

function normalizedName(name?: string) {
  return providerNameAliases[name ?? ""] ?? name ?? "";
}

function providerUrl(baseUrl: string, endpoint: string) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(endpoint, base).toString();
}

function normalizeProviderResults(payload: unknown) {
  const data = payload as { results?: CalculatorScores; response?: ProviderFixture[] };
  if (data.results && typeof data.results === "object") {
    const scoredFixtureIds = Object.entries(data.results).filter(([, score]) => score.home !== "" && score.away !== "").map(([id]) => id);
    return { results: data.results, liveFixtureIds: [] as string[], recognizedFixtureCount: scoredFixtureIds.length, scoredFixtureCount: scoredFixtureIds.length };
  }
  return (data.response ?? []).reduce<{ results: CalculatorScores; liveFixtureIds: string[]; recognizedFixtureCount: number; scoredFixtureCount: number }>((accumulator, match) => {
    const home = match.teams?.home;
    const away = match.teams?.away;
    const fixture = WALL_CHART_FIXTURES.find((candidate) =>
      (candidate.home.code === home?.code || candidate.home.name === normalizedName(home?.name)) &&
      (candidate.away.code === away?.code || candidate.away.name === normalizedName(away?.name)),
    );
    if (!fixture) return accumulator;
    accumulator.recognizedFixtureCount += 1;
    const status = match.fixture?.status?.short;
    if (status && !["FT", "AET", "PEN"].includes(status)) accumulator.liveFixtureIds.push(fixture.id);
    if (match.goals?.home !== null && match.goals?.home !== undefined && match.goals?.away !== null && match.goals?.away !== undefined) {
      accumulator.results[fixture.id] = { home: String(match.goals.home), away: String(match.goals.away) };
      accumulator.scoredFixtureCount += 1;
    }
    return accumulator;
  }, { results: {}, liveFixtureIds: [], recognizedFixtureCount: 0, scoredFixtureCount: 0 });
}

export async function GET() {
  const fallback = getFallbackCalculatorScores();
  const url = process.env.worldcup_live_api_url ?? process.env.WORLD_CUP_LIVE_API_URL;
  const apiKey = process.env.worldcup_live_api_key ?? process.env.WORLD_CUP_LIVE_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ status: "fallback", valid: true, fixtures: WALL_CHART_FIXTURES, results: fallback, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  try {
    const headers = { "x-apisports-key": apiKey };
    const [fixtureResponse, standingsResponse] = await Promise.all([
      fetch(providerUrl(url, "fixtures?league=1&season=2026"), {
        headers,
        cache: "no-store",
        next: { revalidate: 0 },
      }),
      fetch(providerUrl(url, "standings?league=1&season=2026"), {
        headers,
        cache: "no-store",
        next: { revalidate: 0 },
      }),
    ]);
    if (!fixtureResponse.ok) throw new Error(`Live fixtures provider responded ${fixtureResponse.status}`);
    const fixturePayload = await fixtureResponse.json();
    const standingsPayload = standingsResponse.ok ? await standingsResponse.json() : { response: [] };
    if (!standingsResponse.ok) {
      console.error(`Live standings provider responded ${standingsResponse.status}; continuing with fixture-derived tables`);
    }
    const live = normalizeProviderResults(fixturePayload);
    if (live.recognizedFixtureCount === 0 || live.scoredFixtureCount === 0) {
      console.error("World Cup live normalization produced no scored project fixtures", {
        recognizedFixtureCount: live.recognizedFixtureCount,
        scoredFixtureCount: live.scoredFixtureCount,
      });
      return NextResponse.json({ status: "api-error", valid: false, fixtures: WALL_CHART_FIXTURES, results: {}, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    const knockoutFixtures = (fixturePayload.response ?? []).filter((fixture: ProviderFixture & { league?: { round?: string } }) => !fixture.league?.round?.toLowerCase().includes("group"));
    return NextResponse.json({
      status: "live",
      valid: true,
      fixtures: WALL_CHART_FIXTURES,
      results: live.results,
      liveFixtureIds: live.liveFixtureIds,
      standings: standingsPayload.response ?? [],
      knockoutFixtures,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("World Cup live data request failed", error);
    return NextResponse.json({ status: "api-error", valid: false, fixtures: WALL_CHART_FIXTURES, results: {}, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
