import { getPlayersByNation } from "../../data/players";
import { NATIONS, WORLD_CUP_GROUPS } from "../data/groups";
import type {
  Nation,
  OfficialGroupStage,
  GroupTableRow,
  QualifiedTeam,
  TournamentAwards,
  TournamentFixture,
  TournamentRound,
  TournamentRoundResults,
} from "./types";
import {
  getNationStrength,
  type TournamentForm,
} from "./nation-strength";

const knockoutRounds: Array<Exclude<TournamentRound, "Group Stage">> = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

function randomScore() {
  let goals = 0;
  for (let chance = 0; chance < 5; chance += 1) {
    if (Math.random() < 0.27) goals += 1;
  }
  return goals;
}

function emptyRow(nation: Nation): GroupTableRow {
  return {
    nation,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function applyGroupResult(
  row: GroupTableRow,
  goalsFor: number,
  goalsAgainst: number,
) {
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
      (goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0),
  };
}

function rankRows(rows: GroupTableRow[], form: TournamentForm) {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor -
        b.goalsAgainst -
        (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      getNationStrength(b.nation, form) -
        getNationStrength(a.nation, form) ||
      Math.random() - 0.5,
  );
}

function quickFixture(
  id: string,
  round: TournamentRound,
  home: Nation,
  away: Nation,
  form: TournamentForm = {},
): TournamentFixture {
  const homeStrength = getNationStrength(home, form);
  const awayStrength = getNationStrength(away, form);
  let homeGoals = randomScore() + (Math.random() < Math.max(0, homeStrength - awayStrength) / 35 ? 1 : 0);
  let awayGoals = randomScore() + (Math.random() < Math.max(0, awayStrength - homeStrength) / 35 ? 1 : 0);
  if (Math.abs(homeStrength - awayStrength) > 7 && Math.random() < 0.1) {
    if (homeStrength < awayStrength) homeGoals += 1;
    else awayGoals += 1;
  }
  if (round !== "Group Stage" && homeGoals === awayGoals) {
    if (Math.random() < homeStrength / (homeStrength + awayStrength)) homeGoals += 1;
    else awayGoals += 1;
  }
  const winner =
    homeGoals === awayGoals ? undefined : homeGoals > awayGoals ? home : away;
  return {
    id,
    round,
    home,
    away,
    homeGoals,
    awayGoals,
    winner,
    isUpset: Boolean(
      winner &&
        getNationStrength(winner, form) + 4 <
          getNationStrength(winner.code === home.code ? away : home, form),
    ),
  };
}

export function createBackgroundGroupResults(
  selectedNation: Nation,
  form: TournamentForm = {},
) {
  return Object.entries(WORLD_CUP_GROUPS).flatMap(([groupName, nations]) => {
    const fixtures: TournamentFixture[] = [];
    for (let home = 0; home < nations.length; home += 1) {
      for (let away = home + 1; away < nations.length; away += 1) {
        if (
          nations[home].code === selectedNation.code ||
          nations[away].code === selectedNation.code
        ) {
          continue;
        }
        fixtures.push(
          quickFixture(
            `group-${groupName}-${home}-${away}`,
            "Group Stage",
            nations[home],
            nations[away],
            form,
          ),
        );
      }
    }
    return fixtures;
  });
}

const thirdPlaceSlotGroups: Record<number, string[]> = {
  74: ["A", "B", "C", "D", "F"],
  77: ["C", "D", "F", "G", "H"],
  79: ["C", "E", "F", "H", "I"],
  80: ["E", "H", "I", "J", "K"],
  81: ["B", "E", "F", "I", "J"],
  82: ["A", "E", "H", "I", "J"],
  85: ["E", "F", "G", "I", "J"],
  87: ["D", "E", "I", "J", "L"],
};

export function resolveThirdPlaceSlots(
  thirdPlacedTeams: QualifiedTeam[],
  form: TournamentForm = {},
) {
  const slots = Object.keys(thirdPlaceSlotGroups).map(Number);
  const assignments = new Map<number, QualifiedTeam>();
  const usedGroups = new Set<string>();

  const search = (remainingSlots: number[]): boolean => {
    if (!remainingSlots.length) return true;
    const slot = [...remainingSlots].sort((a, b) => {
      const candidatesFor = (matchNumber: number) =>
        thirdPlacedTeams.filter(
          (team) =>
            !usedGroups.has(team.group) &&
            thirdPlaceSlotGroups[matchNumber].includes(team.group),
        ).length;
      return candidatesFor(a) - candidatesFor(b);
    })[0];
    const candidates = thirdPlacedTeams
      .filter(
        (team) =>
          !usedGroups.has(team.group) &&
          thirdPlaceSlotGroups[slot].includes(team.group),
      )
      .sort(
        (a, b) =>
          getNationStrength(b.nation, form) -
          getNationStrength(a.nation, form),
      );

    for (const candidate of candidates) {
      assignments.set(slot, candidate);
      usedGroups.add(candidate.group);
      if (search(remainingSlots.filter((item) => item !== slot))) return true;
      assignments.delete(slot);
      usedGroups.delete(candidate.group);
    }
    return false;
  };

  search(slots);

  for (const slot of slots) {
    if (assignments.has(slot)) continue;
    const fallback = thirdPlacedTeams.find(
      (team) =>
        !usedGroups.has(team.group) &&
        thirdPlaceSlotGroups[slot].includes(team.group),
    );
    if (fallback) {
      assignments.set(slot, fallback);
      usedGroups.add(fallback.group);
    }
  }
  return assignments;
}

export function createOfficialGroupStage(
  selectedNation: Nation,
  userResults: TournamentFixture[],
  form: TournamentForm = {},
): OfficialGroupStage {
  const tables: Record<string, GroupTableRow[]> = {};
  const userResultByOpponent = new Map(
    userResults.map((fixture) => [
      fixture.home.code === selectedNation.code
        ? fixture.away.code
        : fixture.home.code,
      fixture,
    ]),
  );

  for (const [group, nations] of Object.entries(WORLD_CUP_GROUPS)) {
    let rows = nations.map(emptyRow);
    for (let homeIndex = 0; homeIndex < nations.length; homeIndex += 1) {
      for (
        let awayIndex = homeIndex + 1;
        awayIndex < nations.length;
        awayIndex += 1
      ) {
        const home = nations[homeIndex];
        const away = nations[awayIndex];
        const userFixture =
          home.code === selectedNation.code
            ? userResultByOpponent.get(away.code)
            : away.code === selectedNation.code
              ? userResultByOpponent.get(home.code)
              : undefined;
        const fixture =
          userFixture ??
          quickFixture(
            `group-${group}-${home.code}-${away.code}`,
            "Group Stage",
            home,
            away,
            form,
          );
        const homeGoals =
          fixture.home.code === home.code
            ? fixture.homeGoals
            : fixture.awayGoals;
        const awayGoals =
          fixture.away.code === away.code
            ? fixture.awayGoals
            : fixture.homeGoals;
        rows = rows.map((row) => {
          if (row.nation.code === home.code) {
            return applyGroupResult(row, homeGoals, awayGoals);
          }
          if (row.nation.code === away.code) {
            return applyGroupResult(row, awayGoals, homeGoals);
          }
          return row;
        });
      }
    }
    tables[group] = rankRows(rows, form);
  }

  const automaticQualifiers: QualifiedTeam[] = [];
  const thirdPlaced: QualifiedTeam[] = [];
  for (const [group, rows] of Object.entries(tables)) {
    automaticQualifiers.push(
      { nation: rows[0].nation, group, position: 1, tableRow: rows[0] },
      { nation: rows[1].nation, group, position: 2, tableRow: rows[1] },
    );
    thirdPlaced.push({
      nation: rows[2].nation,
      group,
      position: 3,
      tableRow: rows[2],
    });
  }
  const bestThirdPlaced = [...thirdPlaced]
    .sort(
      (a, b) =>
        b.tableRow.points - a.tableRow.points ||
        b.tableRow.goalsFor -
          b.tableRow.goalsAgainst -
          (a.tableRow.goalsFor - a.tableRow.goalsAgainst) ||
        b.tableRow.goalsFor - a.tableRow.goalsFor ||
        getNationStrength(b.nation, form) -
          getNationStrength(a.nation, form) ||
        Math.random() - 0.5,
    )
    .slice(0, 8);
  const qualifiers = [...automaticQualifiers, ...bestThirdPlaced];
  const thirdSlots = resolveThirdPlaceSlots(bestThirdPlaced, form);
  const byGroupPosition = (group: string, position: 1 | 2) =>
    automaticQualifiers.find(
      (team) => team.group === group && team.position === position,
    )!.nation;
  const third = (matchNumber: number) =>
    thirdSlots.get(matchNumber)!.nation;
  const slotTeams: Array<[number, Nation, Nation]> = [
    [73, byGroupPosition("A", 2), byGroupPosition("B", 2)],
    [74, byGroupPosition("E", 1), third(74)],
    [75, byGroupPosition("F", 1), byGroupPosition("C", 2)],
    [76, byGroupPosition("C", 1), byGroupPosition("F", 2)],
    [77, byGroupPosition("I", 1), third(77)],
    [78, byGroupPosition("E", 2), byGroupPosition("I", 2)],
    [79, byGroupPosition("A", 1), third(79)],
    [80, byGroupPosition("L", 1), third(80)],
    [81, byGroupPosition("D", 1), third(81)],
    [82, byGroupPosition("G", 1), third(82)],
    [83, byGroupPosition("K", 2), byGroupPosition("L", 2)],
    [84, byGroupPosition("H", 1), byGroupPosition("J", 2)],
    [85, byGroupPosition("B", 1), third(85)],
    [86, byGroupPosition("J", 1), byGroupPosition("H", 2)],
    [87, byGroupPosition("K", 1), third(87)],
    [88, byGroupPosition("D", 2), byGroupPosition("G", 2)],
  ];
  const roundOf32 = slotTeams.map(([matchNumber, home, away]) => ({
    id: `match-${matchNumber}`,
    matchNumber,
    round: "Round of 32" as const,
    home,
    away,
    homeGoals: 0,
    awayGoals: 0,
  }));

  return { tables, qualifiers, bestThirdPlaced, roundOf32 };
}

export function simulateKnockoutFixtures(
  round: Exclude<TournamentRound, "Group Stage">,
  fixtures: TournamentFixture[],
  selectedNation: Nation,
  userOpponent: Nation,
  userGoals: number,
  opponentGoals: number,
  form: TournamentForm = {},
): TournamentRoundResults {
  return {
    round,
    fixtures: fixtures.map((fixture) => {
      const isUserFixture =
        fixture.home.code === selectedNation.code ||
        fixture.away.code === selectedNation.code;
      if (!isUserFixture) {
        return {
          ...quickFixture(
            fixture.id,
            round,
            fixture.home,
            fixture.away,
            form,
          ),
          matchNumber: fixture.matchNumber,
        };
      }
      const userIsHome = fixture.home.code === selectedNation.code;
      const homeGoals = userIsHome ? userGoals : opponentGoals;
      const awayGoals = userIsHome ? opponentGoals : userGoals;
      return {
        ...fixture,
        homeGoals,
        awayGoals,
        winner: homeGoals > awayGoals ? fixture.home : fixture.away,
        isUserMatch: true,
        isUpset:
          getNationStrength(
            homeGoals > awayGoals ? fixture.home : fixture.away,
            form,
          ) +
            4 <
          getNationStrength(
            homeGoals > awayGoals ? fixture.away : fixture.home,
            form,
          ),
      };
    }),
  };
}

export function createKnockoutRoundResults(
  round: Exclude<TournamentRound, "Group Stage">,
  selectedNation: Nation,
  opponent: Nation,
  userGoals: number,
  opponentGoals: number,
  form: TournamentForm = {},
): TournamentRoundResults {
  const fixtureCount = {
    "Round of 32": 16,
    "Round of 16": 8,
    "Quarter-final": 4,
    "Semi-final": 2,
    Final: 1,
  }[round];
  const userFixture: TournamentFixture = {
    id: `${round}-user`,
    round,
    home: selectedNation,
    away: opponent,
    homeGoals: userGoals,
    awayGoals: opponentGoals,
    winner: userGoals > opponentGoals ? selectedNation : opponent,
    isUserMatch: true,
    isUpset:
      getNationStrength(
        userGoals > opponentGoals ? selectedNation : opponent,
        form,
      ) +
        4 <
      getNationStrength(
        userGoals > opponentGoals ? opponent : selectedNation,
        form,
      ),
  };
  const pool = NATIONS.filter(
    (nation) =>
      nation.code !== selectedNation.code && nation.code !== opponent.code,
  ).sort(() => Math.random() - 0.5);
  const fixtures = [userFixture];
  for (let index = 0; fixtures.length < fixtureCount; index += 2) {
    fixtures.push(
      quickFixture(
        `${round}-${fixtures.length}`,
        round,
        pool[index % pool.length],
        pool[(index + 1) % pool.length],
        form,
      ),
    );
  }
  return { round, fixtures };
}

function starFor(nation: Nation, positions?: string[]) {
  const squad = getPlayersByNation(nation.name).filter(
    (player) => !positions || positions.includes(player.position),
  );
  return [...squad].sort((a, b) => b.rating - a.rating)[0];
}

export function createTournamentAwards(
  rounds: TournamentRoundResults[],
  selectedNation: Nation,
  scorers: Record<string, number>,
): TournamentAwards {
  const final = rounds.find((round) => round.round === "Final")?.fixtures[0];
  const fallbackWinner = [...NATIONS].sort((a, b) => b.strength - a.strength)[0];
  const winner = final?.winner ?? fallbackWinner;
  const runnerUp = final
    ? final.winner?.code === final.home.code
      ? final.away
      : final.home
    : [...NATIONS].sort((a, b) => b.strength - a.strength)[1];
  const globalStars = NATIONS.map((nation) => ({
    nation,
    player: starFor(nation),
  }))
    .filter((entry) => entry.player)
    .sort((a, b) => b.player.rating - a.player.rating);
  const selectedTopScorer = Object.entries(scorers).sort((a, b) => b[1] - a[1])[0];
  const goldenBootStar = selectedTopScorer
    ? { name: selectedTopScorer[0], nation: selectedNation.name, goals: Math.max(5, selectedTopScorer[1]) }
    : { name: globalStars[0].player.name, nation: globalStars[0].nation.name, goals: 7 };
  const bestKeeper = starFor(winner, ["GK"]) ?? starFor(runnerUp, ["GK"]);
  const youngPool = globalStars.filter((entry) => entry.player.caps < 35);

  return {
    winner,
    runnerUp,
    finalScore: final ? `${final.homeGoals}-${final.awayGoals}` : "2-1",
    goldenBoot: goldenBootStar,
    playerOfTournament: {
      name: starFor(winner)?.name ?? globalStars[0].player.name,
      nation: winner.name,
    },
    bestGoalkeeper: {
      name: bestKeeper?.name ?? "Tournament goalkeeper",
      nation: winner.name,
    },
    bestYoungPlayer: {
      name: youngPool[0]?.player.name ?? globalStars[1].player.name,
      nation: youngPool[0]?.nation.name ?? globalStars[1].nation.name,
    },
  };
}

export function ensureCompleteBracket(
  currentRounds: TournamentRoundResults[],
  selectedNation: Nation,
) {
  const rounds = [...currentRounds];
  let featured = selectedNation;
  for (const round of knockoutRounds) {
    if (rounds.some((item) => item.round === round)) {
      featured =
        rounds.find((item) => item.round === round)?.fixtures[0]?.winner ?? featured;
      continue;
    }
    const opponent =
      NATIONS.find(
        (nation) =>
          nation.code !== featured.code &&
          !rounds.some((item) =>
            item.fixtures.some(
              (fixture) =>
                fixture.home.code === nation.code || fixture.away.code === nation.code,
            ),
          ),
      ) ?? NATIONS.find((nation) => nation.code !== featured.code)!;
    const featuredGoals = randomScore();
    const opponentGoals = featuredGoals === 0 ? 1 : Math.max(0, featuredGoals - 1);
    const generated = createKnockoutRoundResults(
      round,
      featured,
      opponent,
      featuredGoals,
      opponentGoals,
    );
    rounds.push(generated);
    featured = generated.fixtures[0].winner ?? featured;
  }
  return rounds;
}
