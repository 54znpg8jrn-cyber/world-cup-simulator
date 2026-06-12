import type {
  Nation,
  TournamentAwards,
  TournamentFixture,
  TournamentRoundResults,
  TournamentStats,
} from "./types";

export interface WorldCupScoreInput {
  finish: string;
  stats: TournamentStats;
  awards: TournamentAwards | null;
  topScorerName?: string;
  mvpName?: string;
  defeatedOpponents: Nation[];
}

export interface WorldCupScoreResult {
  score: number;
  title: string;
  rarity?: string;
}

const SHARE_URL = "https://world-cup-simulator-xi.vercel.app";

export function getShareUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return SHARE_URL;
}

function finishBase(finish: string): number {
  if (finish === "World Cup Winners") return 68;
  if (finish === "World Cup Runner-up") return 56;
  if (finish.includes("Semi-final")) return 48;
  if (finish.includes("Quarter-final")) return 40;
  if (finish.includes("Round of 16")) return 32;
  if (finish.includes("Round of 32")) return 24;
  if (finish.includes("Group")) return 18;
  return 20;
}

function parseEliminationRound(finish: string): number {
  if (finish === "World Cup Winners") return 7;
  if (finish === "World Cup Runner-up") return 6;
  if (finish.includes("Semi-final")) return 5;
  if (finish.includes("Quarter-final")) return 4;
  if (finish.includes("Round of 16")) return 3;
  if (finish.includes("Round of 32")) return 2;
  return 1;
}

export function getDefeatedOpponents(
  selectedNation: Nation,
  userGroupResults: TournamentFixture[],
  bracketRounds: TournamentRoundResults[],
): Nation[] {
  const defeated: Nation[] = [];

  userGroupResults.forEach((fixture) => {
    if (fixture.winner?.code === selectedNation.code) {
      defeated.push(
        fixture.home.code === selectedNation.code ? fixture.away : fixture.home,
      );
    }
  });

  bracketRounds.forEach((round) => {
    round.fixtures.forEach((fixture) => {
      if (
        fixture.isUserMatch &&
        fixture.winner?.code === selectedNation.code
      ) {
        defeated.push(
          fixture.home.code === selectedNation.code ? fixture.away : fixture.home,
        );
      }
    });
  });

  return defeated;
}

export function getScoreTitle(score: number): string {
  if (score === 99) return "GOAT Manager 🐐";
  if (score === 98) return "Legendary ⭐";
  if (score === 97) return "World Class 🔥";
  if (score >= 90) return "Elite Manager";
  if (score >= 80) return "Strong Tournament";
  if (score >= 70) return "Good Run";
  if (score >= 60) return "Average Tournament";
  return "Disappointing Run";
}

export function getScoreRarity(score: number): string | undefined {
  if (score === 99) return "Top 0.05% run";
  if (score === 98) return "Top 0.2% run";
  if (score === 97) return "Top 0.5% run";
  if (score >= 90) return "Top 5% run";
  if (score >= 80) return "Strong run";
  return undefined;
}

export function calculateWorldCupScore(
  input: WorldCupScoreInput,
): WorldCupScoreResult {
  const { finish, stats, awards, topScorerName, mvpName, defeatedOpponents } =
    input;
  const goalDifference = stats.goalsFor - stats.goalsAgainst;
  const matchesPlayed = stats.wins + stats.draws + stats.losses;

  let raw =
    finishBase(finish) +
    stats.wins * 2.2 +
    stats.draws * 0.6 -
    stats.losses * 2.4 +
    Math.min(9, Math.max(-6, goalDifference * 1.15)) +
    Math.min(6, stats.goalsFor * 0.28) -
    Math.min(6, stats.goalsAgainst * 0.22);

  if (defeatedOpponents.length > 0) {
    const avgStrength =
      defeatedOpponents.reduce((sum, nation) => sum + nation.strength, 0) /
      defeatedOpponents.length;
    raw += Math.min(8, Math.max(-3, (avgStrength - 72) * 0.18));
  }

  let awardBonus = 0;
  if (
    awards &&
    topScorerName &&
    awards.goldenBoot.name === topScorerName
  ) {
    awardBonus += 4;
  }
  if (
    awards &&
    mvpName &&
    awards.playerOfTournament.name === mvpName
  ) {
    awardBonus += 4;
  }
  raw += awardBonus;

  if (matchesPlayed > 0) {
    const winRate = stats.wins / matchesPlayed;
    raw += winRate * 6;
  }

  let score = Math.round(Math.min(99, Math.max(1, raw)));

  const eliminationRound = parseEliminationRound(finish);
  const maxForRound = 55 + eliminationRound * 6;
  score = Math.min(score, maxForRound + 8);

  const qualifiesFor99 =
    finish === "World Cup Winners" &&
    stats.losses === 0 &&
    goalDifference >= 10 &&
    stats.wins >= 6 &&
    awardBonus >= 6 &&
    defeatedOpponents.length >= 4 &&
    defeatedOpponents.reduce((sum, n) => sum + n.strength, 0) /
      defeatedOpponents.length >=
      80;

  const qualifiesFor98 =
    finish === "World Cup Winners" &&
    stats.losses <= 1 &&
    goalDifference >= 7 &&
    stats.wins >= 5;

  const qualifiesFor97 =
    finish === "World Cup Winners" ||
    (finish === "World Cup Runner-up" && goalDifference >= 4);

  if (score >= 99 && !qualifiesFor99) score = 98;
  if (score >= 98 && !qualifiesFor98 && !qualifiesFor99) score = 97;
  if (score >= 97 && !qualifiesFor97 && !qualifiesFor98 && !qualifiesFor99) {
    score = 96;
  }

  score = Math.min(99, Math.max(1, score));

  return {
    score,
    title: getScoreTitle(score),
    rarity: getScoreRarity(score),
  };
}

export function buildChallengeText({
  nation,
  finish,
  score,
  scoreTitle,
  topScorer,
  mvp,
}: {
  nation: Nation;
  finish: string;
  score: number;
  scoreTitle: string;
  topScorer?: string;
  mvp?: string;
}): string {
  const url = getShareUrl();
  return [
    `I just simulated the World Cup with ${nation.name} ${nation.flag}`,
    "",
    `Finish: ${finish}`,
    `World Cup Score: ${score}`,
    scoreTitle,
    "",
    `Top Scorer: ${topScorer ?? "–"}`,
    `MVP: ${mvp ?? "–"}`,
    "",
    "Can you beat my score?",
    "",
    "Play here:",
    url,
  ].join("\n");
}
