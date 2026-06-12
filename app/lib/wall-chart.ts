import { WORLD_CUP_GROUPS } from "../data/groups";
import type {
  GroupTableRow,
  Nation,
  QualifiedTeam,
  TournamentFixture,
  TournamentRoundResults,
} from "./types";
import {
  buildOfficialRoundOf32,
  createNextOfficialRound,
} from "./tournament";

export interface WallChartFixture {
  id: string;
  group: string;
  home: Nation;
  away: Nation;
}

export interface ScoreValue {
  home: string;
  away: string;
}

export interface KnockoutPlaceholderFixture {
  id: string;
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
}

export interface KnockoutPlaceholderRound {
  round: TournamentRoundResults["round"];
  fixtures: KnockoutPlaceholderFixture[];
}

export const KNOCKOUT_PLACEHOLDER_ROUNDS: KnockoutPlaceholderRound[] = [
  {
    round: "Round of 32",
    fixtures: [
      [73, "Runner-up Group A", "Runner-up Group B"],
      [74, "Winner Group E", "Best 3rd from A/B/C/D/F"],
      [75, "Winner Group F", "Runner-up Group C"],
      [76, "Winner Group C", "Runner-up Group F"],
      [77, "Winner Group I", "Best 3rd from C/D/F/G/H"],
      [78, "Runner-up Group E", "Runner-up Group I"],
      [79, "Winner Group A", "Best 3rd from C/E/F/H/I"],
      [80, "Winner Group L", "Best 3rd from E/H/I/J/K"],
      [81, "Winner Group D", "Best 3rd from B/E/F/I/J"],
      [82, "Winner Group G", "Best 3rd from A/E/H/I/J"],
      [83, "Runner-up Group K", "Runner-up Group L"],
      [84, "Winner Group H", "Runner-up Group J"],
      [85, "Winner Group B", "Best 3rd from E/F/G/I/J"],
      [86, "Winner Group J", "Runner-up Group H"],
      [87, "Winner Group K", "Best 3rd from D/E/I/J/L"],
      [88, "Runner-up Group D", "Runner-up Group G"],
    ].map(([matchNumber, homeLabel, awayLabel]) => ({
      id: `match-${matchNumber}`,
      matchNumber: Number(matchNumber),
      homeLabel: String(homeLabel),
      awayLabel: String(awayLabel),
    })),
  },
  {
    round: "Round of 16",
    fixtures: [
      [89, 73, 75],
      [90, 74, 77],
      [91, 76, 78],
      [92, 79, 80],
      [93, 83, 84],
      [94, 81, 82],
      [95, 86, 88],
      [96, 85, 87],
    ].map(([matchNumber, homeSource, awaySource]) => ({
      id: `match-${matchNumber}`,
      matchNumber,
      homeLabel: `Winner Match ${homeSource}`,
      awayLabel: `Winner Match ${awaySource}`,
    })),
  },
  {
    round: "Quarter-final",
    fixtures: [
      [97, 89, 90],
      [98, 93, 94],
      [99, 91, 92],
      [100, 95, 96],
    ].map(([matchNumber, homeSource, awaySource]) => ({
      id: `match-${matchNumber}`,
      matchNumber,
      homeLabel: `Winner Match ${homeSource}`,
      awayLabel: `Winner Match ${awaySource}`,
    })),
  },
  {
    round: "Semi-final",
    fixtures: [
      [101, 97, 98],
      [102, 99, 100],
    ].map(([matchNumber, homeSource, awaySource]) => ({
      id: `match-${matchNumber}`,
      matchNumber,
      homeLabel: `Winner Match ${homeSource}`,
      awayLabel: `Winner Match ${awaySource}`,
    })),
  },
  {
    round: "Final",
    fixtures: [
      {
        id: "match-104",
        matchNumber: 104,
        homeLabel: "Winner Match 101",
        awayLabel: "Winner Match 102",
      },
    ],
  },
];

export const WALL_CHART_FIXTURES: WallChartFixture[] = Object.entries(
  WORLD_CUP_GROUPS,
).flatMap(([group, nations]) => {
  const fixtures: WallChartFixture[] = [];
  for (let home = 0; home < nations.length; home += 1) {
    for (let away = home + 1; away < nations.length; away += 1) {
      fixtures.push({
        id: `group-${group}-${home}-${away}`,
        group,
        home: nations[home],
        away: nations[away],
      });
    }
  }
  return fixtures;
});

const emptyRow = (nation: Nation): GroupTableRow => ({
  nation,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

export function calculateWallChartTables(
  scores: Record<string, ScoreValue>,
) {
  const tables: Record<string, GroupTableRow[]> = {};
  for (const [group, nations] of Object.entries(WORLD_CUP_GROUPS)) {
    let rows = nations.map(emptyRow);
    WALL_CHART_FIXTURES.filter((fixture) => fixture.group === group).forEach(
      (fixture) => {
        const score = scores[fixture.id];
        if (score?.home === "" || score?.away === "" || !score) return;
        const homeGoals = Number(score.home);
        const awayGoals = Number(score.away);
        if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return;
        rows = rows.map((row) => {
          if (
            row.nation.code !== fixture.home.code &&
            row.nation.code !== fixture.away.code
          ) {
            return row;
          }
          const isHome = row.nation.code === fixture.home.code;
          const goalsFor = isHome ? homeGoals : awayGoals;
          const goalsAgainst = isHome ? awayGoals : homeGoals;
          return {
            ...row,
            played: row.played + 1,
            won: row.won + (goalsFor > goalsAgainst ? 1 : 0),
            drawn: row.drawn + (goalsFor === goalsAgainst ? 1 : 0),
            lost: row.lost + (goalsFor < goalsAgainst ? 1 : 0),
            goalsFor: row.goalsFor + goalsFor,
            goalsAgainst: row.goalsAgainst + goalsAgainst,
            points:
              row.points +
              (goalsFor > goalsAgainst
                ? 3
                : goalsFor === goalsAgainst
                  ? 1
                  : 0),
          };
        });
      },
    );
    tables[group] = rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalsFor -
          b.goalsAgainst -
          (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        b.nation.strength - a.nation.strength ||
        a.nation.name.localeCompare(b.nation.name),
    );
  }
  return tables;
}

export function getWallChartRoundOf32(
  tables: Record<string, GroupTableRow[]>,
) {
  const automatic: QualifiedTeam[] = [];
  const thirds: QualifiedTeam[] = [];
  for (const [group, rows] of Object.entries(tables)) {
    if (!rows.every((row) => row.played === 3)) return [];
    automatic.push(
      { nation: rows[0].nation, group, position: 1, tableRow: rows[0] },
      { nation: rows[1].nation, group, position: 2, tableRow: rows[1] },
    );
    thirds.push({
      nation: rows[2].nation,
      group,
      position: 3,
      tableRow: rows[2],
    });
  }
  const bestThirds = thirds
    .sort(
      (a, b) =>
        b.tableRow.points - a.tableRow.points ||
        b.tableRow.goalsFor -
          b.tableRow.goalsAgainst -
          (a.tableRow.goalsFor - a.tableRow.goalsAgainst) ||
        b.tableRow.goalsFor - a.tableRow.goalsFor ||
        b.nation.strength - a.nation.strength,
    )
    .slice(0, 8);
  return buildOfficialRoundOf32(automatic, bestThirds);
}

export function buildManualKnockoutRounds(
  roundOf32: TournamentFixture[],
  scores: Record<string, ScoreValue>,
) {
  const rounds: TournamentRoundResults[] = [];
  let fixtures = roundOf32;
  while (fixtures.length) {
    const decorated = fixtures.map((fixture) => {
      const score = scores[fixture.id];
      const homeGoals = score?.home === "" ? 0 : Number(score?.home ?? 0);
      const awayGoals = score?.away === "" ? 0 : Number(score?.away ?? 0);
      const complete = Boolean(score && score.home !== "" && score.away !== "");
      return {
        ...fixture,
        homeGoals,
        awayGoals,
        winner:
          complete && homeGoals !== awayGoals
            ? homeGoals > awayGoals
              ? fixture.home
              : fixture.away
            : undefined,
      };
    });
    rounds.push({ round: fixtures[0].round as TournamentRoundResults["round"], fixtures: decorated });
    if (!decorated.every((fixture) => fixture.winner)) break;
    const next = createNextOfficialRound(rounds.at(-1)!);
    if (!next) break;
    fixtures = next.fixtures;
  }
  return rounds;
}
