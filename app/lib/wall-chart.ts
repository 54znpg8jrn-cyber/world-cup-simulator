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
