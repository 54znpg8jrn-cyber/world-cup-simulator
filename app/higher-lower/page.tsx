"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  HIGHER_LOWER_ITEMS,
  HIGHER_LOWER_STAT_LABELS,
  type HigherLowerItem,
} from "../lib/games/higher-lower-data";

type Guess = "higher" | "lower";
type RoundState = {
  known: HigherLowerItem;
  mystery: HigherLowerItem;
  revealed: boolean;
  result: "correct" | "wrong" | null;
};

const BEST_STREAK_KEY = "world-cup-higher-lower-best-v1";

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createRound(previous?: RoundState | null): RoundState {
  const eligibleLabels = HIGHER_LOWER_STAT_LABELS.filter((label) => {
    const values = new Set(
      HIGHER_LOWER_ITEMS.filter((item) => item.statLabel === label).map(
        (item) => item.value,
      ),
    );
    return values.size >= 2;
  });
  const statLabel = previous?.mystery.statLabel ?? randomItem(eligibleLabels);
  const pool = HIGHER_LOWER_ITEMS.filter((item) => item.statLabel === statLabel);
  const known = previous?.mystery ?? randomItem(pool);
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
  const [round, setRound] = useState<RoundState | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      await Promise.resolve();
      if (!active) return;
      const savedBest = Number(window.localStorage.getItem(BEST_STREAK_KEY) ?? 0);
      setBestStreak(Number.isFinite(savedBest) ? savedBest : 0);
      setRound(createRound());
    };

    void loadGame();

    return () => {
      active = false;
    };
  }, []);

  const categoryLabel = round?.known.statLabel ?? "World Cup stat";
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

  const playAgain = () => {
    setStreak(0);
    setGameOver(false);
    setMessage("");
    setRound(createRound());
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
      window.setTimeout(() => setRound((current) => createRound(current)), 900);
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
    <main className="stadium-bg min-h-screen w-full max-w-full overflow-x-hidden px-4 py-5 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b75b]">
              Mini-game
            </p>
            <h1 className="mt-1 text-3xl font-black uppercase leading-none sm:text-5xl">
              Higher / Lower
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/50">
              Guess which World Cup stat is higher. Same category every round,
              no tricks.
            </p>
          </div>
          <nav className="grid grid-cols-3 gap-2 sm:flex">
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-white/60">
              Home
            </Link>
            <Link href="/?simulator=1" className="rounded-xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-[#f6dc86]">
              Simulator
            </Link>
            <Link href="/wall-chart" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-white/60">
              Wall Chart
            </Link>
          </nav>
        </header>

        <section className="grid gap-3 rounded-[1.75rem] border border-[#d8b75b]/20 bg-[#101713]/90 p-4 shadow-2xl sm:grid-cols-3">
          <StatBox label="Current Streak" value={streak} />
          <StatBox label="Best Streak" value={bestStreak} />
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-wider text-white/35">
              Category
            </p>
            <p className="mt-1 text-sm font-black text-[#f6dc86]">
              {categoryLabel}
            </p>
          </div>
        </section>

        {round ? (
          <section className="screen-enter grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <HigherLowerCard item={round.known} revealed sideLabel="Known" />
            <div className="grid place-items-center text-center">
              <span className="rounded-full border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#f6dc86]">
                vs
              </span>
            </div>
            <HigherLowerCard
              item={round.mystery}
              revealed={round.revealed}
              sideLabel="Your call"
              pulse={round.result === "correct"}
              wrong={round.result === "wrong"}
            />
          </section>
        ) : null}

        {!gameOver ? (
          <section className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleGuess("higher")}
              disabled={!round || round.revealed}
              className="min-h-16 rounded-2xl bg-[#d8b75b] px-5 py-4 text-lg font-black uppercase tracking-[0.18em] text-black shadow-[0_20px_55px_rgba(216,183,91,.22)] transition active:scale-[0.98] disabled:opacity-50"
            >
              Higher
            </button>
            <button
              type="button"
              onClick={() => handleGuess("lower")}
              disabled={!round || round.revealed}
              className="min-h-16 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg font-black uppercase tracking-[0.18em] transition active:scale-[0.98] disabled:opacity-50"
            >
              Lower
            </button>
          </section>
        ) : (
          <section className="screen-enter rounded-[1.75rem] border border-rose-300/20 bg-rose-300/[0.06] p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-200">
              Game Over
            </p>
            <h2 className="mt-2 text-3xl font-black">Final streak: {streak}</h2>
            <p className="mt-2 text-sm font-bold text-white/55">
              Personal best: {bestStreak}
            </p>
            <div className="mx-auto mt-5 grid max-w-md gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={playAgain}
                className="min-h-12 rounded-2xl bg-[#d8b75b] px-4 py-3 text-xs font-black uppercase tracking-wider text-black"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={shareResult}
                className="min-h-12 rounded-2xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#f6dc86]"
              >
                Share Result
              </button>
            </div>
            {message ? (
              <p className="mt-3 text-xs font-bold text-white/50">{message}</p>
            ) : null}
          </section>
        )}

        {/* TODO: Add Supabase highscore support for Higher / Lower later. */}
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-center">
      <p className="text-[9px] font-black uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black text-[#f6dc86]">{value}</p>
    </div>
  );
}

function HigherLowerCard({
  item,
  revealed,
  sideLabel,
  pulse = false,
  wrong = false,
}: {
  item: HigherLowerItem;
  revealed: boolean;
  sideLabel: string;
  pulse?: boolean;
  wrong?: boolean;
}) {
  return (
    <article
      className={`premium-card overflow-hidden rounded-[2rem] border p-6 text-center shadow-2xl ${
        wrong
          ? "border-rose-300/35 bg-rose-300/[0.07]"
          : pulse
            ? "personal-best-glow border-[#d8b75b]/45 bg-[#d8b75b]/10"
            : "border-white/10 bg-[#101713]/95"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/35">
        {sideLabel}
      </p>
      <div className="mt-5 text-6xl">{item.flagOrEmoji}</div>
      <h2 className="mt-4 break-words text-3xl font-black">{item.label}</h2>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[#d8b75b]">
        {item.statLabel}
      </p>
      <div className="mt-8 rounded-2xl border border-white/8 bg-black/25 px-4 py-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Value
        </p>
        <p className="mt-2 text-5xl font-black text-[#f6dc86]">
          {revealed ? item.value : "?"}
        </p>
        <p className="mt-2 text-sm font-bold text-white/45">
          {revealed ? item.display : "Higher or lower?"}
        </p>
      </div>
    </article>
  );
}
