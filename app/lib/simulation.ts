import { NATIONS } from "../data/groups";
import type {
  GroupTableRow,
  MatchEvent,
  Nation,
  Player,
  SimMatch,
  TournamentRound,
} from "./types";

export const KNOCKOUT_ROUNDS: Array<Exclude<TournamentRound, "Group Stage">> = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

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
  return goals;
}

function fakeOpponentName() {
  const firstNames = ["Mateo", "Luca", "Amadou", "Kenji", "Noah", "Sami", "Rafael", "Daniel"];
  const lastNames = ["Silva", "Diallo", "Kim", "Garcia", "Muller", "Tanaka", "Mensah", "Costa"];
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
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
): SimMatch {
  let userGoals = scoreGoals(teamRating, opponent.strength);
  let opponentGoals = scoreGoals(opponent.strength, teamRating);

  if (round !== "Group Stage" && userGoals === opponentGoals) {
    if (Math.random() < 0.5 + (teamRating - opponent.strength) / 40) {
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

  return { round, opponent, userGoals, opponentGoals, events };
}

export function adjustMatchForSubstitution(
  match: SimMatch,
  revealedEvents: number,
  outgoing: Player,
  incoming: Player,
) {
  const ratingDelta = incoming.rating - outgoing.rating;
  if (ratingDelta === 0 || Math.random() > Math.min(0.55, 0.2 + Math.abs(ratingDelta) / 20)) {
    return match;
  }

  const events = [...match.events];
  if (ratingDelta > 0) {
    const outcomeIndex = events.findIndex(
      (event, index) =>
        index >= revealedEvents &&
        event.phase === "outcome" &&
        event.forUser &&
        !event.isGoal,
    );
    if (outcomeIndex >= 0) {
      const minute = events[outcomeIndex].minute;
      events[outcomeIndex] = {
        ...events[outcomeIndex],
        isGoal: true,
        scorer: incoming.name,
        text: `GOAL! ${incoming.name} ${minute}' Fresh legs make the difference!`,
      };
      return { ...match, events, userGoals: match.userGoals + 1 };
    }
  }

  if (ratingDelta < 0) {
    const outcomeIndex = events.findIndex(
      (event, index) =>
        index >= revealedEvents &&
        event.phase === "outcome" &&
        event.forUser &&
        event.isGoal,
    );
    if (outcomeIndex >= 0) {
      events[outcomeIndex] = {
        ...events[outcomeIndex],
        isGoal: false,
        scorer: undefined,
        text: "Saved! The chance is smothered at the last second.",
      };
      return { ...match, events, userGoals: Math.max(0, match.userGoals - 1) };
    }
  }

  return match;
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

// Placeholder bracket hook. The group stage is exact; this keeps knockout
// opponent selection isolated until the full third-place mapping is added.
export function getKnockoutOpponent(
  selectedNation: Nation,
  previousOpponents: Nation[],
) {
  const excluded = new Set([
    selectedNation.code,
    ...previousOpponents.map((nation) => nation.code),
  ]);
  const available = NATIONS.filter((nation) => !excluded.has(nation.code));
  return randomItem(available.length ? available : NATIONS);
}
