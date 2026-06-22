"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  getPositionGroup,
  NATION_CONFEDERATIONS,
  WORDLE_PLAYERS,
  type WordlePlayer,
  type WordlePosition,
} from "../lib/games/wordle-players";

type WordleMode = "daily" | "unlimited";
type GameStatus = "playing" | "won" | "lost";
type HintColor = "green" | "yellow" | "gray";

type WordleGame = {
  targetId: string;
  guessIds: string[];
  status: GameStatus;
};

type WordleStats = {
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  wins: number;
};

const MAX_GUESSES = 6;
const STATS_KEY = "world-cup-wordle-stats-v1";
const DAILY_GAME_PREFIX = "world-cup-wordle-daily-v1-";

const EMPTY_STATS: WordleStats = {
  currentStreak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  wins: 0,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dailyPlayer(day: string) {
  let hash = 0;
  for (const character of day) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return WORDLE_PLAYERS[hash % WORDLE_PLAYERS.length];
}

function randomPlayer(excludeId?: string) {
  const choices = excludeId
    ? WORDLE_PLAYERS.filter((player) => player.id !== excludeId)
    : WORDLE_PLAYERS;
  return choices[Math.floor(Math.random() * choices.length)];
}

function gameForPlayer(player: WordlePlayer): WordleGame {
  return { targetId: player.id, guessIds: [], status: "playing" };
}

function readStats(): WordleStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) return EMPTY_STATS;
    return { ...EMPTY_STATS, ...(JSON.parse(stored) as Partial<WordleStats>) };
  } catch {
    return EMPTY_STATS;
  }
}

function saveStats(stats: WordleStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function readDailyGame(day: string): WordleGame | null {
  try {
    const stored = localStorage.getItem(`${DAILY_GAME_PREFIX}${day}`);
    if (!stored) return null;
    const game = JSON.parse(stored) as WordleGame;
    return WORDLE_PLAYERS.some((player) => player.id === game.targetId) ? game : null;
  } catch {
    return null;
  }
}

function positionHint(guess: WordlePosition, target: WordlePosition): HintColor {
  if (guess === target) return "green";
  return getPositionGroup(guess) === getPositionGroup(target) ? "yellow" : "gray";
}

function nationHint(guess: string, target: string): HintColor {
  if (guess === target) return "green";
  return NATION_CONFEDERATIONS[guess] === NATION_CONFEDERATIONS[target]
    ? "yellow"
    : "gray";
}

function numericHint(
  guess: number,
  target: number,
  closeRange: number,
): { color: HintColor; arrow: "↑" | "↓" | null } {
  if (guess === target) return { color: "green", arrow: null };
  return {
    color: Math.abs(guess - target) <= closeRange ? "yellow" : "gray",
    arrow: target > guess ? "↑" : "↓",
  };
}

function cellClass(color: HintColor) {
  if (color === "green") return "border-emerald-300/40 bg-emerald-400/20 text-emerald-100";
  if (color === "yellow") return "border-[#d8b75b]/45 bg-[#d8b75b]/20 text-[#f6dc86]";
  return "border-white/10 bg-white/[0.045] text-white/55";
}

function hintSquare(color: HintColor) {
  return color === "green" ? "🟩" : color === "yellow" ? "🟨" : "⬜";
}

export default function WorldCupWordlePage() {
  const [mode, setMode] = useState<WordleMode>("daily");
  const [game, setGame] = useState<WordleGame | null>(null);
  const [stats, setStats] = useState<WordleStats>(EMPTY_STATS);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      await Promise.resolve();
      if (!active) return;
      const day = todayKey();
      const target = mode === "daily" ? dailyPlayer(day) : randomPlayer();
      const nextGame =
        mode === "daily" ? readDailyGame(day) ?? gameForPlayer(target) : gameForPlayer(target);
      setStats(readStats());
      setGame(nextGame);
      setQuery("");
      setMessage("");
    };

    void loadGame();

    return () => {
      active = false;
    };
  }, [mode]);

  const target = useMemo(
    () => WORDLE_PLAYERS.find((player) => player.id === game?.targetId) ?? null,
    [game?.targetId],
  );
  const guesses = useMemo(
    () =>
      (game?.guessIds ?? [])
        .map((id) => WORDLE_PLAYERS.find((player) => player.id === id))
        .filter((player): player is WordlePlayer => Boolean(player)),
    [game?.guessIds],
  );
  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || game?.status !== "playing") return [];
    return WORDLE_PLAYERS.filter((player) =>
      player.name.toLowerCase().includes(normalized),
    ).slice(0, 6);
  }, [game?.status, query]);
  const winPercentage = stats.gamesPlayed
    ? Math.round((stats.wins / stats.gamesPlayed) * 100)
    : 0;

  const updateStats = (won: boolean) => {
    const next: WordleStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (won ? 1 : 0),
      currentStreak: won ? stats.currentStreak + 1 : 0,
      bestStreak: won
        ? Math.max(stats.bestStreak, stats.currentStreak + 1)
        : stats.bestStreak,
    };
    setStats(next);
    saveStats(next);
  };

  const submitGuess = (player: WordlePlayer) => {
    if (!game || !target || game.status !== "playing") return;
    if (game.guessIds.includes(player.id)) {
      setMessage("You already tried that player.");
      return;
    }

    const guessIds = [...game.guessIds, player.id];
    const won = player.id === target.id;
    const lost = !won && guessIds.length >= MAX_GUESSES;
    const nextGame: WordleGame = {
      ...game,
      guessIds,
      status: won ? "won" : lost ? "lost" : "playing",
    };
    setGame(nextGame);
    setQuery("");
    setMessage("");

    if (mode === "daily") {
      localStorage.setItem(`${DAILY_GAME_PREFIX}${todayKey()}`, JSON.stringify(nextGame));
    }
    if (won || lost) updateStats(won);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    const player = WORDLE_PLAYERS.find(
      (candidate) => candidate.name.toLowerCase() === normalized,
    );
    if (!player) {
      setMessage("Choose a player from the suggestions.");
      return;
    }
    submitGuess(player);
  };

  const newUnlimitedGame = () => {
    if (!target) return;
    setGame(gameForPlayer(randomPlayer(target.id)));
    setQuery("");
    setMessage("");
  };

  const shareResult = async () => {
    if (!target || !game) return;
    const grid = guesses
      .map((guess) =>
        [
          hintSquare(nationHint(guess.nation, target.nation)),
          hintSquare(positionHint(guess.position, target.position)),
          hintSquare(numericHint(guess.age, target.age, 2).color),
          hintSquare(numericHint(guess.caps, target.caps, 3).color),
          hintSquare(numericHint(guess.goals, target.goals, 2).color),
        ].join(""),
      )
      .join("\n");
    const text = [
      "World Cup Wordle",
      grid,
      "",
      `Solved in ${guesses.length} guesses`,
      window.location.href,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "World Cup Wordle", text });
        setMessage("Result shared!");
        return;
      }
      await navigator.clipboard.writeText(text);
      setMessage("Result copied!");
    } catch {
      setMessage("Could not share right now. Try again.");
    }
  };

  return (
    <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/60">
              Home
            </Link>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">Daily football puzzle</p>
              <h1 className="text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">World Cup Wordle</h1>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            <ModeButton active={mode === "daily"} onClick={() => setMode("daily")}>Daily</ModeButton>
            <ModeButton active={mode === "unlimited"} onClick={() => setMode("unlimited")}>Unlimited</ModeButton>
          </div>
        </header>

        <section className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4">
          <WordleStat label="Current streak" value={stats.currentStreak} />
          <WordleStat label="Best streak" value={stats.bestStreak} />
          <WordleStat label="Games played" value={stats.gamesPlayed} />
          <WordleStat label="Win rate" value={`${winPercentage}%`} />
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#d8b75b]/20 bg-[#09130d]/90 p-3 shadow-2xl sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-[#f6dc86]">
              {mode === "daily" ? `Daily challenge · ${todayKey()}` : "Unlimited mode"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{guesses.length} / {MAX_GUESSES} guesses</p>
          </div>
          <p className="mt-1 text-[10px] font-bold text-white/35">
            Current 2026 squad players · verified age · international caps and goals
          </p>

          <form onSubmit={handleSubmit} className="relative mt-4 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="player-guess">Guess a World Cup player</label>
            <input
              id="player-guess"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={game?.status !== "playing"}
              placeholder="Type a World Cup player..."
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold outline-none placeholder:text-white/30 focus:border-[#d8b75b]/50 disabled:opacity-50"
            />
            <button type="submit" disabled={!query.trim() || game?.status !== "playing"} className="min-h-12 rounded-xl bg-[#d8b75b] px-6 text-xs font-black uppercase tracking-wider text-black disabled:opacity-40">
              Guess
            </button>
            {suggestions.length ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#0b1710] shadow-2xl">
                {suggestions.map((player) => (
                  <button key={player.id} type="button" onClick={() => submitGuess(player)} className="flex min-h-10 w-full items-center justify-between border-b border-white/5 px-3 text-left text-sm font-bold last:border-b-0 hover:bg-white/5">
                    <span>{player.name}</span><span className="text-xs text-white/40">{player.nation}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </form>
          {message ? <p className="mt-2 text-xs font-bold text-[#f6dc86]">{message}</p> : null}

          <div className="mt-6 overflow-x-auto pb-1">
            <div className="min-w-[35rem]">
              <div className="grid grid-cols-[1.25fr_repeat(5,minmax(0,1fr))] gap-1 text-center text-[9px] font-black uppercase tracking-wider text-white/35">
                <span className="text-left">Player</span><span>Nation</span><span>Position</span><span>Age</span><span>Caps</span><span>Goals</span>
              </div>
              <div className="mt-2 grid gap-2">
                {guesses.map((guess) => target ? <GuessRow key={guess.id} guess={guess} target={target} /> : null)}
                {Array.from({ length: Math.max(0, MAX_GUESSES - guesses.length) }, (_, index) => (
                  <div key={index} className="grid grid-cols-[1.25fr_repeat(5,minmax(0,1fr))] gap-1 opacity-40">
                    {Array.from({ length: 6 }, (_, cell) => <div key={cell} className="h-12 rounded-lg border border-dashed border-white/10 bg-white/[0.02]" />)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {game && game.status !== "playing" && target ? (
            <ResultPanel
              status={game.status}
              target={target}
              guesses={guesses.length}
              mode={mode}
              onShare={() => void shareResult()}
              onNewUnlimited={newUnlimitedGame}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider transition ${active ? "bg-[#d8b75b] text-black" : "text-white/55 hover:bg-white/5"}`}>{children}</button>;
}

function WordleStat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3 text-center"><p className="text-[8px] font-black uppercase tracking-wider text-white/35">{label}</p><p className="mt-1 text-xl font-black text-[#f6dc86]">{value}</p></div>;
}

function GuessRow({ guess, target }: { guess: WordlePlayer; target: WordlePlayer }) {
  const age = numericHint(guess.age, target.age, 2);
  const appearances = numericHint(guess.caps, target.caps, 3);
  const goals = numericHint(guess.goals, target.goals, 2);
  return <div className="screen-enter grid grid-cols-[1.25fr_repeat(5,minmax(0,1fr))] gap-1">
    <div className="flex min-w-0 items-center rounded-lg border border-white/10 bg-black/20 px-2 text-xs font-black"><span className="truncate">{guess.name}</span></div>
    <HintCell color={nationHint(guess.nation, target.nation)} value={guess.nation} />
    <HintCell color={positionHint(guess.position, target.position)} value={guess.position} />
    <HintCell color={age.color} value={`${guess.age}${age.arrow ?? ""}`} />
    <HintCell color={appearances.color} value={`${guess.caps}${appearances.arrow ?? ""}`} />
    <HintCell color={goals.color} value={`${guess.goals}${goals.arrow ?? ""}`} />
  </div>;
}

function HintCell({ color, value }: { color: HintColor; value: string }) {
  return <div className={`flex min-h-12 items-center justify-center rounded-lg border px-1 text-center text-xs font-black ${cellClass(color)}`}>{value}</div>;
}

function ResultPanel({ status, target, guesses, mode, onShare, onNewUnlimited }: { status: Exclude<GameStatus, "playing">; target: WordlePlayer; guesses: number; mode: WordleMode; onShare: () => void; onNewUnlimited: () => void }) {
  const won = status === "won";
  return <div className={`screen-enter mt-5 rounded-2xl border p-4 text-center ${won ? "border-emerald-300/30 bg-emerald-300/[0.08]" : "border-rose-300/25 bg-rose-300/[0.06]"}`}>
    <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${won ? "text-emerald-200" : "text-rose-200"}`}>{won ? "Solved" : "Out of guesses"}</p>
    <h2 className="mt-2 text-2xl font-black">{target.name}</h2>
    <p className="mt-1 text-sm font-bold text-white/55">{target.nation} · {target.position} · {target.goals} international goals</p>
    {won ? <p className="mt-2 text-sm font-black text-[#f6dc86]">Solved in {guesses} guesses</p> : null}
    <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
      {won ? <button type="button" onClick={onShare} className="min-h-11 rounded-xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86]">Share Result</button> : null}
      {mode === "unlimited" ? <button type="button" onClick={onNewUnlimited} className="min-h-11 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black">Next Player</button> : <p className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/55">New daily puzzle tomorrow</p>}
    </div>
  </div>;
}
