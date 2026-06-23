import { WORLD_CUP_GROUPS } from "../data/groups";
import { WALL_CHART_FIXTURES } from "./wall-chart";
import { buildOfficialRoundOf32 } from "./tournament";
import type { GroupTableRow, QualifiedTeam, TournamentFixture } from "./types";

export interface CalculatorScore {
  home: string;
  away: string;
}

export type CalculatorScores = Record<string, CalculatorScore>;

type ResultSeed = readonly [string, string, number, number];

// Bundled score snapshot used whenever a live provider is not configured.
// Keep scores keyed by teams, not match number: the legacy schedule order can change.
const FALLBACK_RESULT_SEEDS: ResultSeed[] = [
  ["MEX", "RSA", 2, 0], ["KOR", "CZE", 2, 1], ["CAN", "BIH", 1, 1], ["USA", "PAR", 4, 1],
  ["HAI", "SCO", 0, 1], ["AUS", "TUR", 2, 0], ["BRA", "MAR", 1, 1], ["QAT", "SUI", 1, 1],
  ["CIV", "ECU", 1, 0], ["GER", "CUW", 7, 1], ["NED", "JPN", 2, 2], ["SWE", "TUN", 5, 1],
  ["KSA", "URU", 1, 1], ["ESP", "CPV", 0, 0], ["IRN", "NZL", 2, 2], ["BEL", "EGY", 1, 1],
  ["FRA", "SEN", 3, 1], ["IRQ", "NOR", 1, 4], ["ARG", "ALG", 3, 0], ["AUT", "JOR", 3, 1],
  ["GHA", "PAN", 1, 0], ["ENG", "CRO", 4, 2], ["POR", "COD", 1, 1], ["UZB", "COL", 1, 3],
  ["CZE", "RSA", 1, 1], ["SUI", "BIH", 4, 1], ["CAN", "QAT", 6, 0], ["MEX", "KOR", 1, 0],
  ["BRA", "HAI", 3, 0], ["SCO", "MAR", 0, 1], ["TUR", "PAR", 0, 1], ["USA", "AUS", 2, 0],
  ["GER", "CIV", 2, 1], ["ECU", "CUW", 0, 0], ["NED", "SWE", 5, 1], ["TUN", "JPN", 0, 4],
  ["URU", "CPV", 2, 2], ["ESP", "KSA", 4, 0], ["BEL", "IRN", 0, 0], ["NZL", "EGY", 1, 3],
  ["NOR", "SEN", 3, 2], ["ARG", "AUT", 2, 0], ["JOR", "ALG", 1, 2],
  ["FRA", "IRQ", 3, 0], ["POR", "UZB", 5, 0],
];

export function getFallbackCalculatorScores(): CalculatorScores {
  const byPair = new Map(FALLBACK_RESULT_SEEDS.map(([home, away, homeGoals, awayGoals]) => [`${home}-${away}`, { homeGoals, awayGoals }]));
  return WALL_CHART_FIXTURES.reduce<CalculatorScores>((scores, fixture) => {
    const direct = byPair.get(`${fixture.home.code}-${fixture.away.code}`);
    const reverse = byPair.get(`${fixture.away.code}-${fixture.home.code}`);
    if (direct) scores[fixture.id] = { home: String(direct.homeGoals), away: String(direct.awayGoals) };
    if (reverse) scores[fixture.id] = { home: String(reverse.awayGoals), away: String(reverse.homeGoals) };
    return scores;
  }, {});
}

const emptyRow = (nation: GroupTableRow["nation"]): GroupTableRow => ({
  nation,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

const compareRows = (a: GroupTableRow, b: GroupTableRow) =>
  b.points - a.points ||
  (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
  b.goalsFor - a.goalsFor ||
  b.nation.strength - a.nation.strength ||
  a.nation.name.localeCompare(b.nation.name);

/** TODO: Replace the static fixture input with normalized live-provider fixtures when available. */
export function calculateGroupTables(scores: CalculatorScores): Record<string, GroupTableRow[]> {
  return Object.fromEntries(Object.entries(WORLD_CUP_GROUPS).map(([group, nations]) => {
    const rows = nations.map(emptyRow);
    const rowsByCode = new Map(rows.map((row) => [row.nation.code, row]));
    WALL_CHART_FIXTURES.filter((fixture) => fixture.group === group).forEach((fixture) => {
      const score = scores[fixture.id];
      if (!score || score.home === "" || score.away === "") return;
      const homeGoals = Number(score.home);
      const awayGoals = Number(score.away);
      if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return;
      const apply = (code: string, goalsFor: number, goalsAgainst: number) => {
        const row = rowsByCode.get(code);
        if (!row) return;
        row.played += 1;
        row.goalsFor += goalsFor;
        row.goalsAgainst += goalsAgainst;
        if (goalsFor > goalsAgainst) { row.won += 1; row.points += 3; }
        else if (goalsFor === goalsAgainst) { row.drawn += 1; row.points += 1; }
        else row.lost += 1;
      };
      apply(fixture.home.code, homeGoals, awayGoals);
      apply(fixture.away.code, awayGoals, homeGoals);
    });
    return [group, rows.sort(compareRows)];
  }));
}

export function calculateBestThirdPlacedTeams(tables: Record<string, GroupTableRow[]>): QualifiedTeam[] {
  return Object.entries(tables)
    .map(([group, rows]) => ({ nation: rows[2].nation, group, position: 3 as const, tableRow: rows[2] }))
    .sort((a, b) => compareRows(a.tableRow, b.tableRow))
    .slice(0, 8);
}

/** Builds a provisional Round of 32 from the standings as they are right now. */
export function calculateKnockoutBracket(tables: Record<string, GroupTableRow[]>): TournamentFixture[] {
  const automatic: QualifiedTeam[] = Object.entries(tables).flatMap(([group, rows]) => [
    { nation: rows[0].nation, group, position: 1 as const, tableRow: rows[0] },
    { nation: rows[1].nation, group, position: 2 as const, tableRow: rows[1] },
  ]);
  const bestThirds = calculateBestThirdPlacedTeams(tables);
  try {
    return buildOfficialRoundOf32(automatic, bestThirds);
  } catch {
    // A partial table can produce a third-place combination outside the official mapping.
    // Keep the calculator useful with a deterministic provisional pairing until it resolves.
    return [...automatic, ...bestThirds]
      .map((team) => team.nation)
      .reduce<TournamentFixture[]>((fixtures, nation, index, teams) => {
        if (index % 2 === 0 && teams[index + 1]) {
          fixtures.push({
            id: `provisional-match-${73 + index / 2}`,
            matchNumber: 73 + index / 2,
            round: "Round of 32",
            home: nation,
            away: teams[index + 1],
            homeGoals: 0,
            awayGoals: 0,
          });
        }
        return fixtures;
      }, []);
  }
}

export function updateFixtureResult(
  scores: CalculatorScores,
  fixtureId: string,
  side: "home" | "away",
  value: string,
): CalculatorScores {
  const numericValue = Number(value);
  const normalized = value === "" || !Number.isFinite(numericValue)
    ? ""
    : String(Math.max(0, Math.floor(numericValue)));
  return {
    ...scores,
    [fixtureId]: { home: scores[fixtureId]?.home ?? "", away: scores[fixtureId]?.away ?? "", [side]: normalized },
  };
}
