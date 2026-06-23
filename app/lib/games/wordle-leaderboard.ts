import { supabase } from "../supabase";

const SUPABASE_TABLE = "wordle_leaderboard";
const STORAGE_KEY = "world-cup-wordle-leaderboard-v1";
const MAX_ENTRIES = 20;

export interface WordleLeaderboardEntry {
  id: string;
  playerName: string;
  mode: string;
  guesses: number;
  solved: boolean;
  streak: number;
  createdAt: string;
}

type WordleLeaderboardRow = {
  id?: string | null;
  player_name?: string | null;
  mode?: string | null;
  guesses?: number | null;
  solved?: boolean | null;
  streak?: number | null;
  created_at?: string | null;
};

export function sortWordleLeaderboardEntries(entries: WordleLeaderboardEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.solved !== b.solved) return a.solved ? -1 : 1;
    if (a.guesses !== b.guesses) return a.guesses - b.guesses;
    if (a.streak !== b.streak) return b.streak - a.streak;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function fromRow(row: WordleLeaderboardRow): WordleLeaderboardEntry {
  return {
    id: row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    playerName: row.player_name ?? "Anonymous",
    mode: row.mode ?? "daily",
    guesses: row.guesses ?? 0,
    solved: row.solved ?? false,
    streak: row.streak ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function getLocalWordleLeaderboard(): WordleLeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return sortWordleLeaderboardEntries(JSON.parse(stored) as WordleLeaderboardEntry[]).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveLocalWordleLeaderboard(entry: WordleLeaderboardEntry) {
  const entries = sortWordleLeaderboardEntries([entry, ...getLocalWordleLeaderboard()]).slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export async function fetchWordleLeaderboard(): Promise<WordleLeaderboardEntry[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("id, player_name, mode, guesses, solved, streak, created_at")
    .order("solved", { ascending: false })
    .order("guesses", { ascending: true })
    .order("streak", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES);

  if (error) throw error;
  return sortWordleLeaderboardEntries((data ?? []).map(fromRow));
}

export async function saveWordleLeaderboardScore({
  playerName,
  mode,
  guesses,
  solved,
  streak,
}: Omit<WordleLeaderboardEntry, "id" | "createdAt">): Promise<{
  entries: WordleLeaderboardEntry[];
  fallback: boolean;
}> {
  const localEntry: WordleLeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    playerName: playerName.trim() || "Anonymous",
    mode,
    guesses,
    solved,
    streak,
    createdAt: new Date().toISOString(),
  };

  const localEntries = saveLocalWordleLeaderboard(localEntry);
  if (!supabase) return { entries: localEntries, fallback: true };

  try {
    const { error } = await supabase.from(SUPABASE_TABLE).insert({
      player_name: localEntry.playerName,
      mode,
      guesses,
      solved,
      streak,
    });
    if (error) throw error;

    return { entries: await fetchWordleLeaderboard(), fallback: false };
  } catch (error) {
    console.error("Wordle leaderboard save failed", error);
    return { entries: localEntries, fallback: true };
  }
}
