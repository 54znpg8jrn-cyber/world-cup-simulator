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
  matchNumber: number;
  order: number;
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

type GroupScheduleSeed = [
  matchNumber: number,
  group: string,
  homeIndex: number,
  awayIndex: number,
];

export const officialGroupStageSchedule: GroupScheduleSeed[] = [
  [1, "A", 0, 1], [2, "A", 2, 3], [3, "B", 0, 1], [4, "D", 0, 1],
  [5, "B", 2, 3], [6, "C", 0, 1], [7, "C", 2, 3], [8, "D", 2, 3],
  [9, "E", 0, 1], [10, "F", 0, 1], [11, "E", 2, 3], [12, "F", 2, 3],
  [13, "H", 2, 3], [14, "H", 0, 1], [15, "G", 2, 3], [16, "G", 0, 1],
  [17, "I", 0, 1], [18, "I", 2, 3], [19, "J", 0, 1], [20, "J", 2, 3],
  [21, "L", 2, 3], [22, "L", 0, 1], [23, "K", 0, 1], [24, "K", 2, 3],
  [25, "A", 3, 1], [26, "B", 3, 1], [27, "B", 0, 2], [28, "A", 0, 2],
  [29, "C", 0, 2], [30, "C", 3, 1], [31, "D", 3, 1], [32, "D", 0, 2],
  [33, "E", 0, 2], [34, "E", 3, 1], [35, "F", 0, 2], [36, "F", 3, 1],
  [37, "H", 3, 1], [38, "H", 0, 2], [39, "G", 0, 2], [40, "G", 3, 1],
  [41, "I", 3, 1], [42, "I", 0, 2], [43, "J", 0, 2], [44, "J", 3, 1],
  [45, "L", 0, 2], [46, "L", 3, 1], [47, "K", 0, 2], [48, "K", 3, 1],
  [49, "C", 3, 0], [50, "C", 1, 2], [51, "B", 3, 0], [52, "B", 1, 2],
  [53, "A", 3, 0], [54, "A", 1, 2], [55, "E", 1, 2], [56, "E", 3, 0],
  [57, "F", 1, 2], [58, "F", 3, 0], [59, "D", 3, 0], [60, "D", 1, 2],
  [61, "I", 3, 0], [62, "I", 1, 2], [63, "G", 1, 2], [64, "G", 3, 0],
  [65, "H", 1, 2], [66, "H", 3, 0], [67, "L", 3, 0], [68, "L", 1, 2],
  [69, "J", 1, 2], [70, "J", 3, 0], [71, "K", 3, 0], [72, "K", 1, 2],
];

export const WALL_CHART_FIXTURES: WallChartFixture[] =
  officialGroupStageSchedule.map(([matchNumber, group, homeIndex, awayIndex]) => {
    const nations = WORLD_CUP_GROUPS[group];
    const lowIndex = Math.min(homeIndex, awayIndex);
    const highIndex = Math.max(homeIndex, awayIndex);
    return {
      id: `group-${group}-${lowIndex}-${highIndex}`,
      matchNumber,
      order: matchNumber,
      group,
      home: nations[homeIndex],
      away: nations[awayIndex],
    };
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
