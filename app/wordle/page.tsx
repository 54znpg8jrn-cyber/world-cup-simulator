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
import {
  fetchWordleLeaderboard,
  getLocalWordleLeaderboard,
  saveWordleLeaderboardScore,
  type WordleLeaderboardEntry,
} from "../lib/games/wordle-leaderboard";

type WordleMode = "daily" | "unlimited";
type GameStatus = "playing" | "won" | "lost";
type HintColor = "green" | "yellow" | "gray";
type HintKind = "nation" | "position" | "age" | "caps" | "goals";
type GuessHints = {
  nation: HintColor;
  position: HintColor;
  age: ReturnType<typeof numericHint>;
  caps: ReturnType<typeof numericHint>;
  goals: ReturnType<typeof numericHint>;
};

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
const PLAYER_NAME_KEY = "world-cup-wordle-player-name-v1";

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

function getGuessHints(guess: WordlePlayer, target: WordlePlayer): GuessHints {
  return {
    nation: nationHint(guess.nation, target.nation),
    position: positionHint(guess.position, target.position),
    age: numericHint(guess.age, target.age, 2),
    caps: numericHint(guess.caps, target.caps, 1),
    goals: numericHint(guess.goals, target.goals, 2),
  };
}

function resultGrid(guesses: WordlePlayer[], target: WordlePlayer) {
  return guesses
    .map((guess) => {
      const hints = getGuessHints(guess, target);
      return [
        hintSquare(hints.nation),
        hintSquare(hints.position),
        hintSquare(hints.age.color),
        hintSquare(hints.caps.color),
        hintSquare(hints.goals.color),
      ].join("");
    })
    .join("\n");
}

export default function WorldCupWordlePage() {
  const [mode, setMode] = useState<WordleMode>("daily");
  const [game, setGame] = useState<WordleGame | null>(null);
  const [stats, setStats] = useState<WordleStats>(EMPTY_STATS);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [playerName, setPlayerName] = useState("World Cup Fan");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<WordleLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
      setPlayerName(localStorage.getItem(PLAYER_NAME_KEY) ?? "World Cup Fan");
      setGame(nextGame);
      setQuery("");
      setMessage("");
      setScoreSaved(false);

      if (new URLSearchParams(window.location.search).get("leaderboard") === "1") {
        setLeaderboardOpen(true);
        setLeaderboardLoading(true);
        setLeaderboardError("");
        try {
          setLeaderboardEntries(await fetchWordleLeaderboard());
        } catch (error) {
          console.error("Wordle leaderboard fetch failed", error);
          setLeaderboardEntries(getLocalWordleLeaderboard());
          setLeaderboardError("Global leaderboard temporarily unavailable. Showing scores saved on this device.");
        } finally {
          if (active) setLeaderboardLoading(false);
        }
      }
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
    setScoreSaved(false);
  };

  const openLeaderboard = async () => {
    setLeaderboardOpen(true);
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      setLeaderboardEntries(await fetchWordleLeaderboard());
    } catch (error) {
      console.error("Wordle leaderboard fetch failed", error);
      setLeaderboardEntries(getLocalWordleLeaderboard());
      setLeaderboardError("Global leaderboard temporarily unavailable. Showing scores saved on this device.");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const saveScore = async () => {
    if (!game || game.status !== "won" || scoreSaved || scoreSaving) return;
    setScoreSaving(true);
    setMessage("");
    try {
      const result = await saveWordleLeaderboardScore({
        playerName,
        mode,
        guesses: guesses.length,
        solved: true,
        streak: stats.currentStreak,
      });
      setLeaderboardEntries(result.entries);
      setScoreSaved(true);
      setMessage(result.fallback ? "Score saved on this device." : "Score saved to the global leaderboard!");
    } catch (error) {
      console.error("Wordle leaderboard save failed", error);
      setMessage("Could not save globally right now. Your score was kept on this device.");
      setScoreSaved(true);
    } finally {
      setScoreSaving(false);
    }
  };

  const challengeFriend = async () => {
    const url = `${window.location.origin}/wordle`;
    const text = "I just played World Cup Wordle. Can you solve today’s player faster than me?";
    try {
      if (navigator.share) {
        await navigator.share({ title: "World Cup Wordle", text, url });
        setMessage("Challenge shared!");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Challenge link copied!");
    } catch (error) {
      console.error("Wordle challenge share failed", error);
      setMessage("Could not share the challenge right now.");
    }
  };

  const shareResult = async () => {
    if (!target || !game) return;
    const grid = resultGrid(guesses, target);
    const solved = game.status === "won";
    const url = `${window.location.origin}/wordle`;
    const text = [
      "World Cup Wordle",
      grid,
      "",
      solved ? `Solved in ${guesses.length} guesses` : "Failed to solve the player",
      url,
    ].join("\n");

    setIsSharing(true);
    try {
      const blob = await generateWordleResultImage({
        mode,
        status: game.status,
        guesses,
        target,
        streak: stats.currentStreak,
        url,
      });
      const file = new File([blob], "world-cup-wordle-result.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "World Cup Wordle",
          text,
          files: [file],
        });
        setMessage("Result shared!");
        return;
      }

      downloadResultImage(blob);
      setMessage("Result image downloaded!");
    } catch (error) {
      console.error("Wordle result image generation failed", error);
      try {
        await navigator.clipboard.writeText(text);
        setMessage("Result copied! Image generation was unavailable.");
      } catch {
        setMessage("Could not create the result image or copy the result.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-4xl min-w-0">
        <header className="flex min-w-0 flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/60">
              Home
            </Link>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">Daily football puzzle</p>
              <h1 className="truncate text-xl font-black uppercase tracking-[-0.04em] sm:text-3xl">World Cup Wordle</h1>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 sm:flex-none">
              <ModeButton active={mode === "daily"} onClick={() => setMode("daily")}>Daily</ModeButton>
              <ModeButton active={mode === "unlimited"} onClick={() => setMode("unlimited")}>Unlimited</ModeButton>
            </div>
            <button type="button" onClick={() => void openLeaderboard()} className="min-h-10 rounded-xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-3 text-[9px] font-black uppercase tracking-wider text-[#f6dc86]">Top 20</button>
            <button type="button" onClick={() => setHelpOpen(true)} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white/80" aria-label="How to play World Cup Wordle">?</button>
          </div>
        </header>

        <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4">
          <WordleStat label="Current streak" value={stats.currentStreak} />
          <WordleStat label="Best streak" value={stats.bestStreak} />
          <WordleStat label="Games played" value={stats.gamesPlayed} />
          <WordleStat label="Win rate" value={`${winPercentage}%`} />
        </section>

        <section className="mt-4 min-w-0 rounded-[1.5rem] border border-[#d8b75b]/20 bg-[#09130d]/90 p-3 shadow-2xl sm:mt-5 sm:p-5">
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

          <div className="mt-5 hidden min-w-0 sm:block">
            <div className="min-w-0">
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

          <div className="mt-5 grid gap-2 sm:hidden">
            {guesses.map((guess) => target ? <MobileGuessCard key={guess.id} guess={guess} target={target} /> : null)}
            {guesses.length < MAX_GUESSES ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-[10px] font-black uppercase tracking-wider text-white/30">
                Your next guess will appear here
              </div>
            ) : null}
          </div>

          {game && game.status !== "playing" && target ? (
            <ResultPanel
              status={game.status}
              target={target}
              guesses={guesses.length}
              mode={mode}
              onShare={() => void shareResult()}
              onChallenge={() => void challengeFriend()}
              onNewUnlimited={newUnlimitedGame}
              sharing={isSharing}
              playerName={playerName}
              onPlayerNameChange={(value) => {
                const nextName = value.slice(0, 40);
                setPlayerName(nextName);
                localStorage.setItem(PLAYER_NAME_KEY, nextName);
              }}
              onSaveScore={() => void saveScore()}
              scoreSaved={scoreSaved}
              scoreSaving={scoreSaving}
            />
          ) : null}
        </section>
      </div>
      {leaderboardOpen ? <WordleLeaderboardModal entries={leaderboardEntries} loading={leaderboardLoading} error={leaderboardError} onClose={() => setLeaderboardOpen(false)} /> : null}
      {helpOpen ? <WordleHelpModal onClose={() => setHelpOpen(false)} /> : null}
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
  const hints = getGuessHints(guess, target);
  return <div className="screen-enter grid grid-cols-[1.25fr_repeat(5,minmax(0,1fr))] gap-1">
    <div className="flex min-w-0 items-center rounded-lg border border-white/10 bg-black/20 px-2 text-xs font-black"><span className="truncate">{guess.name}</span></div>
    <HintCell kind="nation" color={hints.nation} value={guess.nation} />
    <HintCell kind="position" color={hints.position} value={guess.position} />
    <HintCell kind="age" color={hints.age.color} arrow={hints.age.arrow} value={`${guess.age}${hints.age.arrow ?? ""}`} />
    <HintCell kind="caps" color={hints.caps.color} arrow={hints.caps.arrow} value={`${guess.caps}${hints.caps.arrow ?? ""}`} />
    <HintCell kind="goals" color={hints.goals.color} arrow={hints.goals.arrow} value={`${guess.goals}${hints.goals.arrow ?? ""}`} />
  </div>;
}

function MobileGuessCard({ guess, target }: { guess: WordlePlayer; target: WordlePlayer }) {
  const hints = getGuessHints(guess, target);
  return <article className="screen-enter rounded-xl border border-white/10 bg-black/20 p-3">
    <p className="truncate text-sm font-black">{guess.name}</p>
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      <HintCell label="Nation" kind="nation" color={hints.nation} value={guess.nation} />
      <HintCell label="Position" kind="position" color={hints.position} value={guess.position} />
      <HintCell label="Age" kind="age" color={hints.age.color} arrow={hints.age.arrow} value={`${guess.age}${hints.age.arrow ?? ""}`} />
      <HintCell label="Caps" kind="caps" color={hints.caps.color} arrow={hints.caps.arrow} value={`${guess.caps}${hints.caps.arrow ?? ""}`} />
      <HintCell label="Goals" kind="goals" color={hints.goals.color} arrow={hints.goals.arrow} value={`${guess.goals}${hints.goals.arrow ?? ""}`} />
    </div>
  </article>;
}

function HintCell({ kind, color, value, label, arrow }: { kind: HintKind; color: HintColor; value: string; label?: string; arrow?: "↑" | "↓" | null }) {
  const [open, setOpen] = useState(false);
  const explanation = hintExplanation(kind, color, arrow);
  return <button type="button" title={explanation} aria-label={`${label ?? kind}: ${value}. ${explanation}`} onClick={() => setOpen((current) => !current)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg border px-1 text-center text-xs font-black outline-none transition focus:ring-2 focus:ring-[#d8b75b]/70 ${cellClass(color)}`}>
    {label ? <span className="text-[8px] uppercase tracking-wider opacity-60">{label}</span> : null}
    <span className="max-w-full truncate">{value}</span>
    {open ? <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-30 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-[#07110d] px-2 py-1.5 text-[10px] font-bold leading-4 text-white shadow-xl">{explanation}</span> : null}
  </button>;
}

function hintExplanation(kind: HintKind, color: HintColor, arrow?: "↑" | "↓" | null) {
  if (kind === "nation") return color === "green" ? "Correct nation." : color === "yellow" ? "Right continent, but not the right nation." : "Different continent.";
  if (kind === "position") return color === "green" ? "Exact position match." : color === "yellow" ? "Same position group, but not the exact position." : "Different position group.";
  if (kind === "age") return color === "green" ? "Exact age." : color === "yellow" ? `Close age. ${arrow === "↑" ? "Answer is older." : "Answer is younger."}` : `Not close. ${arrow === "↑" ? "Answer is older." : "Answer is younger."}`;
  if (kind === "caps") return color === "green" ? "Exact World Cup appearances." : color === "yellow" ? `Close. Answer has ${arrow === "↑" ? "more" : "fewer"} appearances.` : `Not close. Answer has ${arrow === "↑" ? "more" : "fewer"} appearances.`;
  return color === "green" ? "Exact World Cup goals." : color === "yellow" ? `Close. Answer has ${arrow === "↑" ? "more" : "fewer"} goals.` : `Not close. Answer has ${arrow === "↑" ? "more" : "fewer"} goals.`;
}

function WordleHelpModal({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-end bg-black/75 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="How to play World Cup Wordle">
    <section className="screen-enter max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-[#d8b75b]/25 bg-[#08110c] p-5 shadow-2xl sm:p-7"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">World Cup Games</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">How to Play World Cup Wordle</h2><p className="mt-3 text-sm leading-6 text-white/65">Guess the mystery World Cup player. Every colour shows how close your guess is.</p><div className="mt-5 grid gap-3 text-sm"><HelpRule title="Nation" text="Green: correct nation. Yellow: same continent. Gray: different continent." /><HelpRule title="Position" text="Green: exact position. Yellow: same position group. Gray: different group." /><HelpRule title="Age" text="Green: exact. Yellow: within 2 years. Gray: further away. ↑ means older, ↓ means younger." /><HelpRule title="Appearances" text="Green: exact. Yellow: within 1. Gray: further away. ↑ means more, ↓ means fewer." /><HelpRule title="Goals" text="Green: exact. Yellow: within 2. Gray: further away. ↑ means more, ↓ means fewer." /></div><p className="mt-5 text-sm font-bold text-[#f6dc86]">Solve the player in as few guesses as possible.</p><button type="button" onClick={onClose} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#f6dc86] active:scale-[.98]">Got it</button></section>
  </div>;
}

function HelpRule({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="font-black text-white">{title}</p><p className="mt-1 text-xs leading-5 text-white/55">{text}</p></div>;
}

function ResultPanel({ status, target, guesses, mode, onShare, onChallenge, onNewUnlimited, sharing, playerName, onPlayerNameChange, onSaveScore, scoreSaved, scoreSaving }: { status: Exclude<GameStatus, "playing">; target: WordlePlayer; guesses: number; mode: WordleMode; onShare: () => void; onChallenge: () => void; onNewUnlimited: () => void; sharing: boolean; playerName: string; onPlayerNameChange: (value: string) => void; onSaveScore: () => void; scoreSaved: boolean; scoreSaving: boolean }) {
  const won = status === "won";
  return <div className={`screen-enter mt-5 rounded-2xl border p-4 text-center ${won ? "border-emerald-300/30 bg-emerald-300/[0.08]" : "border-rose-300/25 bg-rose-300/[0.06]"}`}>
    <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${won ? "text-emerald-200" : "text-rose-200"}`}>{won ? "Solved" : "Out of guesses"}</p>
    <h2 className="mt-2 text-2xl font-black">{target.name}</h2>
    <p className="mt-1 text-sm font-bold text-white/55">{target.nation} · {target.position} · {target.goals} international goals</p>
    {won ? <p className="mt-2 text-sm font-black text-[#f6dc86]">Solved in {guesses} guesses</p> : null}
    <div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2">
      <button type="button" onClick={onShare} disabled={sharing} className="min-h-11 rounded-xl border border-[#d8b75b]/25 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86] disabled:opacity-50">{sharing ? "Creating image..." : "Share Result"}</button>
      <button type="button" onClick={onChallenge} className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/80">Challenge a Friend</button>
      {mode === "unlimited" ? <button type="button" onClick={onNewUnlimited} className="min-h-11 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black">Next Player</button> : <p className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/55">New daily puzzle tomorrow</p>}
    </div>
    {won ? <div className="mx-auto mt-3 grid max-w-md gap-2 sm:grid-cols-[1fr_auto]">
      <input value={playerName} onChange={(event) => onPlayerNameChange(event.target.value)} maxLength={40} aria-label="Leaderboard player name" className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold outline-none focus:border-[#d8b75b]/50" />
      <button type="button" onClick={onSaveScore} disabled={scoreSaved || scoreSaving} className="min-h-11 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50">{scoreSaved ? "Score Saved" : scoreSaving ? "Saving..." : "Save Score"}</button>
    </div> : null}
  </div>;
}

function WordleLeaderboardModal({ entries, loading, error, onClose }: { entries: WordleLeaderboardEntry[]; loading: boolean; error: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="World Cup Wordle leaderboard">
    <section className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#d8b75b]/25 bg-[#08110c] p-4 shadow-2xl sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">Global leaderboard</p><h2 className="text-2xl font-black">Wordle Top 20</h2></div><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-black uppercase text-white/65">Close</button></div>
      {error ? <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-bold text-amber-100">{error}</p> : null}
      {loading ? <p className="py-10 text-center text-sm font-bold text-white/50">Loading scores...</p> : entries.length ? <div className="mt-4 overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.25rem_3rem_3.25rem] gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[8px] font-black uppercase tracking-wider text-white/40"><span>#</span><span>Player</span><span>Mode</span><span>Guess</span><span>Streak</span></div>{entries.map((entry, index) => <div key={entry.id} className={`grid grid-cols-[2.25rem_minmax(0,1fr)_3.25rem_3rem_3.25rem] items-center gap-2 border-b border-white/5 px-3 py-3 text-xs last:border-b-0 ${index < 3 ? "bg-[#d8b75b]/[0.06]" : ""}`}><span className={`font-black ${index === 0 ? "text-yellow-300" : index === 1 ? "text-slate-200" : index === 2 ? "text-amber-500" : "text-white/45"}`}>{index + 1}</span><div className="min-w-0"><p className="truncate font-black">{entry.playerName}</p><p className="text-[9px] text-white/35">{new Date(entry.createdAt).toLocaleDateString()}</p></div><span className="uppercase text-white/60">{entry.mode}</span><span className="font-black text-[#f6dc86]">{entry.guesses}</span><span className="font-black text-emerald-200">{entry.streak}</span></div>)}</div> : <p className="py-10 text-center text-sm font-bold text-white/50">No scores yet. Set the first benchmark.</p>}
    </section>
  </div>;
}

async function generateWordleResultImage({
  mode,
  status,
  guesses,
  target,
  streak,
  url,
}: {
  mode: WordleMode;
  status: GameStatus;
  guesses: WordlePlayer[];
  target: WordlePlayer;
  streak: number;
  url: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, "#173a27");
  background.addColorStop(0.6, "#07140d");
  background.addColorStop(1, "#020604");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(216,183,91,.12)";
  context.lineWidth = 2;
  for (let offset = 56; offset < 1080; offset += 72) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, 1350);
    context.stroke();
  }

  context.textAlign = "center";
  context.fillStyle = "#d8b75b";
  context.font = "900 32px Arial, sans-serif";
  context.fillText("WORLD CUP WORDLE", 540, 100);
  context.fillStyle = "rgba(255,255,255,.5)";
  context.font = "800 24px Arial, sans-serif";
  context.fillText(mode === "daily" ? "DAILY CHALLENGE" : "UNLIMITED MODE", 540, 145);

  const won = status === "won";
  context.fillStyle = won ? "#9cf0b0" : "#ffb2b2";
  context.font = "900 74px Arial, sans-serif";
  context.fillText(won ? "SOLVED" : "FAILED", 540, 260);
  context.fillStyle = "#f6dc86";
  context.font = "900 38px Arial, sans-serif";
  context.fillText(won ? `${guesses.length} GUESSES` : `${guesses.length} GUESSES USED`, 540, 315);

  const squareSize = 94;
  const gap = 18;
  const rowWidth = squareSize * 5 + gap * 4;
  const startX = (1080 - rowWidth) / 2;
  let y = 390;
  const colors: Record<HintColor, string> = {
    green: "#34a866",
    yellow: "#d8b75b",
    gray: "#526057",
  };

  guesses.forEach((guess) => {
    const hints = getGuessHints(guess, target);
    const row = [hints.nation, hints.position, hints.age.color, hints.caps.color, hints.goals.color];
    row.forEach((color, index) => {
      drawCanvasRoundRect(context, startX + index * (squareSize + gap), y, squareSize, squareSize, 18);
      context.fillStyle = colors[color];
      context.fill();
      context.strokeStyle = "rgba(255,255,255,.18)";
      context.lineWidth = 2;
      context.stroke();
    });
    y += squareSize + gap;
  });

  const infoY = Math.max(y + 38, 780);
  drawCanvasRoundRect(context, 110, infoY, 860, 185, 28);
  context.fillStyle = "rgba(0,0,0,.28)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.12)";
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.48)";
  context.font = "800 22px Arial, sans-serif";
  context.fillText("MYSTERY PLAYER", 540, infoY + 52);
  context.fillStyle = "#ffffff";
  context.font = "900 50px Arial, sans-serif";
  drawCanvasFittedText(context, target.name.toUpperCase(), 540, infoY + 116, 760);
  context.fillStyle = "#f6dc86";
  context.font = "800 24px Arial, sans-serif";
  context.fillText(`${target.nation.toUpperCase()} · ${target.position} · STREAK ${streak}`, 540, infoY + 156);

  context.fillStyle = "#d8b75b";
  context.font = "900 34px Arial, sans-serif";
  context.fillText("CAN YOU SOLVE TOMORROW'S PLAYER?", 540, 1180);
  context.fillStyle = "rgba(255,255,255,.45)";
  context.font = "700 20px Arial, sans-serif";
  drawCanvasFittedText(context, url, 540, 1240, 840);
  context.fillText("WORLD CUP SIMULATOR", 540, 1290);

  return canvasToBlob(canvas);
}

function drawCanvasRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawCanvasFittedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((item, index) => context.fillText(item, x, y + index * 46));
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) return blob;
  const response = await fetch(canvas.toDataURL("image/png"));
  const fallback = await response.blob();
  if (!fallback.size) throw new Error("Canvas PNG export returned empty data");
  return fallback;
}

function downloadResultImage(blob: Blob) {
  const imageUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "world-cup-wordle-result.png";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
}
