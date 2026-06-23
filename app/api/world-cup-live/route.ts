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
  if (data.results && typeof data.results === "object") return { results: data.results, liveFixtureIds: [] as string[] };
  return (data.response ?? []).reduce<{ results: CalculatorScores; liveFixtureIds: string[] }>((accumulator, match) => {
    const home = match.teams?.home;
    const away = match.teams?.away;
    const fixture = WALL_CHART_FIXTURES.find((candidate) =>
      (candidate.home.code === home?.code || candidate.home.name === normalizedName(home?.name)) &&
      (candidate.away.code === away?.code || candidate.away.name === normalizedName(away?.name)),
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
  const url = process.env.worldcup_live_api_url ?? process.env.WORLD_CUP_LIVE_API_URL;
  const apiKey = process.env.worldcup_live_api_key ?? process.env.WORLD_CUP_LIVE_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json({ status: "demo", fixtures: WALL_CHART_FIXTURES, results: fallback, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
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
    if (!standingsResponse.ok) throw new Error(`Live standings provider responded ${standingsResponse.status}`);
    const fixturePayload = await fixtureResponse.json();
    const standingsPayload = await standingsResponse.json();
    const live = normalizeProviderResults(fixturePayload);
    const knockoutFixtures = (fixturePayload.response ?? []).filter((fixture: ProviderFixture & { league?: { round?: string } }) => !fixture.league?.round?.toLowerCase().includes("group"));
    return NextResponse.json({
      status: "live",
      fixtures: WALL_CHART_FIXTURES,
      results: live.results,
      liveFixtureIds: live.liveFixtureIds,
      standings: standingsPayload.response ?? [],
      knockoutFixtures,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("World Cup live data request failed", error);
    return NextResponse.json({ status: "unavailable", fixtures: WALL_CHART_FIXTURES, results: fallback, liveFixtureIds: [], updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
