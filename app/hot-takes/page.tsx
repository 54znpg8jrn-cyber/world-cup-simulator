"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HOT_TAKES, type HotTake, type HotTakeCategory } from "../lib/games/hot-takes-data";

type Vote = "agree" | "disagree";
type Answer = { take: HotTake; vote: Vote; communityAgreement: number };

const ROUND_LENGTH = 20;

const DNA: Record<HotTakeCategory, { title: string; description: string }> = {
  messi: { title: "Messi Loyalist", description: "You back football's greatest artist when the pressure peaks." },
  modern: { title: "Modern Fan", description: "You believe football keeps evolving, and you are here for what comes next." },
  legends: { title: "Football Romantic", description: "You carry the great tournaments, iconic shirts, and old stories with you." },
  nations: { title: "Trophy Hunter", description: "For you, legacy is written in knockout nights and silverware." },
  underdogs: { title: "Underdog Believer", description: "You always leave room for a surprise run and a new football story." },
  chaos: { title: "Chaos Merchant", description: "You picked the spiciest route through the debate. Football needs that energy." },
};

function shuffledDeck() {
  return [...HOT_TAKES]
    .sort(() => Math.random() - 0.5)
    .slice(0, ROUND_LENGTH);
}

export default function HotTakesPage() {
  const [deck, setDeck] = useState<HotTake[]>(() => HOT_TAKES.slice(0, ROUND_LENGTH));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [revealedVote, setRevealedVote] = useState<Vote | null>(null);
  const [exiting, setExiting] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<number | null>(null);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const take = deck[index];
  const complete = deck.length > 0 && index >= deck.length;
  const agreementRate = answers.length
    ? Math.round(answers.reduce((total, answer) => total + answer.communityAgreement, 0) / answers.length)
    : 0;
  const fanDna = useMemo(() => {
    const counts = answers.reduce<Record<HotTakeCategory, number>>((total, answer) => {
      total[answer.take.category] += 1;
      return total;
    }, { messi: 0, modern: 0, legends: 0, nations: 0, underdogs: 0, chaos: 0 });
    const category = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "chaos") as HotTakeCategory;
    return DNA[category];
  }, [answers]);
  const controversial = useMemo(
    () => [...answers].sort((a, b) => Math.abs(a.take.agreePercentage - 50) - Math.abs(b.take.agreePercentage - 50)).slice(0, 3),
    [answers],
  );

  const vote = (nextVote: Vote) => {
    if (!take || revealedVote) return;
    const communityAgreement = nextVote === "agree" ? take.agreePercentage : 100 - take.agreePercentage;
    setAnswers((current) => [...current, { take, vote: nextVote, communityAgreement }]);
    setRevealedVote(nextVote);
    setExiting(true);
    timer.current = window.setTimeout(() => {
      setIndex((current) => current + 1);
      setRevealedVote(null);
      setExiting(false);
    }, 800);
  };

  const playAgain = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setDeck(shuffledDeck());
    setIndex(0);
    setAnswers([]);
    setRevealedVote(null);
    setExiting(false);
    setMessage("");
  };

  const shareResult = async () => {
    const url = `${window.location.origin}/hot-takes`;
    const text = `My World Cup Hot Takes DNA: ${fanDna.title}. I agreed with the community ${agreementRate}% of the time. What's yours?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "World Cup Hot Takes", text, url });
        setMessage("Fan DNA shared!");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Fan DNA copied!");
    } catch (error) {
      console.error("Hot Takes share failed", error);
      setMessage("Could not share right now.");
    }
  };

  return (
    <main className="stadium-bg relative flex h-dvh w-full max-w-full overflow-hidden px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:p-5">
      <div className="mx-auto flex h-full w-full max-w-5xl min-w-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <Link href="/" className="flex h-10 items-center rounded-full border border-white/10 bg-black/20 px-4 text-[10px] font-black uppercase tracking-wider text-white/65">Home</Link>
          <div className="min-w-0 text-center"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-rose-200">Community debate</p><h1 className="truncate text-lg font-black uppercase tracking-[-0.04em] sm:text-2xl">World Cup Hot Takes</h1></div>
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[#d8b75b]/20 bg-[#d8b75b]/10 px-3 text-xs font-black text-[#f6dc86]">{Math.min(index + 1, ROUND_LENGTH)}/{ROUND_LENGTH}</span>
        </header>

        {complete ? (
          <FanDnaResult dna={fanDna} agreementRate={agreementRate} controversial={controversial} message={message} onShare={() => void shareResult()} onReplay={playAgain} />
        ) : take ? (
          <section className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
            <div
              onPointerDown={(event) => { pointerStart.current = event.clientX; }}
              onPointerUp={(event) => {
                if (pointerStart.current === null) return;
                const distance = event.clientX - pointerStart.current;
                pointerStart.current = null;
                if (distance > 60) vote("agree");
                if (distance < -60) vote("disagree");
              }}
              className={`relative flex w-full max-w-3xl flex-1 cursor-grab touch-pan-y select-none flex-col items-center justify-center overflow-hidden rounded-[2rem] border p-7 text-center shadow-2xl transition duration-500 active:cursor-grabbing sm:p-12 ${revealedVote === "agree" ? "border-emerald-300/50 bg-emerald-300/[0.12]" : revealedVote === "disagree" ? "border-rose-300/50 bg-rose-300/[0.1]" : "border-white/10 bg-[#0a1710]/90"} ${exiting ? "scale-[0.97] opacity-80" : "scale-100 opacity-100"}`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-300 via-[#d8b75b] to-emerald-300" />
              {revealedVote ? <div className="screen-enter"><p className={`text-xs font-black uppercase tracking-[0.24em] ${revealedVote === "agree" ? "text-emerald-200" : "text-rose-200"}`}>{revealedVote === "agree" ? "You agree" : "You disagree"}</p><p className="mt-3 text-5xl font-black text-[#f6dc86] sm:text-7xl">{revealedVote === "agree" ? take.agreePercentage : 100 - take.agreePercentage}%</p><p className="mt-2 text-sm font-bold text-white/55">of fans chose the same</p></div> : <><p className="mb-6 text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b75b]">The take</p><h2 className="max-w-2xl text-3xl font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">{take.text}</h2><p className="mt-8 text-xs font-bold uppercase tracking-wider text-white/35">Swipe right to agree · left to disagree</p></>}
            </div>
            <div className="mt-3 grid w-full max-w-3xl grid-cols-2 gap-3">
              <button type="button" onClick={() => vote("disagree")} disabled={Boolean(revealedVote)} className="min-h-14 rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-4 text-sm font-black uppercase tracking-wider text-rose-100 transition hover:bg-rose-300/[0.15] disabled:opacity-50">← Disagree</button>
              <button type="button" onClick={() => vote("agree")} disabled={Boolean(revealedVote)} className="min-h-14 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.1] px-4 text-sm font-black uppercase tracking-wider text-emerald-100 transition hover:bg-emerald-300/[0.17] disabled:opacity-50">Agree →</button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function FanDnaResult({ dna, agreementRate, controversial, message, onShare, onReplay }: { dna: { title: string; description: string }; agreementRate: number; controversial: Answer[]; message: string; onShare: () => void; onReplay: () => void }) {
  return <section className="flex min-h-0 flex-1 items-center justify-center py-4"><div className="screen-enter w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[#d8b75b]/25 bg-[#0a1710]/95 p-6 text-center shadow-2xl sm:p-9"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#d8b75b]">Your Fan DNA</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-gradient sm:text-6xl">{dna.title}</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">{dna.description}</p><div className="mx-auto mt-6 max-w-xs rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-4xl font-black text-[#f6dc86]">{agreementRate}%</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/40">Agreement with the community</p></div><div className="mt-6 text-left"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Your most controversial calls</p><div className="mt-3 grid gap-2">{controversial.map((answer) => <div key={answer.take.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs font-bold text-white/70"><span className={answer.vote === "agree" ? "text-emerald-200" : "text-rose-200"}>{answer.vote === "agree" ? "Agreed" : "Disagreed"}</span> · {answer.take.text}</div>)}</div></div><div className="mt-6 grid gap-2 sm:grid-cols-3"><button type="button" onClick={onShare} className="min-h-12 rounded-xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86]">Share Result</button><button type="button" onClick={onReplay} className="min-h-12 rounded-xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black">Play Again</button><Link href="/" className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/75">Home</Link></div>{message ? <p className="mt-3 text-xs font-bold text-[#f6dc86]">{message}</p> : null}</div></section>;
}
