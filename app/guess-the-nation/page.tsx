"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNationFlag } from "../lib/flags";
import {
  CLUB_PUZZLE_NATIONS,
  createClubPuzzle,
  getDailyClubPuzzle,
  type NationClubPuzzle,
} from "../lib/games/guess-the-nation-data";

type Mode = "daily" | "unlimited";
type Result = "correct" | "incorrect" | null;
type PuzzleStats = { score: number; streak: number; bestStreak: number };

const STATS_KEY = "world-cup-guess-nation-stats-v1";
const PITCH_SPOTS = [
  [50, 88], [82, 68], [61, 70], [39, 70], [18, 68], [28, 46], [50, 46], [72, 46], [78, 18], [50, 14], [22, 18],
] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readStats(): PuzzleStats {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") as PuzzleStats;
  } catch {
    return { score: 0, streak: 0, bestStreak: 0 };
  }
}

function safeStats(): PuzzleStats {
  if (typeof window === "undefined") return { score: 0, streak: 0, bestStreak: 0 };
  const stats = readStats();
  return { score: stats.score ?? 0, streak: stats.streak ?? 0, bestStreak: stats.bestStreak ?? 0 };
}

export default function GuessTheNationPage() {
  const [mode, setMode] = useState<Mode>("daily");
  const [puzzle, setPuzzle] = useState<NationClubPuzzle | null>(() => getDailyClubPuzzle(todayKey()));
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState<"confederation" | "player" | null>(null);
  const [usedNations, setUsedNations] = useState<string[]>([]);
  const [stats, setStats] = useState<PuzzleStats>({ score: 0, streak: 0, bestStreak: 0 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setStats(safeStats()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || result) return [];
    return CLUB_PUZZLE_NATIONS.filter((nation) => nation.toLowerCase().includes(normalized)).slice(0, 6);
  }, [query, result]);

  const setDaily = () => {
    setMode("daily");
    setPuzzle(getDailyClubPuzzle(todayKey()));
    setQuery("");
    setResult(null);
    setHint(null);
    setMessage("");
  };

  const nextUnlimited = () => {
    const choices = CLUB_PUZZLE_NATIONS.filter((nation) => !usedNations.includes(nation));
    const pool = choices.length ? choices : CLUB_PUZZLE_NATIONS;
    const nation = pool[Math.floor(Math.random() * pool.length)];
    setPuzzle(createClubPuzzle(nation));
    setUsedNations((current) => [...current, nation].slice(-20));
    setQuery("");
    setResult(null);
    setHint(null);
    setMessage("");
  };

  const setUnlimited = () => {
    setMode("unlimited");
    nextUnlimited();
  };

  const submitGuess = (nation: string) => {
    if (!puzzle || result) return;
    const correct = nation === puzzle.nation;
    const next = correct
      ? { score: stats.score + 1, streak: stats.streak + 1, bestStreak: Math.max(stats.bestStreak, stats.streak + 1) }
      : { ...stats, streak: 0 };
    setStats(next);
    try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch { /* local score is optional */ }
    setQuery("");
    setResult(correct ? "correct" : "incorrect");
  };

  const share = async () => {
    if (!puzzle) return;
    const text = result === "correct"
      ? `I guessed ${puzzle.nation} from its club XI in World Cup Games. Can you do it?`
      : "I played Guess the Nation by Clubs in World Cup Games. Can you beat my streak?";
    const url = `${window.location.origin}/guess-the-nation`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Guess the Nation", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMessage("Challenge link copied!");
      }
    } catch (error) {
      console.error("Guess the Nation share failed", error);
      setMessage("Could not share right now.");
    }
  };

  return <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-5 sm:py-5">
    <div className="mx-auto w-full max-w-5xl min-w-0">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3"><Link href="/" className="flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-wider text-white/70">Home</Link><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">Club XI puzzle</p><h1 className="truncate text-2xl font-black tracking-[-0.05em] sm:text-4xl">Guess the Nation</h1></div></div>
        <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1"><ModeButton active={mode === "daily"} onClick={setDaily}>Daily</ModeButton><ModeButton active={mode === "unlimited"} onClick={setUnlimited}>Unlimited</ModeButton></div>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:max-w-md"><Stat label="Score" value={stats.score} /><Stat label="Streak" value={stats.streak} /><Stat label="Best" value={stats.bestStreak} /></section>

      {puzzle ? <section className="mt-4 rounded-[1.75rem] border border-sky-300/20 bg-[linear-gradient(135deg,rgba(28,73,130,.86),rgba(8,20,28,.96))] p-3 shadow-[0_24px_70px_rgba(0,0,0,.35)] sm:mt-5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Hidden national XI</p><p className="mt-1 text-sm font-bold text-white/60">Read the clubs. Name the country.</p></div>{result ? <span className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${result === "correct" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-rose-300/30 bg-rose-300/10 text-rose-100"}`}>{result === "correct" ? "Correct!" : "Not this time"}</span> : <div className="flex gap-2"><button type="button" onClick={() => setHint("confederation")} className="min-h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-[9px] font-black uppercase tracking-wider text-white/75">Confederation hint</button><button type="button" onClick={() => setHint("player")} className="min-h-10 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-[9px] font-black uppercase tracking-wider text-white/75">Reveal player</button></div>}</div>
        {hint === "confederation" && !result ? <p className="mt-3 rounded-xl border border-[#d8b75b]/20 bg-[#d8b75b]/10 px-3 py-2 text-xs font-bold text-[#f6dc86]">Confederation: {puzzle.confederation}</p> : null}
        {hint === "player" && !result ? <p className="mt-3 rounded-xl border border-[#d8b75b]/20 bg-[#d8b75b]/10 px-3 py-2 text-xs font-bold text-[#f6dc86]">One player: {puzzle.lineup[0].name}</p> : null}

        {result ? <div className={`puzzle-result-banner mt-4 text-center ${result === "correct" ? "puzzle-success hot-take-confetti" : "puzzle-miss"}`}><p className="text-4xl">{result === "correct" ? "✓" : "!"}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em]">{result === "correct" ? "You got it" : "The answer was"}</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">{getNationFlag(puzzle.nation)} {puzzle.nation}</h2><p className="mt-2 text-sm font-bold text-white/70">{result === "correct" ? "The whole XI is yours. Great read of the clubs." : "The player names below show the full club-XI answer."}</p></div> : null}
        <div className={`club-pitch mt-4 ${result === "correct" ? "club-pitch-success" : ""}`}>{puzzle.lineup.map((player, index) => <article key={player.id} style={{ left: `${PITCH_SPOTS[index][0]}%`, top: `${PITCH_SPOTS[index][1]}%` }} className={`club-pitch-slot ${result ? "club-pitch-slot-revealed" : ""}`}><p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#f6dc86]">{player.position}</p><p className="mt-0.5 line-clamp-2 text-[10px] font-black leading-3 sm:text-xs">{player.club}</p>{result ? <p className="mt-1 truncate text-[9px] font-bold text-white/60">{player.name}</p> : null}</article>)}</div>

        {result ? <div className="mt-5 text-center"><div className="mx-auto grid max-w-md gap-2 sm:grid-cols-2"><button type="button" onClick={() => mode === "daily" ? setUnlimited() : nextUnlimited()} className="min-h-12 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black">{mode === "daily" ? "Play Unlimited" : "Next Team"}</button><button type="button" onClick={() => void share()} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/80">Challenge a Friend</button></div></div> : <div className="relative mt-5"><label className="sr-only" htmlFor="nation-guess">Guess the nation</label><div className="flex flex-col gap-2 sm:flex-row"><input id="nation-guess" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search World Cup nations..." className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold outline-none placeholder:text-white/35 focus:border-sky-300/60" /><button type="button" disabled={!query.trim()} onClick={() => { const match = CLUB_PUZZLE_NATIONS.find((nation) => nation.toLowerCase() === query.trim().toLowerCase()); if (match) submitGuess(match); else setMessage("Choose a nation from the list."); }} className="min-h-12 rounded-xl bg-[#d8b75b] px-6 text-xs font-black uppercase tracking-wider text-black disabled:opacity-45">Guess</button></div>{suggestions.length ? <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#08110c] shadow-2xl">{suggestions.map((nation) => <button key={nation} type="button" onClick={() => submitGuess(nation)} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-bold hover:bg-white/5"><span>{getNationFlag(nation)}</span>{nation}</button>)}</div> : null}</div>}
        {message ? <p className="mt-3 text-center text-xs font-bold text-[#f6dc86]">{message}</p> : null}
      </section> : null}
    </div>
  </main>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-wider ${active ? "bg-[#d8b75b] text-black" : "text-white/60"}`}>{children}</button>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center"><p className="text-[8px] font-black uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 text-xl font-black text-[#f6dc86]">{value}</p></div>;
}
