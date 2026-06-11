export interface LeaderboardEntry {
  id: string;
  name: string;
  nation: string;
  nationFlag: string;
  finish: string;
  score: number;
  scoreTitle: string;
  record: string;
  goalsFor: number;
  goalsAgainst: number;
  topScorer: string;
  mvp: string;
  createdAt: string;
}

const STORAGE_KEY = "world-cup-simulator-leaderboard";
const MAX_ENTRIES = 100;

function finishRank(finish: string): number {
  if (finish === "World Cup Winners") return 7;
  if (finish === "World Cup Runner-up") return 6;
  if (finish.includes("Semi-final")) return 5;
  if (finish.includes("Quarter-final")) return 4;
  if (finish.includes("Round of 16")) return 3;
  if (finish.includes("Round of 32")) return 2;
  return 1;
}

export function sortLeaderboardEntries(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const finishDiff = finishRank(b.finish) - finishRank(a.finish);
    if (finishDiff !== 0) return finishDiff;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.goalsAgainst !== b.goalsAgainst) {
      return a.goalsAgainst - b.goalsAgainst;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getLeaderboardEntries(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return sortLeaderboardEntries(parsed);
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const existing = getLeaderboardEntries();
  const next = sortLeaderboardEntries([entry, ...existing]).slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearLeaderboardEntries(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createLeaderboardEntry(
  data: Omit<LeaderboardEntry, "id" | "createdAt">,
): LeaderboardEntry {
  return {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
}

// Future online leaderboard: replace save/get with API calls to Supabase/Vercel/Postgres.
export type LeaderboardStore = {
  getEntries: () => Promise<LeaderboardEntry[]>;
  saveEntry: (entry: LeaderboardEntry) => Promise<LeaderboardEntry[]>;
  clearEntries: () => Promise<void>;
};

export const localLeaderboardStore: LeaderboardStore = {
  getEntries: async () => getLeaderboardEntries(),
  saveEntry: async (entry) => saveLeaderboardEntry(entry),
  clearEntries: async () => clearLeaderboardEntries(),
};
