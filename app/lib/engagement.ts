import type { Nation } from "./types";

export type NationTier = 1 | 2 | 3;

export interface LocalHallOfFame {
  bestScore: number;
  bestFinish: string;
  bestNation: string;
  bestGoalDifference: number;
  tournamentsPlayed: number;
  worldCupsWon: number;
  favoriteNation: string;
  highestUnderdogScore: number;
  nationRuns: Record<string, number>;
}

export interface PersonalBestUpdate {
  previousBest: number;
  isNewBest: boolean;
  stats: LocalHallOfFame;
}

const STORAGE_KEY = "world-cup-simulator-hall-of-fame-v1";

const TIER_ONE = new Set([
  "Argentina",
  "Brazil",
  "France",
  "England",
  "Spain",
  "Germany",
  "Portugal",
  "Netherlands",
]);

const TIER_TWO = new Set([
  "Belgium",
  "Croatia",
  "Uruguay",
  "Italy",
  "Morocco",
  "Denmark",
  "Switzerland",
  "USA",
  "Mexico",
  "Japan",
  "Senegal",
]);

const emptyStats = (): LocalHallOfFame => ({
  bestScore: 0,
  bestFinish: "No completed runs",
  bestNation: "–",
  bestGoalDifference: 0,
  tournamentsPlayed: 0,
  worldCupsWon: 0,
  favoriteNation: "–",
  highestUnderdogScore: 0,
  nationRuns: {},
});

const finishRank = (finish: string) => {
  if (finish === "No completed runs") return 0;
  if (finish === "World Cup Winners") return 7;
  if (finish === "World Cup Runner-up") return 6;
  if (finish.includes("Semi-final")) return 5;
  if (finish.includes("Quarter-final")) return 4;
  if (finish.includes("Round of 16")) return 3;
  if (finish.includes("Round of 32")) return 2;
  return 1;
};

export function getNationTier(nation: Nation | string): NationTier {
  const name = typeof nation === "string" ? nation : nation.name;
  if (TIER_ONE.has(name)) return 1;
  if (TIER_TWO.has(name)) return 2;
  return 3;
}

export function getUnderdogBonus(
  nation: Nation | string,
  finish: string,
): number {
  const tier = getNationTier(nation);
  if (tier === 3) {
    if (finish === "World Cup Winners") return 8;
    if (finish === "World Cup Runner-up") return 6;
    if (finish.includes("Semi-final")) return 4;
    if (finish.includes("Quarter-final")) return 2;
  }
  if (tier === 2 && finish === "World Cup Winners") return 3;
  return 0;
}

export function getLocalHallOfFame(): LocalHallOfFame {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...emptyStats(), ...(JSON.parse(raw) as LocalHallOfFame) }
      : emptyStats();
  } catch {
    return emptyStats();
  }
}

export function recordCompletedTournament({
  score,
  finish,
  nation,
  goalDifference,
}: {
  score: number;
  finish: string;
  nation: Nation;
  goalDifference: number;
}): PersonalBestUpdate {
  const previous = getLocalHallOfFame();
  const nationRuns = {
    ...previous.nationRuns,
    [nation.name]: (previous.nationRuns[nation.name] ?? 0) + 1,
  };
  const favoriteNation =
    Object.entries(nationRuns).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? nation.name;
  const isNewBest = score > previous.bestScore;
  const stats: LocalHallOfFame = {
    bestScore: Math.max(previous.bestScore, score),
    bestFinish:
      finishRank(finish) > finishRank(previous.bestFinish)
        ? finish
        : previous.bestFinish,
    bestNation: isNewBest ? nation.name : previous.bestNation,
    bestGoalDifference:
      previous.tournamentsPlayed === 0
        ? goalDifference
        : Math.max(previous.bestGoalDifference, goalDifference),
    tournamentsPlayed: previous.tournamentsPlayed + 1,
    worldCupsWon:
      previous.worldCupsWon + (finish === "World Cup Winners" ? 1 : 0),
    favoriteNation,
    highestUnderdogScore:
      getNationTier(nation) === 3
        ? Math.max(previous.highestUnderdogScore, score)
        : previous.highestUnderdogScore,
    nationRuns,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // The current result still renders when local storage is unavailable.
  }

  return { previousBest: previous.bestScore, isNewBest, stats };
}
