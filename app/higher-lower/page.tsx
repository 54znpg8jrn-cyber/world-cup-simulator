"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HIGHER_LOWER_CATEGORIES,
  HIGHER_LOWER_ITEMS,
  type HigherLowerCategory,
  type HigherLowerItem,
} from "../lib/games/higher-lower-data";
import {
  fetchHigherLowerLeaderboard,
  saveHigherLowerScore,
  type HigherLowerLeaderboardEntry,
} from "../lib/games/higher-lower-leaderboard";

type Guess = "higher" | "lower";
type CategoryValue = "all" | HigherLowerCategory;
type Feedback = "correct" | "wrong" | null;
type RoundState = {
  known: HigherLowerItem;
  mystery: HigherLowerItem;
  revealed: boolean;
  result: Feedback;
};

const BEST_STREAK_KEY = "world-cup-higher-lower-best-v1";
const PLAYER_NAME_KEY = "world-cup-higher-lower-player-name-v1";

const CATEGORY_IDS = Object.keys(
  HIGHER_LOWER_CATEGORIES,
) as HigherLowerCategory[];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createRound(
  selectedCategory: CategoryValue,
  previous?: RoundState | null,
): RoundState {
  const category =
    selectedCategory === "all"
      ? randomItem(CATEGORY_IDS)
      : selectedCategory;
  const pool = HIGHER_LOWER_ITEMS.filter((item) => item.category === category);
  const carryPrevious =
    selectedCategory !== "all" && previous?.mystery.category === category;
  const known = carryPrevious ? previous.mystery : randomItem(pool);
  const choices = pool.filter(
    (item) => item.id !== known.id && item.value !== known.value,
  );

  return {
    known,
    mystery: randomItem(choices.length ? choices : pool),
    revealed: false,
    result: null,
  };
}

function milestoneFor(streak: number) {
  if (streak >= 20) return "Legend";
  if (streak >= 10) return "Expert";
  if (streak >= 5) return "Rookie";
  return null;
}

export default function HigherLowerPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryValue>("all");
  const [round, setRound] = useState<RoundState | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverCategory, setGameOverCategory] = useState("All Categories");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [streakCelebrating, setStreakCelebrating] = useState(false);
  const [message, setMessage] = useState("");
  const [playerName, setPlayerName] = useState("World Cup Fan");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    HigherLowerLeaderboardEntry[]
  >([]);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const nextRoundTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "all" as const, label: "All Categories" },
      ...CATEGORY_IDS.map((id) => ({
        value: id,
        label: HIGHER_LOWER_CATEGORIES[id].label,
      })),
    ],
    [],
  );

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      await Promise.resolve();
      if (!active) return;
      const savedBest = Number(window.localStorage.getItem(BEST_STREAK_KEY) ?? 0);
      const savedName = window.localStorage.getItem(PLAYER_NAME_KEY);
      setBestStreak(Number.isFinite(savedBest) ? savedBest : 0);
      if (savedName) setPlayerName(savedName);
      setRound(createRound("all"));
    };

    void loadGame();

    return () => {
      active = false;
      if (nextRoundTimer.current) window.clearTimeout(nextRoundTimer.current);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  const milestone = milestoneFor(streak);

  const clearTimers = () => {
    if (nextRoundTimer.current) window.clearTimeout(nextRoundTimer.current);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    nextRoundTimer.current = null;
    feedbackTimer.current = null;
  };

  const playAgain = (category = selectedCategory) => {
    clearTimers();
    setStreak(0);
    setGameOver(false);
    setFeedback(null);
    setStreakCelebrating(false);
    setMessage("");
    setScoreSaved(false);
    setRound(createRound(category));
  };

  const handleCategoryChange = (value: CategoryValue) => {
    setSelectedCategory(value);
    playAgain(value);
  };

  const handleGuess = (guess: Guess) => {
    if (!round || round.revealed || gameOver) return;
    const isHigher = round.mystery.value > round.known.value;
    const correct =
      (guess === "higher" && isHigher) || (guess === "lower" && !isHigher);
    const result: Feedback = correct ? "correct" : "wrong";

    setRound({ ...round, revealed: true, result });
    setFeedback(result);

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setStreakCelebrating(true);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
        window.localStorage.setItem(BEST_STREAK_KEY, String(nextStreak));
      }
      feedbackTimer.current = window.setTimeout(
        () => setStreakCelebrating(false),
        550,
      );
      nextRoundTimer.current = window.setTimeout(() => {
        setFeedback(null);
        setRound((current) => createRound(selectedCategory, current));
      }, 900);
      return;
    }

    setGameOverCategory(HIGHER_LOWER_CATEGORIES[round.known.category].label);
    nextRoundTimer.current = window.setTimeout(() => setGameOver(true), 760);
  };

  const shareScore = async () => {
    const shareText = `I scored ${streak} in World Cup Higher / Lower. Can you beat me?`;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "World Cup Higher / Lower",
          text: shareText,
          url,
        });
        setMessage("Challenge shared!");
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setMessage("Challenge copied!");
    } catch {
      setMessage("Could not share right now. Try again.");
    }
  };

  const updatePlayerName = (value: string) => {
    const nextName = value.slice(0, 40);
    setPlayerName(nextName);
    window.localStorage.setItem(PLAYER_NAME_KEY, nextName);
  };

  const openLeaderboard = async () => {
    setLeaderboardOpen(true);
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      setLeaderboardEntries(await fetchHigherLowerLeaderboard());
    } catch (error) {
      console.error("Higher / Lower leaderboard fetch failed", error);
      setLeaderboardError("Top scores are temporarily unavailable.");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const saveScore = async () => {
    if (scoreSaved || scoreSaving) return;
    setScoreSaving(true);
    setMessage("");
    try {
      const entries = await saveHigherLowerScore({
        playerName,
        streak,
        category: gameOverCategory,
      });
      setLeaderboardEntries(entries);
      setScoreSaved(true);
      setMessage("Score saved to the Top 20.");
    } catch (error) {
      console.error("Higher / Lower leaderboard save failed", error);
      setMessage("Could not save right now. Your personal best is still saved.");
    } finally {
      setScoreSaving(false);
    }
  };

  return (
    <main className="stadium-bg relative flex h-dvh w-full max-w-full flex-col overflow-hidden text-white">
      <header className="relative z-20 grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pb-3">
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white/60 backdrop-blur"
        >
          Home
        </Link>
        <label className="flex min-w-0 flex-col items-center gap-1 text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
            Higher / Lower
          </span>
          <select
            value={selectedCategory}
            onChange={(event) =>
              handleCategoryChange(event.target.value as CategoryValue)
            }
            className="h-10 max-w-full rounded-full border border-[#d8b75b]/30 bg-[#07110d] px-3 text-center text-[10px] font-black uppercase tracking-wider text-[#f6dc86] outline-none shadow-[0_12px_40px_rgba(0,0,0,.28)] sm:h-11 sm:px-4 sm:text-sm"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void openLeaderboard()}
          className="rounded-full border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-[#f6dc86]"
        >
          Top 20
        </button>
      </header>

      <section className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] lg:grid-rows-1">
        {round ? (
          <>
            <ComparisonPanel
              item={round.known}
              revealed
              score={streak}
              bestScore={bestStreak}
              milestone={milestone}
              streakCelebrating={streakCelebrating}
              side="known"
            />
            <div className="relative z-10 grid h-11 shrink-0 place-items-center border-y border-[#d8b75b]/15 bg-[#07110d]/96 sm:h-14 lg:h-auto lg:min-h-0 lg:border-x lg:border-y-0">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[#d8b75b]/45 bg-[#07110d] text-[10px] font-black uppercase tracking-[0.14em] text-[#f6dc86] shadow-[0_12px_34px_rgba(0,0,0,.35)] sm:h-12 sm:w-12 lg:h-16 lg:w-16 lg:text-sm">
                vs
              </div>
            </div>
            <ComparisonPanel
              item={round.mystery}
              revealed={round.revealed}
              result={feedback}
              side="guess"
              compareLabel={`than ${round.known.label}`}
              onGuess={handleGuess}
              disabled={round.revealed || gameOver}
            />
          </>
        ) : (
          <div className="col-span-full grid place-items-center text-sm font-black uppercase tracking-widest text-white/40">
            Loading match-up
          </div>
        )}
      </section>

      {gameOver ? (
        <GameOverModal
          streak={streak}
          bestStreak={bestStreak}
          category={gameOverCategory}
          milestone={milestoneFor(streak)}
          playerName={playerName}
          onPlayerNameChange={updatePlayerName}
          onPlayAgain={() => playAgain()}
          onShare={() => void shareScore()}
          onSave={() => void saveScore()}
          onShowLeaderboard={() => void openLeaderboard()}
          saved={scoreSaved}
          saving={scoreSaving}
          message={message}
        />
      ) : null}

      {leaderboardOpen ? (
        <LeaderboardModal
          entries={leaderboardEntries}
          loading={leaderboardLoading}
          error={leaderboardError}
          onClose={() => setLeaderboardOpen(false)}
        />
      ) : null}
    </main>
  );
}

function ComparisonPanel({
  item,
  revealed,
  side,
  score,
  bestScore,
  milestone,
  streakCelebrating,
  result,
  compareLabel,
  onGuess,
  disabled,
}: {
  item: HigherLowerItem;
  revealed: boolean;
  side: "known" | "guess";
  score?: number;
  bestScore?: number;
  milestone?: string | null;
  streakCelebrating?: boolean;
  result?: Feedback;
  compareLabel?: string;
  onGuess?: (guess: Guess) => void;
  disabled?: boolean;
}) {
  const isGuess = side === "guess";

  return (
    <article
      className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden border-white/10 px-3 py-2 text-center transition-colors duration-500 sm:px-5 sm:py-5 lg:px-8 lg:py-8 ${
        result === "wrong"
          ? "bg-rose-950/45"
          : result === "correct"
            ? "bg-[#d8b75b]/12"
            : isGuess
              ? "bg-[#0b1911]/92"
              : "bg-[#07110d]/95"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,183,91,.16),transparent_46%)]" />
      {!isGuess ? (
        <div className="absolute right-2 top-2 z-10 rounded-xl border border-white/10 bg-black/25 px-2 py-1.5 text-right backdrop-blur sm:right-5 sm:top-5 sm:rounded-2xl sm:px-3 sm:py-2">
          <p className={`text-[9px] font-black uppercase tracking-wider text-white/35 ${streakCelebrating ? "animate-bounce text-[#f6dc86]" : ""}`}>
            Streak {score}
          </p>
          <p className="text-[9px] font-black uppercase tracking-wider text-[#f6dc86]">
            Best {bestScore}
          </p>
          {milestone ? (
            <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-200">
              {milestone}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 flex max-h-full min-w-0 flex-col items-center lg:w-full">
        <div className="text-3xl leading-none sm:text-6xl lg:text-7xl">
          {item.flagOrEmoji}
        </div>
        <h2 className="mt-1 max-w-[18rem] break-words text-xl font-black uppercase leading-none tracking-[-0.04em] sm:mt-4 sm:text-4xl lg:max-w-xl lg:text-6xl">
          {item.label}
        </h2>
        <p className="mt-1 max-w-[18rem] text-[9px] font-black uppercase tracking-[0.16em] text-[#d8b75b] sm:mt-2 sm:text-xs">
          {item.statLabel}
        </p>
        <div
          className={`mt-2 rounded-[1.2rem] border px-5 py-2 transition-all duration-500 sm:mt-6 sm:rounded-[1.4rem] sm:px-8 sm:py-5 ${
            result === "wrong"
              ? "border-rose-200/30 bg-rose-300/10"
              : result === "correct"
                ? "personal-best-glow border-[#d8b75b]/45 bg-[#d8b75b]/10"
                : "border-white/10 bg-black/25"
          }`}
        >
          <p className="text-4xl font-black leading-none text-[#f6dc86] transition-transform duration-500 sm:text-7xl">
            {revealed ? item.value.toLocaleString() : "?"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-white/45 sm:text-sm">
            {revealed ? item.display : "Hidden value"}
          </p>
        </div>

        {isGuess ? (
          <div className="mt-2 w-full max-w-xs sm:mt-6 lg:mt-8 lg:max-w-sm">
            {result ? (
              <p className={`mb-1 text-[11px] font-black uppercase tracking-wider sm:mb-2 ${result === "correct" ? "text-emerald-200" : "text-rose-200"}`}>
                {result === "correct" ? "Correct. Keep going." : "Not this time."}
              </p>
            ) : (
              <p className="mb-1 text-[11px] font-bold text-white/45 sm:mb-2 sm:text-xs">
                {compareLabel}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onGuess?.("higher")}
                disabled={disabled}
                className="min-h-11 rounded-2xl bg-[#d8b75b] px-3 py-2 text-sm font-black uppercase tracking-wider text-black shadow-[0_18px_45px_rgba(216,183,91,.22)] transition active:scale-[0.98] disabled:opacity-55 sm:min-h-14 sm:py-3 lg:min-h-16 lg:px-6 lg:text-base"
              >
                Higher
              </button>
              <button
                type="button"
                onClick={() => onGuess?.("lower")}
                disabled={disabled}
                className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-55 sm:min-h-14 sm:py-3 lg:min-h-16 lg:px-6 lg:text-base"
              >
                Lower
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function GameOverModal({
  streak,
  bestStreak,
  category,
  milestone,
  playerName,
  onPlayerNameChange,
  onPlayAgain,
  onShare,
  onSave,
  onShowLeaderboard,
  saved,
  saving,
  message,
}: {
  streak: number;
  bestStreak: number;
  category: string;
  milestone: string | null;
  playerName: string;
  onPlayerNameChange: (value: string) => void;
  onPlayAgain: () => void;
  onShare: () => void;
  onSave: () => void;
  onShowLeaderboard: () => void;
  saved: boolean;
  saving: boolean;
  message: string;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/72 px-3 py-3 backdrop-blur-sm">
      <section className="screen-enter w-full max-w-md rounded-[1.75rem] border border-[#d8b75b]/30 bg-[#07110d]/95 p-4 text-center shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-200">
          Game Over
        </p>
        <h1 className="mt-2 text-5xl font-black text-[#f6dc86] sm:text-6xl">{streak}</h1>
        <p className="text-[10px] font-black uppercase tracking-wider text-white/45">
          Final streak
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-left">
          <InfoBox label="Best streak" value={String(bestStreak)} />
          <InfoBox label="Category" value={category} />
        </div>
        {milestone ? (
          <p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-200">
            {milestone} badge earned
          </p>
        ) : null}
        {streak >= 10 ? (
          <p className="mt-2 text-xs font-bold text-[#f6dc86]">
            Only 8% of players reach streak 10+. You made it.
          </p>
        ) : null}
        <label className="mt-3 block text-left text-[10px] font-black uppercase tracking-wider text-white/40">
          Name for Top 20
          <input
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            maxLength={40}
            className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#d8b75b]/50"
            placeholder="Your name"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="min-h-11 rounded-xl bg-[#d8b75b] px-3 py-2 text-xs font-black uppercase tracking-wider text-black"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onShare}
            className="min-h-11 rounded-xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
          >
            Share Score
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saved || saving}
            className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "Saving..." : "Save Score"}
          </button>
          <button
            type="button"
            onClick={onShowLeaderboard}
            className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
          >
            View Top 20
          </button>
        </div>
        {message ? (
          <p className="mt-2 text-xs font-bold text-white/55">{message}</p>
        ) : null}
      </section>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-black text-[#f6dc86]">{value}</p>
    </div>
  );
}

function LeaderboardModal({
  entries,
  loading,
  error,
  onClose,
}: {
  entries: HigherLowerLeaderboardEntry[];
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/78 px-3 py-3 backdrop-blur-sm">
      <section className="screen-enter w-full max-w-2xl rounded-[1.75rem] border border-[#d8b75b]/30 bg-[#07110d]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
              Global
            </p>
            <h2 className="text-xl font-black">Higher / Lower Top 20</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white/65"
          >
            Close
          </button>
        </div>
        {loading ? (
          <p className="mt-8 text-center text-sm font-bold text-white/45">Loading scores...</p>
        ) : error ? (
          <p className="mt-8 text-center text-sm font-bold text-rose-200">{error}</p>
        ) : entries.length ? (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`min-w-0 rounded-lg border px-2 py-1.5 ${
                  index === 0
                    ? "border-[#d8b75b]/45 bg-[#d8b75b]/10"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <p className="text-[8px] font-black uppercase tracking-wider text-white/35">
                  #{index + 1} · {entry.streak}
                </p>
                <p className="truncate text-[11px] font-black text-white">{entry.playerName}</p>
                <p className="truncate text-[8px] font-bold text-white/40">{entry.category}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm font-bold text-white/45">
            Be the first name on the board.
          </p>
        )}
      </section>
    </div>
  );
}
