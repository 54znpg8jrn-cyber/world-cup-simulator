import { supabase } from "../supabase";

const SUPABASE_TABLE = "higher_lower_leaderboard";

export interface HigherLowerLeaderboardEntry {
  id: string;
  playerName: string;
  streak: number;
  category: string;
  createdAt: string;
}

type HigherLowerLeaderboardRow = {
  id?: string | number | null;
  player_name?: string | null;
  streak?: number | null;
  category?: string | null;
  created_at?: string | null;
};

function fromSupabaseRow(row: HigherLowerLeaderboardRow): HigherLowerLeaderboardEntry {
  return {
    id: String(row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    playerName: row.player_name ?? "Anonymous",
    streak: row.streak ?? 0,
    category: row.category ?? "All Categories",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchHigherLowerLeaderboard(category?: string): Promise<
  HigherLowerLeaderboardEntry[]
> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const query = supabase
    .from(SUPABASE_TABLE)
    .select("id, player_name, streak, category, created_at")
    .order("streak", { ascending: false })
    .order("created_at", { ascending: true });

  const { data, error } = category
    ? await query.eq("category", category).limit(20)
    : await query.limit(20);

  if (error) throw error;
  return (data ?? []).map(fromSupabaseRow);
}

export async function saveHigherLowerScore({
  playerName,
  streak,
  category,
}: Omit<HigherLowerLeaderboardEntry, "id" | "createdAt">): Promise<
  HigherLowerLeaderboardEntry[]
> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from(SUPABASE_TABLE).insert({
    player_name: playerName.trim() || "Anonymous",
    streak,
    category,
  });

  if (error) throw error;
  return fetchHigherLowerLeaderboard(category);
}
