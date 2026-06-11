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

function fakeOpponentName() {
  const firstNames = ["Mateo", "Luca", "Amadou", "Kenji", "Noah", "Sami", "Rafael", "Daniel"];
  const lastNames = ["Silva", "Diallo", "Kim", "Garcia", "Muller", "Tanaka", "Mensah", "Costa"];
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function substitutionMinutes(count: number) {
  const minutes = new Set<number>();
  while (minutes.size < count) {
    const roll = Math.random();
    const minute =
      roll < 0.08
        ? 18 + Math.floor(Math.random() * 25)
        : roll < 0.2
          ? 46
          : 55 + Math.floor(Math.random() * 31);
    minutes.add(minute);
  }
  return [...minutes].sort((a, b) => a - b);
}

function createSubstitutionEvents(
  squad: Player[],
  starters: Player[],
  forUser: boolean,
) {
  const count = 3 + Math.floor(Math.random() * 3);
  const active = [...starters];
  const bench = squad.filter(
    (player) => !active.some((starter) => starter.id === player.id),
  );

  return substitutionMinutes(count).flatMap((minute) => {
    const replaceable = active.filter((player) => player.position !== "GK");
    const outgoing = randomItem(replaceable.length ? replaceable : active);
    const samePosition = bench.filter(
      (player) => player.position === outgoing.position,
    );
    const incoming = randomItem(samePosition.length ? samePosition : bench);
    if (!outgoing || !incoming) return [];

    active.splice(active.indexOf(outgoing), 1, incoming);
    bench.splice(bench.indexOf(incoming), 1);
    bench.push(outgoing);

    return {
      minute,
      text: `Substitution ${minute}': ${incoming.name} replaces ${outgoing.name}`,
      isGoal: false,
      forUser,
      phase: "substitution" as const,
    };
  });
}

function substitutionMomentum(starters: Player[], squad: Player[]) {
  const starterIds = new Set(starters.map((player) => player.id));
  const bench = squad
    .filter((player) => !starterIds.has(player.id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  if (!bench.length) return 0;
  const average =
    bench.reduce((sum, player) => sum + player.rating, 0) / bench.length;
  return Math.max(-1.5, Math.min(1.5, (average - 72) / 8));
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
];

const missedOutcomes = [
  "Saved! The goalkeeper gets down brilliantly.",
  "Missed! It flashes wide.",
  "Off the post! Inches away.",
  "Offside! The flag cuts the celebration short.",
  "Blocked! A defender throws everything at it.",
];

export function createMatch(
  round: TournamentRound,
  opponent: Nation,
  xi: Player[],
  teamRating: number,
  form: TournamentForm = {},
): SimMatch {
  const userSquad = getPlayersByNation(xi[0]?.nation ?? "");
  const opponentSquad = getPlayersByNation(opponent.name);
  const opponentStarters = [...opponentSquad]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 11);
  const userMomentum = substitutionMomentum(xi, userSquad);
  const opponentMomentum = substitutionMomentum(
    opponentStarters,
    opponentSquad,
  );
  const userNation = NATIONS.find((nation) => nation.name === xi[0]?.nation);
  const userStrength = userNation
    ? getNationStrength(userNation, form, teamRating)
    : teamRating;
  const opponentStrength = getNationStrength(opponent, form);
  let userGoals = scoreGoals(
    userStrength + userMomentum,
    opponentStrength + opponentMomentum,
  );
  let opponentGoals = scoreGoals(
    opponentStrength + opponentMomentum,
    userStrength + userMomentum,
  );

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

  const scorerPool = xi.filter((player) => player.position === "FW");
  const assistPool = xi.filter((player) => player.position !== "GK");
  const outcomes: Array<{
    minute: number;
    isGoal: boolean;
    forUser: boolean;
    scorer?: string;
    text: string;
  }> = [];
  const usedMinutes = new Set<number>();
  const nextMinute = () => {
    let minute = 7 + Math.floor(Math.random() * 84);
    while (usedMinutes.has(minute)) minute = 7 + Math.floor(Math.random() * 84);
    usedMinutes.add(minute);
    return minute;
  };

  for (let index = 0; index < userGoals; index += 1) {
    const scorer = randomItem(scorerPool.length ? scorerPool : assistPool);
    const possibleAssists = assistPool.filter((player) => player.id !== scorer.id);
    const assist = randomItem(possibleAssists);
    const minute = nextMinute();
    outcomes.push({
      minute,
      isGoal: true,
      forUser: true,
      scorer: scorer.name,
      text: `GOAL! ${scorer.name} ${minute}' (Assist: ${assist.name})`,
    });
  }

  for (let index = 0; index < opponentGoals; index += 1) {
    const scorer = fakeOpponentName();
    const minute = nextMinute();
    outcomes.push({
      minute,
      isGoal: true,
      forUser: false,
      text: `GOAL! ${scorer} ${minute}' (Assist: ${fakeOpponentName()})`,
    });
  }

  const misses = 4 + Math.floor(Math.random() * 4);
  for (let index = 0; index < misses; index += 1) {
    const minute = nextMinute();
    const forUser = Math.random() > 0.4;
    const player = forUser ? randomItem(assistPool) : null;
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
    },
    ];
  });

  const userSubstitutionEvents = createSubstitutionEvents(
    userSquad,
    xi,
    true,
  );
  const opponentSubstitutionEvents = createSubstitutionEvents(
    opponentSquad,
    opponentStarters,
    false,
  );
  events.push(...userSubstitutionEvents, ...opponentSubstitutionEvents);
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
    userSubstitutions: userSubstitutionEvents.length,
    opponentSubstitutions: opponentSubstitutionEvents.length,
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
) {
  const otherTeams = table
    .map((row) => row.nation)
    .filter(
      (nation) =>
        nation.code !== selectedNation.code && nation.code !== opponent.code,
    );
  const otherHomeGoals = Math.floor(Math.random() * 4);
  const otherAwayGoals = Math.floor(Math.random() * 4);

  return table
    .map((row) => {
      if (row.nation.code === selectedNation.code) {
        return applyResult(row, userGoals, opponentGoals);
      }
      if (row.nation.code === opponent.code) {
        return applyResult(row, opponentGoals, userGoals);
      }
      if (row.nation.code === otherTeams[0]?.code) {
        return applyResult(row, otherHomeGoals, otherAwayGoals);
      }
      if (row.nation.code === otherTeams[1]?.code) {
        return applyResult(row, otherAwayGoals, otherHomeGoals);
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
