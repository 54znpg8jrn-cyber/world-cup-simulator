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

export function buildOfficialRoundOf32(
  automaticQualifiers: QualifiedTeam[],
  bestThirdPlaced: QualifiedTeam[],
  form: TournamentForm = {},
) {
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
  return slotTeams.map(([matchNumber, home, away]) => ({
    id: `match-${matchNumber}`,
    matchNumber,
    round: "Round of 32" as const,
    home,
    away,
    homeGoals: 0,
    awayGoals: 0,
  }));
}

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
  backgroundResults: TournamentFixture[],
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
  const fixtureKey = (homeCode: string, awayCode: string) =>
    [homeCode, awayCode].sort().join("-");
  const backgroundResultByTeams = new Map(
    backgroundResults.map((fixture) => [
      fixtureKey(fixture.home.code, fixture.away.code),
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
          backgroundResultByTeams.get(fixtureKey(home.code, away.code)) ??
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
  const roundOf32 = buildOfficialRoundOf32(
    automaticQualifiers,
    bestThirdPlaced,
    form,
  );

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

const officialProgression: Record<
  Exclude<TournamentRound, "Group Stage" | "Round of 32" | "Final">,
  Array<[number, number, number]>
> = {
  "Round of 16": [
    [89, 73, 75],
    [90, 74, 77],
    [91, 76, 78],
    [92, 79, 80],
    [93, 83, 84],
    [94, 81, 82],
    [95, 86, 88],
    [96, 85, 87],
  ],
  "Quarter-final": [
    [97, 89, 90],
    [98, 93, 94],
    [99, 91, 92],
    [100, 95, 96],
  ],
  "Semi-final": [
    [101, 97, 98],
    [102, 99, 100],
  ],
};

export function createNextOfficialRound(
  previousRound: TournamentRoundResults,
): {
  round: Exclude<TournamentRound, "Group Stage" | "Round of 32">;
  fixtures: TournamentFixture[];
} | null {
  const nextRound = {
    "Round of 32": "Round of 16",
    "Round of 16": "Quarter-final",
    "Quarter-final": "Semi-final",
    "Semi-final": "Final",
    Final: null,
  }[previousRound.round] as
    | Exclude<TournamentRound, "Group Stage" | "Round of 32">
    | null;
  if (!nextRound) return null;
  const winnerOf = (matchNumber: number) =>
    previousRound.fixtures.find(
      (fixture) => fixture.matchNumber === matchNumber,
    )?.winner;

  if (nextRound === "Final") {
    const home = winnerOf(101);
    const away = winnerOf(102);
    if (!home || !away) return null;
    return {
      round: "Final",
      fixtures: [
        {
          id: "match-104",
          matchNumber: 104,
          round: "Final",
          home,
          away,
          homeGoals: 0,
          awayGoals: 0,
        },
      ],
    };
  }

  const fixtures = officialProgression[nextRound].flatMap(
    ([matchNumber, homeSource, awaySource]) => {
      const home = winnerOf(homeSource);
      const away = winnerOf(awaySource);
      return home && away
        ? [
            {
              id: `match-${matchNumber}`,
              matchNumber,
              round: nextRound,
              home,
              away,
              homeGoals: 0,
              awayGoals: 0,
            },
          ]
        : [];
    },
  );
  return { round: nextRound, fixtures };
}

export function simulateAutomaticKnockoutRound(
  round: Exclude<TournamentRound, "Group Stage">,
  fixtures: TournamentFixture[],
  form: TournamentForm = {},
): TournamentRoundResults {
  return {
    round,
    fixtures: fixtures.map((fixture) => ({
      ...quickFixture(
        fixture.id,
        round,
        fixture.home,
        fixture.away,
        form,
      ),
      matchNumber: fixture.matchNumber,
    })),
  };
}

export function completeOfficialBracket(
  completedRounds: TournamentRoundResults[],
  form: TournamentForm = {},
) {
  const rounds = [...completedRounds];
  while (rounds.at(-1)?.round !== "Final") {
    const previousRound = rounds.at(-1);
    if (!previousRound) break;
    const next = createNextOfficialRound(previousRound);
    if (!next) break;
    rounds.push(
      simulateAutomaticKnockoutRound(next.round, next.fixtures, form),
    );
  }
  return rounds;
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
  const teamTotals = new Map<
    string,
    { nation: Nation; goals: number; against: number }
  >();
  rounds.flatMap((round) => round.fixtures).forEach((fixture) => {
    const home = teamTotals.get(fixture.home.code) ?? {
      nation: fixture.home,
      goals: 0,
      against: 0,
    };
    const away = teamTotals.get(fixture.away.code) ?? {
      nation: fixture.away,
      goals: 0,
      against: 0,
    };
    home.goals += fixture.homeGoals;
    home.against += fixture.awayGoals;
    away.goals += fixture.awayGoals;
    away.against += fixture.homeGoals;
    teamTotals.set(fixture.home.code, home);
    teamTotals.set(fixture.away.code, away);
  });
  const estimatedScorers = [...teamTotals.values()].map((team) => {
    const attackers = getPlayersByNation(team.nation.name)
      .filter(
        (player) => player.position === "FW" || player.position === "MF",
      )
      .sort(
        (a, b) =>
          (b.position === "FW" ? 4 : 0) +
          b.attack -
          ((a.position === "FW" ? 4 : 0) + a.attack),
      );
    return {
      name:
        attackers[0]?.name ??
        starFor(team.nation)?.name ??
        "Tournament scorer",
      nation: team.nation.name,
      goals: Math.max(1, Math.round(team.goals * 0.48)),
    };
  });
  const selectedTopScorer = Object.entries(scorers)
    .map(([name, goals]) => ({
      name,
      nation: selectedNation.name,
      goals,
    }))
    .sort((a, b) => b.goals - a.goals)[0];
  const goldenBootStar = [
    ...estimatedScorers,
    ...(selectedTopScorer ? [selectedTopScorer] : []),
  ].sort((a, b) => b.goals - a.goals)[0];
  const goalkeeperTeam = [winner, runnerUp].sort(
    (a, b) =>
      (teamTotals.get(a.code)?.against ?? 99) -
      (teamTotals.get(b.code)?.against ?? 99),
  )[0];
  const bestKeeper =
    starFor(goalkeeperTeam, ["GK"]) ?? starFor(winner, ["GK"]);
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
      nation: goalkeeperTeam.name,
    },
    bestYoungPlayer: {
      name: youngPool[0]?.player.name ?? globalStars[1].player.name,
      nation: youngPool[0]?.nation.name ?? globalStars[1].nation.name,
    },
  };
}
