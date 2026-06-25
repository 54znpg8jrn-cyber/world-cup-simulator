"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChallengeFriendButton } from "../components/ChallengeFriendButton";
import { ShareResultButton } from "../components/ShareResultButton";
import { HOT_TAKES, type HotTake, type HotTakeCategory } from "../lib/games/hot-takes-data";
import type { SquareCarouselSlide } from "../lib/share/createSquareCarousel";

type Vote = "agree" | "disagree";
type Answer = { take: HotTake; vote: Vote; communityAgreement: number };
type FanDna = { title: string; description: string; category?: HotTakeCategory };

const ROUND_LENGTH = 10;
const HISTORY_KEY = "world-cup-hot-takes-recent-v1";
const SWIPE_THRESHOLD = 76;

const DNA: Record<string, FanDna> = {
  Messi: { title: "Messi Loyalist", description: "You trust football's greatest artist when the pressure peaks.", category: "Messi" },
  Ronaldo: { title: "Ronaldo Defender", description: "You respect the obsession, the longevity, and the biggest of moments.", category: "Ronaldo" },
  Neymar: { title: "Football Romantic", description: "Flair, freedom, and the joy of the game matter deeply to you.", category: "Neymar" },
  Mbappé: { title: "Big Game Believer", description: "You back decisive players when the lights are brightest.", category: "Mbappé" },
  Yamal: { title: "Modern Football Fan", description: "You have one eye on football's future and another on its next superstar.", category: "Yamal" },
  "La Masia": { title: "La Masia Believer", description: "You believe a shared football education can beat an expensive collection of stars.", category: "La Masia" },
  Managers: { title: "Tactical Nerd", description: "You see patterns, systems, and the tiny decisions that shape huge nights.", category: "Managers" },
  Legends: { title: "Nostalgia Merchant", description: "The old matches, iconic shirts, and unrepeatable peaks still mean something to you.", category: "Legends" },
  "National Teams": { title: "Trophy Hunter", description: "For you, football legacy is forged in knockout nights and silverware.", category: "National Teams" },
  Underrated: { title: "Underdog Believer", description: "You notice the players and teams the loudest conversations miss.", category: "Underrated" },
  default: { title: "Chaos Merchant", description: "You chose the spicy route through the debate. Football needs that energy." },
};

function randomize<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveHistory(ids: string[]) {
  try {
    const next = [...readHistory(), ...ids].slice(-100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // The game still works when private browsing blocks local storage.
  }
}

function selectDeck(recent: string[]) {
  const unseen = HOT_TAKES.filter((take) => !recent.includes(take.id));
  const pool = unseen.length >= ROUND_LENGTH ? unseen : HOT_TAKES;
  const selected: HotTake[] = [];
  const categoryCounts = new Map<HotTakeCategory, number>();
  const addFrom = (items: HotTake[], count: number) => {
    for (const take of randomize(items)) {
      if (selected.length >= ROUND_LENGTH || count <= 0) break;
      const countForCategory = categoryCounts.get(take.category) ?? 0;
      if (selected.some((entry) => entry.id === take.id) || countForCategory >= 2) continue;
      selected.push(take);
      categoryCounts.set(take.category, countForCategory + 1);
      count -= 1;
    }
  };

  addFrom(pool.filter((take) => take.controversialScore < 50), 2);
  addFrom(pool.filter((take) => take.controversialScore >= 50 && take.controversialScore < 75), 6);
  addFrom(pool.filter((take) => take.controversialScore >= 75), 2);
  addFrom(pool, ROUND_LENGTH - selected.length);
  return randomize(selected).slice(0, ROUND_LENGTH);
}

function getFanDna(answers: Answer[]): FanDna {
  const categoryPoints = answers.reduce<Record<string, number>>((points, answer) => {
    const value = answer.vote === "agree" ? 2 : 1;
    points[answer.take.category] = (points[answer.take.category] ?? 0) + value;
    return points;
  }, {});
  const winningCategory = Object.entries(categoryPoints).sort((a, b) => b[1] - a[1])[0]?.[0];
  return DNA[winningCategory ?? "default"] ?? DNA.default;
}

export default function HotTakesPage() {
  const [deck, setDeck] = useState<HotTake[]>(() => HOT_TAKES.slice(0, ROUND_LENGTH));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [revealedVote, setRevealedVote] = useState<Vote | null>(null);
  const [exitVote, setExitVote] = useState<Vote | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const next = selectDeck(readHistory());
      saveHistory(next.map((take) => take.id));
      setDeck(next);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const take = deck[index];
  const complete = index >= deck.length;
  const agreementRate = answers.length
    ? Math.round(answers.reduce((total, answer) => total + answer.communityAgreement, 0) / answers.length)
    : 0;
  const controversyScore = answers.length
    ? Math.round(answers.reduce((total, answer) => total + (100 - answer.communityAgreement), 0) / answers.length)
    : 0;
  const fanDna = useMemo(() => getFanDna(answers), [answers]);
  const mostControversial = useMemo(
    () => [...answers].sort((a, b) => a.communityAgreement - b.communityAgreement)[0],
    [answers],
  );

  const vote = (nextVote: Vote) => {
    if (!take || revealedVote || exitVote) return;
    const communityAgreement = nextVote === "agree" ? take.agreePercentage : take.disagreePercentage;
    setExitVote(nextVote);
    setIsDragging(false);
    setDragX(nextVote === "agree" ? 1600 : -1600);
    window.setTimeout(() => {
      setAnswers((current) => [...current, { take, vote: nextVote, communityAgreement }]);
      setRevealedVote(nextVote);
      setExitVote(null);
    }, 280);
  };

  const nextTake = () => {
    if (!revealedVote) return;
    setIndex((current) => current + 1);
    setRevealedVote(null);
    setExitVote(null);
    setDragX(0);
  };

  const startNewDeck = () => {
    const next = selectDeck(readHistory());
    saveHistory(next.map((take) => take.id));
    setDeck(next);
    setIndex(0);
    setAnswers([]);
    setRevealedVote(null);
    setExitVote(null);
    setDragX(0);
    setMessage("");
  };

  const overlayStrength = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const cardStyle = { transform: `translate3d(${dragX}px, ${exitVote ? "-4vh" : "0"}, 0) rotate(${exitVote ? exitVote === "agree" ? 24 : -24 : dragX / 22}deg)` };
  const selectedPercentage = revealedVote === "agree" ? take?.agreePercentage : take?.disagreePercentage;
  const otherPercentage = revealedVote === "agree" ? take?.disagreePercentage : take?.agreePercentage;
  const selectedLabel = revealedVote === "agree" ? "agree" : "disagree";
  const otherLabel = revealedVote === "agree" ? "disagree" : "agree";
  const crowdVerdict = selectedPercentage === otherPercentage
    ? "Fans are split."
    : (selectedPercentage ?? 0) > (otherPercentage ?? 0)
      ? "You are with the majority."
      : "You are in the minority.";

  return <main className="stadium-bg hot-takes-playfield relative flex h-dvh w-full max-w-full overflow-hidden overscroll-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:p-5">
    <div className="mx-auto flex h-full w-full max-w-6xl min-w-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex h-10 items-center rounded-full border border-white/10 bg-black/20 px-4 text-[10px] font-black uppercase tracking-wider text-white/65 transition hover:bg-white/5 active:scale-95">Home</Link>
        <div className="min-w-0 text-center"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-rose-200">Community debate</p><h1 className="truncate text-lg font-black uppercase tracking-[-0.04em] sm:text-2xl">Hot Takes</h1></div>
        <span className="flex h-10 min-w-11 items-center justify-center rounded-full border border-[#d8b75b]/20 bg-[#d8b75b]/10 px-3 text-xs font-black text-[#f6dc86]">{Math.min(index + 1, ROUND_LENGTH)}/{ROUND_LENGTH}</span>
      </header>

      {complete ? <FanDnaResult fanDna={fanDna} agreementRate={agreementRate} controversyScore={controversyScore} mostControversial={mostControversial} message={message} onStatus={setMessage} onNext={startNewDeck} /> : take ? <section className="flex min-h-0 flex-1 flex-col items-center justify-center py-3 sm:py-4">
        <div className="relative w-full max-w-[34rem]">
          {revealedVote ? <HotTakeVoteResult vote={revealedVote} selectedPercentage={selectedPercentage ?? 0} otherPercentage={otherPercentage ?? 0} selectedLabel={selectedLabel} otherLabel={otherLabel} verdict={crowdVerdict} onNext={nextTake} finalTake={index + 1 === ROUND_LENGTH} /> : <div
            onPointerDown={(event) => { if (!exitVote) { pointerStart.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); setIsDragging(true); } }}
            onPointerMove={(event) => { if (pointerStart.current !== null && !exitVote) setDragX(event.clientX - pointerStart.current.x); }}
            onPointerUp={(event) => { const distance = pointerStart.current === null ? 0 : event.clientX - pointerStart.current.x; pointerStart.current = null; setIsDragging(false); if (distance >= SWIPE_THRESHOLD) vote("agree"); else if (distance <= -SWIPE_THRESHOLD) vote("disagree"); else setDragX(0); }}
            onPointerCancel={() => { pointerStart.current = null; setIsDragging(false); setDragX(0); }}
            style={cardStyle}
            className={`relative aspect-square w-full touch-none select-none overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1710]/95 p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,.4)] ${isDragging ? "cursor-grabbing transition-none" : "cursor-grab transition-transform duration-300"} ${exitVote ? "pointer-events-none hot-take-swipe-exit opacity-0" : ""}`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-300 via-[#d8b75b] to-emerald-300" />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center justify-center bg-rose-400/20 transition-opacity" style={{ opacity: dragX < 0 ? overlayStrength : 0 }}><span className="rounded-full border border-rose-200/60 px-4 py-2 text-lg font-black tracking-widest text-rose-100">DISAGREE</span></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-center bg-emerald-400/20 transition-opacity" style={{ opacity: dragX > 0 ? overlayStrength : 0 }}><span className="rounded-full border border-emerald-200/60 px-4 py-2 text-lg font-black tracking-widest text-emerald-100">AGREE</span></div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center"><p className="mb-6 text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b75b]">Hot take</p><h2 className="max-w-[26rem] text-3xl font-black leading-[1.04] tracking-[-0.055em] sm:text-5xl">{take.text}</h2><p className="mt-8 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Swipe or choose your side</p></div>
          </div>}
        </div>
        {!exitVote && !revealedVote ? <div className="mt-3 grid w-full max-w-[34rem] grid-cols-2 gap-3"><button type="button" onClick={() => vote("disagree")} className="min-h-14 rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-4 text-sm font-black uppercase tracking-wider text-rose-100 transition hover:bg-rose-300/[0.15] active:scale-[.97]">← Disagree</button><button type="button" onClick={() => vote("agree")} className="min-h-14 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.1] px-4 text-sm font-black uppercase tracking-wider text-emerald-100 transition hover:bg-emerald-300/[0.17] active:scale-[.97]">Agree →</button></div> : null}
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/25">World Cup Games</p>
      </section> : null}
    </div>
  </main>;
}

function HotTakeVoteResult({ vote, selectedPercentage, otherPercentage, selectedLabel, otherLabel, verdict, onNext, finalTake }: { vote: Vote; selectedPercentage: number; otherPercentage: number; selectedLabel: string; otherLabel: string; verdict: string; onNext: () => void; finalTake: boolean }) {
  const agreed = vote === "agree";
  return <div onClick={onNext} className={`hot-take-result-card hot-take-reveal aspect-square w-full cursor-pointer rounded-[2rem] border p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,.4)] ${agreed ? "border-emerald-300/45 bg-emerald-400/[0.12]" : "border-rose-300/45 bg-rose-400/[0.12]"}`}><div className="flex h-full flex-col items-center justify-center"><p className={`text-xs font-black uppercase tracking-[0.24em] ${agreed ? "text-emerald-200" : "text-rose-200"}`}>{agreed ? "You agreed" : "You disagreed"}</p><p className="mt-4 text-7xl font-black text-[#f6dc86] sm:text-8xl">{selectedPercentage}%</p><div className="mt-3 space-y-1 text-sm font-black"><p className={agreed ? "text-emerald-100" : "text-rose-100"}>{selectedPercentage}% {selectedLabel}</p><p className="text-white/55">{otherPercentage}% {otherLabel}</p></div><div className="mt-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white/80">{verdict}</div><button type="button" onClick={(event) => { event.stopPropagation(); onNext(); }} className="mt-7 min-h-14 w-full rounded-2xl bg-[#d8b75b] px-4 text-sm font-black uppercase tracking-wider text-black transition hover:bg-[#f6dc86] active:scale-[.97]">{finalTake ? "See Your Fan DNA" : "Next Take"}</button><p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Tap anywhere to continue</p></div></div>;
}

function FanDnaResult({ fanDna, agreementRate, controversyScore, mostControversial, message, onStatus, onNext }: { fanDna: FanDna; agreementRate: number; controversyScore: number; mostControversial?: Answer; message: string; onStatus: (message: string) => void; onNext: () => void }) {
  const percentile = Math.max(1, Math.round(100 - controversyScore));
  const url = typeof window === "undefined" ? "/hot-takes" : `${window.location.origin}/hot-takes`;
  const take = mostControversial?.take;
  const votePercentage = mostControversial?.communityAgreement ?? agreementRate;
  const agreePercentage = take?.agreePercentage ?? agreementRate;
  const disagreePercentage = take?.disagreePercentage ?? Math.max(0, 100 - agreementRate);
  const slides: [SquareCarouselSlide, SquareCarouselSlide] = [
    {
      kicker: "Hot Takes",
      title: `Only ${votePercentage}% agreed`,
      subtitle: fanDna.title,
      body: ["Football opinions, measured in public."],
      accent: votePercentage < 50 ? "rose" : "gold",
    },
    {
      kicker: "World Cup Games",
      title: take?.text ?? "My Hot Takes result",
      stats: [
        { label: "Agree", value: `${agreePercentage}%`, highlight: mostControversial?.vote === "agree" },
        { label: "Disagree", value: `${disagreePercentage}%`, highlight: mostControversial?.vote === "disagree" },
      ],
      body: [`Fan DNA: ${fanDna.title}`, `Controversy: ${controversyScore}/100`],
      accent: "gold",
    },
  ];
  const shareText = `My World Cup Hot Takes DNA: ${fanDna.title}. I agreed with ${agreementRate}% of fans.`;
  return <section className="flex min-h-0 flex-1 items-center justify-center py-3"><div className={`screen-enter w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#d8b75b]/25 bg-[#0a1710]/95 p-6 text-center shadow-2xl sm:p-9 ${controversyScore >= 70 ? "hot-take-confetti" : ""}`}><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b75b]">Your Fan DNA</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-gradient sm:text-6xl">{fanDna.title}</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">{fanDna.description}</p><div className="mt-6 grid grid-cols-2 gap-3"><ResultStat value={`${agreementRate}%`} label="Agree with fans" /><ResultStat value={`${controversyScore}/100`} label="Controversy score" /></div><p className="mt-3 text-[10px] font-black uppercase tracking-[0.17em] text-[#f6dc86]">Top {percentile}% most controversial fans</p>{mostControversial ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-left"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Most controversial answer</p><p className="mt-2 text-sm font-black leading-5">“{mostControversial.take.text}”</p><p className="mt-2 text-xs font-bold text-rose-200">You {mostControversial.vote}d with {mostControversial.communityAgreement}% of fans.</p></div> : null}<div className="mt-6 grid gap-2 sm:grid-cols-2"><ChallengeFriendButton title="World Cup Games: Hot Takes" url={url} onStatus={onStatus} className="min-h-12 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 text-xs font-black uppercase tracking-wider text-emerald-100 transition hover:bg-emerald-300/[0.15] active:scale-[.98]" /><ShareResultButton title="World Cup Games: Hot Takes" text={shareText} url={url} slides={slides} filenamePrefix="world-cup-hot-takes" fallbackText={`${shareText}\n${url}`} onStatus={onStatus} className="min-h-12 rounded-xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86] transition hover:bg-[#d8b75b]/15 active:scale-[.98]" /><button type="button" onClick={onNext} className="min-h-12 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#f6dc86] active:scale-[.98]">Next 10 Takes</button><Link href="/" className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/75 transition hover:bg-white/10">Home</Link></div>{message ? <p className="mt-3 text-xs font-bold text-[#f6dc86]">{message}</p> : null}</div></section>;
}

function ResultStat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-black text-[#f6dc86]">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wider text-white/40">{label}</p></div>;
}
