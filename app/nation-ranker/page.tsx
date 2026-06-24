"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNationFlag } from "../lib/flags";
import {
  NATION_RANKER_CATEGORIES,
  rankNations,
  type NationRankerCategory,
  type NationRankerMode,
} from "../lib/games/nation-ranker-data";

type Round = { category: NationRankerCategory; nations: string[] };
type RankerStats = { score: number; streak: number; bestScore: number; bestStreak: number };

const STATS_KEY = "world-cup-nation-ranker-stats-v1";

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createRound(mode: NationRankerMode): Round {
  const categories = NATION_RANKER_CATEGORIES.filter((category) => category.mode === mode);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const nations = shuffle(Object.keys(category.values)).slice(0, 5);
  return { category, nations: shuffle(nations) };
}

function defaultStats(): RankerStats {
  return { score: 0, streak: 0, bestScore: 0, bestStreak: 0 };
}

function loadStats() {
  if (typeof window === "undefined") return defaultStats();
  try { return { ...defaultStats(), ...(JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") as Partial<RankerStats>) }; } catch { return defaultStats(); }
}

export default function NationRankerPage() {
  const [mode, setMode] = useState<NationRankerMode>("best");
  const [round, setRound] = useState<Round>(() => createRound("best"));
  const [order, setOrder] = useState<string[]>(round.nations);
  const [submitted, setSubmitted] = useState(false);
  const [draggedNation, setDraggedNation] = useState<string | null>(null);
  const [stats, setStats] = useState<RankerStats>(defaultStats);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setStats(loadStats()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const correctOrder = useMemo(() => rankNations(round.category, round.nations), [round]);
  const distance = order.reduce((total, nation, index) => total + Math.abs(index - correctOrder.indexOf(nation)), 0);
  const maximumDistance = order.length * (order.length - 1);
  const roundScore = Math.round(100 * (1 - distance / maximumDistance));
  const perfect = distance === 0;

  const startRound = (nextMode = mode) => {
    const nextRound = createRound(nextMode);
    setRound(nextRound);
    setOrder(nextRound.nations);
    setSubmitted(false);
    setDraggedNation(null);
    setMessage("");
  };

  const changeMode = (nextMode: NationRankerMode) => {
    setMode(nextMode);
    startRound(nextMode);
  };

  const moveNation = (nation: string, direction: -1 | 1) => {
    if (submitted) return;
    setOrder((current) => {
      const index = current.indexOf(nation);
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const dropNation = (target: string) => {
    if (!draggedNation || draggedNation === target || submitted) return;
    setOrder((current) => {
      const from = current.indexOf(draggedNation);
      const to = current.indexOf(target);
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, draggedNation);
      return next;
    });
    setDraggedNation(null);
  };

  const submit = () => {
    if (submitted) return;
    const next: RankerStats = {
      score: stats.score + roundScore,
      streak: perfect ? stats.streak + 1 : 0,
      bestScore: Math.max(stats.bestScore, stats.score + roundScore),
      bestStreak: perfect ? Math.max(stats.bestStreak, stats.streak + 1) : stats.bestStreak,
    };
    setStats(next);
    try { localStorage.setItem(STATS_KEY, JSON.stringify(next)); } catch { /* local score is optional */ }
    setSubmitted(true);
  };

  const share = async () => {
    const text = `I scored ${stats.score} in Nation Ranker on World Cup Games. Can you rank the nations better?`;
    const url = `${window.location.origin}/nation-ranker`;
    try {
      const blob = await createRankerShareCard(stats, round.category.label);
      const file = new File([blob], "world-cup-nation-ranker.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Nation Ranker", text, files: [file] });
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "world-cup-nation-ranker.png";
        link.click();
        URL.revokeObjectURL(link.href);
        setMessage("Score card downloaded!");
      }
    } catch (error) {
      console.error("Nation Ranker share failed", error);
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setMessage("Challenge link copied!");
      } catch {
        setMessage("Could not share right now.");
      }
    }
  };

  return <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-5 sm:py-5">
    <div className="mx-auto w-full max-w-3xl min-w-0">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Link href="/" className="flex min-h-11 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-wider text-white/70">Home</Link><div><p className="text-[9px] font-black uppercase tracking-[0.24em] text-violet-200">Ranking challenge</p><h1 className="text-2xl font-black tracking-[-0.05em] sm:text-4xl">Nation Ranker</h1></div></div><div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1"><ModeButton active={mode === "best"} onClick={() => changeMode("best")}>Best first</ModeButton><ModeButton active={mode === "worst"} onClick={() => changeMode("worst")}>Worst first</ModeButton></div></header>

      <section className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md"><Stat label="Score" value={stats.score} /><Stat label="Perfect streak" value={stats.streak} /><Stat label="Best score" value={stats.bestScore} /></section>

      <section key={`${round.category.id}-${round.nations.join("-")}`} className="mt-4 rounded-[1.75rem] border border-violet-300/25 bg-[linear-gradient(135deg,rgba(57,39,125,.9),rgba(14,18,58,.96))] p-4 shadow-[0_24px_70px_rgba(0,0,0,.35)] sm:mt-5 sm:p-6"><div className="ranker-category-intro"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">{mode === "best" ? "Rank highest to lowest" : "Rank lowest to highest"}</p><h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{round.category.label}</h2><p className="mt-2 text-sm text-white/60">{round.category.description}</p></div><p className="mt-4 text-xs font-bold text-[#f6dc86]">Drag cards on desktop, or use the arrows on any device.</p>
        <div className="mt-4 grid gap-2">{order.map((nation, index) => { const correctIndex = correctOrder.indexOf(nation); const matches = submitted && index === correctIndex; return <article key={nation} draggable={!submitted} onDragStart={() => setDraggedNation(nation)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropNation(nation)} style={{ animationDelay: `${index * 55}ms` }} className={`ranker-nation-card flex min-w-0 items-center gap-2 rounded-2xl border p-3 transition ${submitted ? matches ? "border-emerald-300/35 bg-emerald-300/[0.12]" : "border-rose-300/30 bg-rose-300/[0.08]" : "border-white/10 bg-black/20 hover:border-violet-200/35"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black text-white/65">{index + 1}</span><span className="text-xl">{getNationFlag(nation)}</span><p className="min-w-0 flex-1 truncate text-sm font-black">{nation}</p>{submitted ? <span className="text-right text-xs font-black text-[#f6dc86]">#{correctIndex + 1}<span className="block text-[9px] font-bold text-white/45">{round.category.values[nation]}</span></span> : <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Move ${nation} up`} onClick={() => moveNation(nation, -1)} disabled={index === 0} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-sm font-black transition active:scale-95 disabled:opacity-25">↑</button><button type="button" aria-label={`Move ${nation} down`} onClick={() => moveNation(nation, 1)} disabled={index === order.length - 1} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-sm font-black transition active:scale-95 disabled:opacity-25">↓</button></div>}</article>; })}</div>
        {submitted ? <div className={`ranker-result mt-5 text-center ${perfect ? "ranker-perfect hot-take-confetti" : "ranker-partial"}`}><p className="text-4xl">{perfect ? "✓" : "↕"}</p><p className={`mt-1 text-3xl font-black ${perfect ? "text-emerald-200" : "text-[#f6dc86]"}`}>{perfect ? "Perfect ranking!" : `${roundScore} points`}</p><p className="mt-2 text-sm font-bold text-white/70">{perfect ? `Perfect streak: ${stats.streak}. Keep the run alive.` : "Your exact placements are shown on every card. Green cards were right."}</p><div className="mx-auto mt-4 grid max-w-md gap-2 sm:grid-cols-2"><button type="button" onClick={() => startRound()} className="min-h-12 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black">Next Challenge</button><button type="button" onClick={() => void share()} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/80">Share Score</button></div></div> : <button type="button" onClick={submit} className="mt-5 flex min-h-13 w-full items-center justify-center rounded-xl bg-[#d8b75b] px-4 text-sm font-black uppercase tracking-wider text-black transition hover:bg-[#f6dc86] active:scale-[.98]">Lock In Ranking</button>}
        {message ? <p className="mt-3 text-center text-xs font-bold text-[#f6dc86]">{message}</p> : null}
      </section>
    </div>
  </main>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-10 rounded-xl px-3 text-[9px] font-black uppercase tracking-wider sm:px-4 ${active ? "bg-[#d8b75b] text-black" : "text-white/60"}`}>{children}</button>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center"><p className="text-[8px] font-black uppercase tracking-wider text-white/40">{label}</p><p className="mt-1 text-xl font-black text-[#f6dc86]">{value}</p></div>;
}

function createRankerShareCard(stats: RankerStats, category: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable"));
  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, "#56369b");
  gradient.addColorStop(0.55, "#18103c");
  gradient.addColorStop(1, "#07100b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1080);
  context.textAlign = "center";
  context.fillStyle = "#f6dc86";
  context.font = "900 34px Arial";
  context.fillText("WORLD CUP GAMES", 540, 100);
  context.fillStyle = "#ffffff";
  context.font = "900 78px Arial";
  context.fillText("NATION RANKER", 540, 195);
  context.fillStyle = "rgba(255,255,255,.58)";
  context.font = "800 26px Arial";
  context.fillText(category.toUpperCase(), 540, 250);
  context.fillStyle = "#f6dc86";
  context.font = "900 180px Arial";
  context.fillText(String(stats.score), 540, 520);
  context.fillStyle = "rgba(255,255,255,.6)";
  context.font = "800 28px Arial";
  context.fillText("TOTAL SCORE", 540, 575);
  context.fillStyle = "rgba(255,255,255,.1)";
  context.fillRect(160, 680, 760, 2);
  context.fillStyle = "#f6dc86";
  context.font = "900 54px Arial";
  context.fillText(`${stats.bestStreak} PERFECT STREAK`, 540, 770);
  context.fillStyle = "rgba(255,255,255,.62)";
  context.font = "800 26px Arial";
  context.fillText("CAN YOU RANK THE NATIONS BETTER?", 540, 900);
  context.fillText("WORLD CUP GAMES", 540, 970);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create score card")), "image/png"));
}
