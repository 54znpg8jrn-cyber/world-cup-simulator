import { NATIONS } from "../data/groups";
import { getPlayersByNation } from "../../data/players";
import {
  getNationStrength,
  type TournamentForm,
} from "./nation-strength";
import type {
  GroupTableRow,
  MatchEvent,
  Nation,
  Player,
  SimMatch,
  TournamentFixture,
  TournamentRound,
} from "./types";

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function scoreGoals(rating: number, opponentRating: number) {
  const edge = (rating - opponentRating) / 15;
  const expected = Math.max(0.35, Math.min(2.8, 1.25 + edge));
  let goals = 0;
  for (let chance = 0; chance < 5; chance += 1) {
    if (Math.random() < expected / 5) goals += 1;
  }
  if (rating + 5 < opponentRating && Math.random() < 0.12) goals += 1;
  return goals;
}

function weightedPlayerPick(players: Player[], weights: Record<Player["position"], number>) {
  const weighted = players.flatMap((player) =>
    Array.from({ length: weights[player.position] }, () => player),
  );
  return randomItem(weighted.length ? weighted : players);
}

export function getPlayersForNation(nation: Nation | string): Player[] {
  return getPlayersByNation(typeof nation === "string" ? nation : nation.name);
}

export function pickScorer(
  nation: Nation | string,
  teamLineupOrSquad?: Player[],
): Player {
  const players = teamLineupOrSquad?.length
    ? teamLineupOrSquad
    : getPlayersForNation(nation);
  return weightedPlayerPick(players, { GK: 1, DF: 2, MF: 6, FW: 10 });
}

export function pickAssist(
  nation: Nation | string,
  scorer: Player,
  teamLineupOrSquad?: Player[],
): Player | undefined {
  const players = (
    teamLineupOrSquad?.length ? teamLineupOrSquad : getPlayersForNation(nation)
  ).filter((player) => player.id !== scorer.id);
  if (!players.length) return undefined;
  return weightedPlayerPick(players, { GK: 1, DF: 3, MF: 10, FW: 7 });
}

const chanceTexts: Array<{
  kind: NonNullable<MatchEvent["kind"]>;
  text: string;
}> = [
  { kind: "chance", text: "Big chance..." },
  { kind: "penalty", text: "Penalty shout..." },
  { kind: "var", text: "VAR check..." },
  { kind: "free-kick", text: "Free kick in a dangerous area..." },
  { kind: "counter", text: "Counter attack..." },
  { kind: "late", text: "Last minute chance..." },
  { kind: "chance", text: "Corner coming in..." },
  { kind: "chance", text: "Long-range strike..." },
  { kind: "chance", text: "One-on-one with the keeper..." },
  { kind: "chance", text: "Scramble in the box..." },
  { kind: "chance", text: "Perfect through ball..." },
  { kind: "chance", text: "Cross into the danger area..." },
  { kind: "chance", text: "Keeper rushes out..." },
  { kind: "chance", text: "Defender slips..." },
  { kind: "late", text: "Huge chance in stoppage time..." },
];

const missedOutcomes = [
  "Saved! The goalkeeper gets down brilliantly.",
  "Missed! It flashes wide.",
  "Off the post! Inches away.",
  "Cleared off the line!",
  "Offside! The flag cuts the celebration short.",
  "What a save!",
  "Just wide!",
  "Blocked! A defender throws everything at it.",
  "Keeper beaten, but it hits the bar!",
  "VAR overturns it!",
];

const goalStyles = [
  "Tap-in from close range.",
  "Powerful header into the corner.",
  "Clean volley beyond the keeper.",
  "Penalty sent the wrong way.",
  "Free kick curled into the top corner.",
  "Long-range strike into the bottom corner.",
  "Solo run finished with ice-cold composure.",
  "Lightning counter attack.",
  "Goalkeeper mistake punished.",
];

const rareGoalStyles = [
  "BICYCLE KICK! An outrageous finish.",
  "FREE-KICK GOAL! Straight into the top corner.",
];

const dramaTexts = [
  "The stadium is getting nervous...",
  "One chance could decide this.",
  "The pressure is unreal.",
  "The next goal could change everything.",
];

export function createMatch(
  round: TournamentRound,
  opponent: Nation,
  xi: Player[],
  teamRating: number,
  form: TournamentForm = {},
): SimMatch {
  const userNation = NATIONS.find((nation) => nation.name === xi[0]?.nation);
  const userStrength = userNation
    ? getNationStrength(userNation, form, teamRating)
    : teamRating;
  const opponentStrength = getNationStrength(opponent, form);
  let userGoals = scoreGoals(userStrength, opponentStrength);
  let opponentGoals = scoreGoals(opponentStrength, userStrength);

  if (round !== "Group Stage" && userGoals === opponentGoals) {
    const favoriteChance = Math.max(
      0.28,
      Math.min(0.72, 0.5 + (userStrength - opponentStrength) / 40),
    );
    if (Math.random() < favoriteChance) {
      userGoals += 1;
    } else {
      opponentGoals += 1;
    }
  }

  const opponentSquad = getPlayersForNation(opponent);
  const userOutfield = xi.filter((player) => player.position !== "GK");
  const outcomes: Array<{
    minute: number;
    isGoal: boolean;
    forUser: boolean;
    scorer?: string;
    text: string;
    goalStyle?: string;
    special?: MatchEvent["special"];
  }> = [];
  const usedMinutes = new Set<number>();
  const nextMinute = () => {
    let minute = 7 + Math.floor(Math.random() * 84);
    while (usedMinutes.has(minute)) minute = 7 + Math.floor(Math.random() * 84);
    usedMinutes.add(minute);
    return minute;
  };

  for (let index = 0; index < userGoals; index += 1) {
    const scorer = pickScorer(userNation?.name ?? xi[0]?.nation ?? "", xi);
    const assist = pickAssist(
      userNation?.name ?? xi[0]?.nation ?? "",
      scorer,
      xi,
    );
    const minute = nextMinute();
    const rareStyle = Math.random() < 0.06 ? randomItem(rareGoalStyles) : null;
    const lateWinner = minute >= 85 && userGoals === opponentGoals + 1;
    const goalStyle = lateWinner
      ? "90+ winner! The stadium erupts."
      : rareStyle ?? randomItem(goalStyles);
    outcomes.push({
      minute,
      isGoal: true,
      forUser: true,
      scorer: scorer.name,
      text: `GOAL! ${scorer.name} ${minute}'${
        assist ? ` (Assist: ${assist.name})` : ""
      }\n${goalStyle}`,
      goalStyle,
      special: lateWinner
        ? "late-winner"
        : rareStyle?.startsWith("BICYCLE")
          ? "bicycle-kick"
          : rareStyle?.startsWith("FREE-KICK")
            ? "free-kick-goal"
            : undefined,
    });
  }

  for (let index = 0; index < opponentGoals; index += 1) {
    const scorer = pickScorer(opponent, opponentSquad);
    const assist = pickAssist(opponent, scorer, opponentSquad);
    const minute = nextMinute();
    const rareStyle = Math.random() < 0.05 ? randomItem(rareGoalStyles) : null;
    const lateWinner = minute >= 85 && opponentGoals === userGoals + 1;
    const goalStyle = lateWinner
      ? "Late winner! A devastating finish."
      : rareStyle ?? randomItem(goalStyles);
    outcomes.push({
      minute,
      isGoal: true,
      forUser: false,
      scorer: scorer.name,
      text: `GOAL! ${scorer.name} ${minute}'${
        assist ? ` (Assist: ${assist.name})` : ""
      }\n${goalStyle}`,
      goalStyle,
      special: lateWinner
        ? "late-winner"
        : rareStyle?.startsWith("BICYCLE")
          ? "bicycle-kick"
          : rareStyle?.startsWith("FREE-KICK")
            ? "free-kick-goal"
            : undefined,
    });
  }

  const misses = 4 + Math.floor(Math.random() * 4);
  for (let index = 0; index < misses; index += 1) {
    const minute = nextMinute();
    const forUser = Math.random() > 0.4;
    const player = forUser ? randomItem(userOutfield) : null;
    outcomes.push({
      minute,
      isGoal: false,
      forUser,
      text: player
        ? `${randomItem(missedOutcomes)} ${player.name} was involved.`
        : `${randomItem(missedOutcomes)} ${opponent.name} threaten.`,
    });
  }

  outcomes.sort((a, b) => a.minute - b.minute);
  const events: MatchEvent[] = outcomes.flatMap((outcome) => {
    const chance = randomItem(chanceTexts);
    return [
      {
      minute: outcome.minute,
      text: `${outcome.minute}' ${chance.text}`,
      isGoal: false,
      forUser: outcome.forUser,
      phase: "chance",
      kind: outcome.minute > 84 ? "late" : chance.kind,
    },
    {
      minute: outcome.minute,
      text: outcome.text,
      isGoal: outcome.isGoal,
      forUser: outcome.forUser,
      phase: "outcome",
      scorer: outcome.scorer,
      goalStyle: outcome.goalStyle,
      special: outcome.special,
    },
    ];
  });

  const lateScore = outcomes
    .filter((outcome) => outcome.isGoal && outcome.minute <= 75)
    .reduce(
      (score, outcome) => {
        if (outcome.forUser) score.user += 1;
        else score.opponent += 1;
        return score;
      },
      { user: 0, opponent: 0 },
    );
  if (Math.abs(lateScore.user - lateScore.opponent) <= 1) {
    events.push({
      minute: 78,
      text:
        round !== "Group Stage" && lateScore.user === lateScore.opponent
          ? "Extra time is looming... Penalties are getting closer."
          : randomItem(dramaTexts),
      isGoal: false,
      forUser: true,
      phase: "chance",
      kind: "late",
    });
  }

  events.sort(
    (a, b) =>
      a.minute - b.minute ||
      (a.phase === "chance" ? -1 : b.phase === "chance" ? 1 : 0),
  );

  return {
    round,
    opponent,
    userGoals,
    opponentGoals,
    events,
  };
}


export function getLiveScore(match: SimMatch, revealedEvents: number) {
  return match.events.slice(0, revealedEvents).reduce(
    (score, event) => {
      if (event.isGoal) {
        if (event.forUser) score.user += 1;
        else score.opponent += 1;
      }
      return score;
    },
    { user: 0, opponent: 0 },
  );
}

export function createGroupTable(group: Nation[]): GroupTableRow[] {
  return group.map((nation) => ({
    nation,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

export interface GroupMatchdayFixtures {
  userFixture: [Nation, Nation];
  otherFixture: [Nation, Nation];
}

export function getGroupMatchdayFixtures(
  groupTeams: Nation[],
  selectedNation: Nation,
  matchdayIndex: number,
): GroupMatchdayFixtures {
  if (groupTeams.length !== 4) {
    throw new Error("Group matchdays require exactly four teams.");
  }

  const matchdays: Array<Array<[Nation, Nation]>> = [
    [
      [groupTeams[0], groupTeams[1]],
      [groupTeams[2], groupTeams[3]],
    ],
    [
      [groupTeams[0], groupTeams[2]],
      [groupTeams[1], groupTeams[3]],
    ],
    [
      [groupTeams[0], groupTeams[3]],
      [groupTeams[1], groupTeams[2]],
    ],
  ];
  const fixtures = matchdays[matchdayIndex];
  if (!fixtures) {
    throw new Error(`Invalid group matchday index: ${matchdayIndex}`);
  }

  const userFixture = fixtures.find(([home, away]) =>
    [home.code, away.code].includes(selectedNation.code),
  );
  const otherFixture = fixtures.find(([home, away]) =>
    ![home.code, away.code].includes(selectedNation.code),
  );
  if (!userFixture || !otherFixture) {
    throw new Error(`Selected nation ${selectedNation.code} is not in the group.`);
  }

  return { userFixture, otherFixture };
}

function applyResult(row: GroupTableRow, goalsFor: number, goalsAgainst: number) {
  return {
    ...row,
    played: row.played + 1,
    won: row.won + (goalsFor > goalsAgainst ? 1 : 0),
    drawn: row.drawn + (goalsFor === goalsAgainst ? 1 : 0),
    lost: row.lost + (goalsFor < goalsAgainst ? 1 : 0),
    goalsFor: row.goalsFor + goalsFor,
    goalsAgainst: row.goalsAgainst + goalsAgainst,
    points: row.points + (goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0),
  };
}

export function updateGroupTable(
  table: GroupTableRow[],
  selectedNation: Nation,
  opponent: Nation,
  userGoals: number,
  opponentGoals: number,
  otherFixture: TournamentFixture,
) {
  return table
    .map((row) => {
      if (row.nation.code === selectedNation.code) {
        return applyResult(row, userGoals, opponentGoals);
      }
      if (row.nation.code === opponent.code) {
        return applyResult(row, opponentGoals, userGoals);
      }
      if (row.nation.code === otherFixture.home.code) {
        return applyResult(
          row,
          otherFixture.homeGoals,
          otherFixture.awayGoals,
        );
      }
      if (row.nation.code === otherFixture.away.code) {
        return applyResult(
          row,
          otherFixture.awayGoals,
          otherFixture.homeGoals,
        );
      }
      return row;
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor,
    );
}
