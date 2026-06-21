"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HIGHER_LOWER_ITEMS,
  HIGHER_LOWER_STAT_LABELS,
  type HigherLowerItem,
} from "../lib/games/higher-lower-data";

type Guess = "higher" | "lower";
type CategoryValue = "all" | string;
type RoundState = {
  known: HigherLowerItem;
  mystery: HigherLowerItem;
  revealed: boolean;
  result: "correct" | "wrong" | null;
};

const BEST_STREAK_KEY = "world-cup-higher-lower-best-v1";

const CATEGORY_LABELS: Record<string, string> = {
  "World Cup titles": "World Cup Titles",
  "World Cup appearances": "World Cup Appearances",
  "World Cup goals": "Player Goals",
  "Player World Cup appearances": "Player Appearances",
  "World Cup record number": "World Cup Records",
  "World Cup final appearances": "Final Appearances",
  "World Cup top-three finishes": "Top-Three Finishes",
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getEligibleLabels() {
  return HIGHER_LOWER_STAT_LABELS.filter((label) => {
    const values = new Set(
      HIGHER_LOWER_ITEMS.filter((item) => item.statLabel === label).map(
        (item) => item.value,
      ),
    );
    return values.size >= 2;
  });
}

function createRound(
  category: CategoryValue,
  previous?: RoundState | null,
): RoundState {
  const eligibleLabels = getEligibleLabels();
  const statLabel =
    category === "all"
      ? previous?.mystery.statLabel ?? randomItem(eligibleLabels)
      : category;
  const pool = HIGHER_LOWER_ITEMS.filter((item) => item.statLabel === statLabel);
  const canCarryPrevious = previous?.mystery.statLabel === statLabel;
  const known = canCarryPrevious ? previous.mystery : randomItem(pool);
  const choices = pool.filter(
    (item) => item.id !== known.id && item.value !== known.value,
  );
  const mystery = randomItem(choices.length ? choices : pool);

  return {
    known,
    mystery,
    revealed: false,
    result: null,
  };
}

export default function HigherLowerPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryValue>("all");
  const [round, setRound] = useState<RoundState | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const nextRoundTimer = useRef<number | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      ...getEligibleLabels().map((label) => ({
        value: label,
        label: CATEGORY_LABELS[label] ?? label,
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
      setBestStreak(Number.isFinite(savedBest) ? savedBest : 0);
      setRound(createRound("all"));
    };

    void loadGame();

    return () => {
      active = false;
      if (nextRoundTimer.current) {
        window.clearTimeout(nextRoundTimer.current);
      }
    };
  }, []);

  const categoryLabel = round
    ? CATEGORY_LABELS[round.known.statLabel] ?? round.known.statLabel
    : "World Cup Stat";
  const shareText = useMemo(
    () =>
      [
        `I scored a streak of ${streak} in World Cup Higher / Lower.`,
        "",
        "Can you beat me?",
        "",
        "Play here:",
        "https://world-cup-simulator-xi.vercel.app/higher-lower",
      ].join("\n"),
    [streak],
  );

  const resetTimer = () => {
    if (nextRoundTimer.current) {
      window.clearTimeout(nextRoundTimer.current);
      nextRoundTimer.current = null;
    }
  };

  const playAgain = (category = selectedCategory) => {
    resetTimer();
    setStreak(0);
    setGameOver(false);
    setMessage("");
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

    setRound({ ...round, revealed: true, result: correct ? "correct" : "wrong" });

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
        window.localStorage.setItem(BEST_STREAK_KEY, String(nextStreak));
      }
      nextRoundTimer.current = window.setTimeout(() => {
        setRound((current) => createRound(selectedCategory, current));
      }, 760);
      return;
    }

    if (streak > bestStreak) {
      setBestStreak(streak);
      window.localStorage.setItem(BEST_STREAK_KEY, String(streak));
    }
    setGameOver(true);
  };

  const shareResult = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "World Cup Higher / Lower",
          text: shareText,
          url: "https://world-cup-simulator-xi.vercel.app/higher-lower",
        });
        setMessage("Challenge shared!");
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setMessage("Challenge copied!");
    } catch {
      setMessage("Could not share right now. Try again.");
    }
  };

  return (
    <main className="stadium-bg relative flex h-dvh w-full max-w-full flex-col overflow-hidden text-white">
      <header className="relative z-20 flex shrink-0 items-center justify-center px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pb-3">
        <Link
          href="/"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white/60 backdrop-blur sm:left-5"
        >
          Home
        </Link>
        <label className="flex min-w-0 flex-col items-center gap-1 text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
            Higher / Lower
          </span>
          <select
            value={selectedCategory}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="h-11 max-w-[min(74vw,22rem)] rounded-full border border-[#d8b75b]/30 bg-[#07110d] px-4 text-center text-xs font-black uppercase tracking-wider text-[#f6dc86] outline-none shadow-[0_12px_40px_rgba(0,0,0,.28)] sm:max-w-sm sm:text-sm"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden">
        {round ? (
          <>
            <ComparisonPanel
              item={round.known}
              revealed
              statLabel={categoryLabel}
              score={streak}
              bestScore={bestStreak}
              side="left"
            />
            <div className="relative z-10 grid h-12 shrink-0 place-items-center border-y border-[#d8b75b]/15 bg-[#07110d]/96 sm:h-16">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[#d8b75b]/45 bg-[#07110d] text-[10px] font-black uppercase tracking-[0.14em] text-[#f6dc86] shadow-[0_12px_34px_rgba(0,0,0,.35)] sm:h-14 sm:w-14 sm:text-xs">
                vs
              </div>
            </div>
            <ComparisonPanel
              item={round.mystery}
              revealed={round.revealed}
              statLabel={categoryLabel}
              result={round.result}
              side="right"
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
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <section className="screen-enter w-full max-w-md rounded-[2rem] border border-[#d8b75b]/30 bg-[#07110d]/95 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,.45)]">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-200">
              Game Over
            </p>
            <h1 className="mt-3 text-5xl font-black text-[#f6dc86]">{streak}</h1>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-white/45">
              Final streak
            </p>
            <p className="mt-3 text-sm font-bold text-white/60">
              Best streak: {bestStreak}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => playAgain()}
                className="min-h-12 rounded-2xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={shareResult}
                className="min-h-12 rounded-2xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
              >
                Share Challenge
              </button>
            </div>
            {message ? (
              <p className="mt-3 text-xs font-bold text-white/55">{message}</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {/* TODO: Add Supabase highscore support for Higher / Lower later. */}
    </main>
  );
}

function ComparisonPanel({
  item,
  revealed,
  statLabel,
  side,
  score,
  bestScore,
  result,
  compareLabel,
  onGuess,
  disabled,
}: {
  item: HigherLowerItem;
  revealed: boolean;
  statLabel: string;
  side: "left" | "right";
  score?: number;
  bestScore?: number;
  result?: "correct" | "wrong" | null;
  compareLabel?: string;
  onGuess?: (guess: Guess) => void;
  disabled?: boolean;
}) {
  const isRight = side === "right";

  return (
    <article
      className={`relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden border-white/10 px-3 py-2 text-center sm:px-5 sm:py-5 ${
        result === "wrong"
          ? "bg-rose-950/45"
          : result === "correct"
            ? "bg-[#d8b75b]/12"
            : isRight
              ? "bg-[#0b1911]/92"
              : "bg-[#07110d]/95"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,183,91,.16),transparent_46%)]" />
      {!isRight ? (
        <div className="absolute right-2 top-2 z-10 rounded-xl border border-white/10 bg-black/25 px-2 py-1.5 text-right backdrop-blur sm:right-5 sm:top-5 sm:rounded-2xl sm:px-3 sm:py-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/35">
            Streak {score}
          </p>
          <p className="text-[9px] font-black uppercase tracking-wider text-[#f6dc86]">
            Best {bestScore}
          </p>
        </div>
      ) : null}

      <div className="relative z-10 flex max-h-full min-w-0 flex-col items-center">
        <div className="text-3xl leading-none sm:text-6xl lg:text-7xl">
          {item.flagOrEmoji}
        </div>
        <h2 className="mt-1 max-w-[18rem] break-words text-xl font-black uppercase leading-none tracking-[-0.04em] sm:mt-4 sm:text-4xl lg:max-w-xl lg:text-6xl">
          {item.label}
        </h2>
        <p className="mt-1 max-w-[18rem] text-[9px] font-black uppercase tracking-[0.16em] text-[#d8b75b] sm:mt-2 sm:text-xs">
          {statLabel}
        </p>
        <div
          className={`mt-2 rounded-[1.2rem] border px-5 py-2 sm:mt-6 sm:rounded-[1.4rem] sm:px-8 sm:py-5 ${
            result === "wrong"
              ? "border-rose-200/30 bg-rose-300/10"
              : result === "correct"
                ? "personal-best-glow border-[#d8b75b]/45 bg-[#d8b75b]/10"
                : "border-white/10 bg-black/25"
          }`}
        >
          <p className="text-4xl font-black leading-none text-[#f6dc86] sm:text-7xl">
            {revealed ? item.value : "?"}
          </p>
          <p className="mt-1 text-[11px] font-bold text-white/45 sm:text-sm">
            {revealed ? item.display : "Hidden value"}
          </p>
        </div>

        {isRight ? (
          <div className="mt-2 w-full max-w-xs sm:mt-6">
            <p className="mb-1 text-[11px] font-bold text-white/45 sm:mb-2 sm:text-xs">
              {compareLabel}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onGuess?.("higher")}
                disabled={disabled}
                className="min-h-11 rounded-2xl bg-[#d8b75b] px-3 py-2 text-sm font-black uppercase tracking-wider text-black shadow-[0_18px_45px_rgba(216,183,91,.22)] transition active:scale-[0.98] disabled:opacity-55 sm:min-h-14 sm:py-3"
              >
                Higher
              </button>
              <button
                type="button"
                onClick={() => onGuess?.("lower")}
                disabled={disabled}
                className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-55 sm:min-h-14 sm:py-3"
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
