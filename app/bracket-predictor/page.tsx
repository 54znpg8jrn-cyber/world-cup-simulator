"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChallengeFriendButton } from "../components/ChallengeFriendButton";
import { NationFlag } from "../components/NationFlag";
import {
  BRACKET_PREDICTOR_ROUND_OF_32,
  type PredictorTeam,
} from "../lib/games/bracket-predictor-data";
import {
  shareBracketRoundImage,
  shareWholeBracketImage,
  type BracketShareRound,
} from "../lib/share/bracketPredictorShare";

type RoundKey = "r32" | "r16" | "qf" | "sf" | "final";
type Picks = Record<string, string>;
type PredictorMatch = {
  id: string;
  index: number;
  teamA: PredictorTeam | null;
  teamB: PredictorTeam | null;
  winner: PredictorTeam | null;
};

const STORAGE_KEY = "world-cup-bracket-predictor-picks-v2";
const ROUND_ORDER: RoundKey[] = ["r32", "r16", "qf", "sf", "final"];
const ROUND_META: Record<RoundKey, { label: string; short: string; count: number }> = {
  r32: { label: "Round of 32", short: "R32", count: 16 },
  r16: { label: "Round of 16", short: "R16", count: 8 },
  qf: { label: "Quarter-Finals", short: "QF", count: 4 },
  sf: { label: "Semi-Finals", short: "SF", count: 2 },
  final: { label: "Final", short: "Final", count: 1 },
};

function matchId(round: RoundKey, index: number) {
  if (round === "r32") return BRACKET_PREDICTOR_ROUND_OF_32[index].id;
  if (round === "r16") return index < 4 ? `R16_L${index + 1}` : `R16_R${index - 3}`;
  if (round === "qf") return index < 2 ? `QF_L${index + 1}` : `QF_R${index - 1}`;
  if (round === "sf") return index === 0 ? "SF_L" : "SF_R";
  return "FINAL";
}

function buildBracket(picks: Picks): Record<RoundKey, PredictorMatch[]> {
  const rounds = {} as Record<RoundKey, PredictorMatch[]>;
  rounds.r32 = BRACKET_PREDICTOR_ROUND_OF_32.map((seed, index) => ({
    id: seed.id,
    index,
    teamA: seed.teamA,
    teamB: seed.teamB,
    winner: [seed.teamA, seed.teamB].find((team) => team.code === picks[seed.id]) ?? null,
  }));

  ROUND_ORDER.slice(1).forEach((round, roundIndex) => {
    const previous = rounds[ROUND_ORDER[roundIndex]];
    rounds[round] = Array.from({ length: ROUND_META[round].count }, (_, index) => {
      const id = matchId(round, index);
      const teamA = previous[index * 2]?.winner ?? null;
      const teamB = previous[index * 2 + 1]?.winner ?? null;
      return {
        id,
        index,
        teamA,
        teamB,
        winner: [teamA, teamB].find((team) => team?.code === picks[id]) ?? null,
      };
    });
  });
  return rounds;
}

function descendantIds(round: RoundKey, index: number) {
  const ids: string[] = [];
  let descendantIndex = index;
  for (let next = ROUND_ORDER.indexOf(round) + 1; next < ROUND_ORDER.length; next += 1) {
    descendantIndex = Math.floor(descendantIndex / 2);
    ids.push(matchId(ROUND_ORDER[next], descendantIndex));
  }
  return ids;
}

function TeamChoice({ team, selected, disabled, onSelect }: {
  team: PredictorTeam | null;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return <button type="button" disabled={disabled || !team} onClick={onSelect} className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition active:scale-[.98] disabled:cursor-default ${selected ? "border-[#f6dc86]/75 bg-[#d8b75b]/20 shadow-[0_0_22px_rgba(216,183,91,.18)]" : team ? "border-white/10 bg-white/[.055] hover:border-white/25 hover:bg-white/10" : "border-dashed border-white/8 bg-black/15 text-white/25"}`}>
    {team ? <NationFlag nation={team.flagNation} className="text-xl" /> : <span className="text-white/20">○</span>}
    <span className="min-w-0 flex-1 truncate text-[11px] font-black sm:text-xs">{team?.name ?? "Awaiting winner"}</span>
    {selected ? <span className="shrink-0 text-[#f6dc86]">✓</span> : null}
  </button>;
}

function MatchCard({ match, round, compact = false, onPick }: {
  match: PredictorMatch;
  round: RoundKey;
  compact?: boolean;
  onPick: (round: RoundKey, match: PredictorMatch, team: PredictorTeam) => void;
}) {
  return <article className={`bracket-predictor-match min-w-0 rounded-2xl border border-white/10 bg-[#0b1711]/95 ${compact ? "p-1.5" : "p-2.5"}`}>
    <p className="mb-1.5 px-1 text-[8px] font-black uppercase tracking-[.18em] text-white/30">{ROUND_META[round].short} · Match {match.index + 1}</p>
    <div className="grid gap-1.5">
      <TeamChoice team={match.teamA} selected={match.winner?.code === match.teamA?.code} disabled={!match.teamB} onSelect={() => match.teamA && onPick(round, match, match.teamA)} />
      <TeamChoice team={match.teamB} selected={match.winner?.code === match.teamB?.code} disabled={!match.teamA} onSelect={() => match.teamB && onPick(round, match, match.teamB)} />
    </div>
  </article>;
}

function RoundColumn({ round, matches, indices, onPick, reverse = false }: {
  round: RoundKey;
  matches: PredictorMatch[];
  indices: number[];
  onPick: (round: RoundKey, match: PredictorMatch, team: PredictorTeam) => void;
  reverse?: boolean;
}) {
  return <section className={`bracket-predictor-column ${reverse ? "bracket-predictor-column-right" : "bracket-predictor-column-left"}`}>
    <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[.15em] text-[#d8b75b]">{ROUND_META[round].short}</p>
    <div className="flex h-full flex-col justify-around gap-2">
      {indices.map((index) => <MatchCard key={matches[index].id} match={matches[index]} round={round} compact onPick={onPick} />)}
    </div>
  </section>;
}

function BracketShareButton({ label, disabled, onShare, className, onStatus }: {
  label: string;
  disabled: boolean;
  onShare: () => Promise<"shared" | "downloaded" | "copied">;
  className?: string;
  onStatus: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return <button type="button" disabled={disabled || busy} onClick={async () => {
    setBusy(true);
    try {
      const result = await onShare();
      onStatus(result === "shared" ? "Bracket image shared!" : result === "downloaded" ? "Bracket image downloaded!" : "Bracket link copied!");
    } finally {
      setBusy(false);
    }
  }} className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-35`}>
    {busy ? "Creating Image..." : label}
  </button>;
}

export default function BracketPredictorPage() {
  const [picks, setPicks] = useState<Picks>({});
  const [hydrated, setHydrated] = useState(false);
  const [activeRound, setActiveRound] = useState<RoundKey>("r32");
  const [message, setMessage] = useState("");
  const rounds = useMemo(() => buildBracket(picks), [picks]);
  const champion = rounds.final[0]?.winner ?? null;
  const url = typeof window === "undefined" ? "/bracket-predictor" : `${window.location.origin}/bracket-predictor`;

  useEffect(() => {
    const restoreSavedPicks = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setPicks(JSON.parse(saved) as Picks);
      } catch (error) {
        console.error("Could not restore bracket predictor picks", error);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreSavedPicks);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  }, [hydrated, picks]);

  const pickWinner = (round: RoundKey, match: PredictorMatch, team: PredictorTeam) => {
    setPicks((current) => {
      if (current[match.id] === team.code) return current;
      const next = { ...current, [match.id]: team.code };
      descendantIds(round, match.index).forEach((id) => delete next[id]);
      return next;
    });
    setMessage(`${team.name} advance${round === "final" ? " and are your champions!" : "!"}`);
  };

  const resetBracket = () => {
    if (Object.keys(picks).length && !window.confirm("Reset every bracket pick and start again?")) return;
    setPicks({});
    setActiveRound("r32");
    setMessage("Bracket reset.");
  };

  const completedRounds = ROUND_ORDER.filter((round) => rounds[round].every((match) => match.winner));
  const picksMade = Object.keys(picks).length;
  const shareRounds: BracketShareRound[] = ROUND_ORDER.map((round) => ({
    key: round,
    label: ROUND_META[round].label,
    matches: rounds[round],
  }));
  const shareRound = (round: RoundKey) => shareBracketRoundImage({
    round: shareRounds.find((entry) => entry.key === round)!,
    url,
  });

  return <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(.75rem,env(safe-area-inset-top))] text-white sm:px-5 lg:px-6">
    <div className="mx-auto w-full max-w-[100rem] min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex min-w-0 items-center gap-3"><Link href="/" className="flex min-h-11 shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-wider text-white/70 hover:bg-white/10">Home</Link><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#d8b75b]">World Cup Games</p><h1 className="truncate text-xl font-black tracking-[-.045em] sm:text-3xl">Bracket Predictor</h1></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-emerald-200">{picksMade}/31 picks</span><button type="button" onClick={resetBracket} className="min-h-11 rounded-full border border-white/10 bg-white/5 px-4 text-[9px] font-black uppercase tracking-wider text-white/60 hover:bg-white/10">Reset</button></div>
      </header>

      <section className="relative mt-4 overflow-hidden rounded-[1.75rem] border border-[#d8b75b]/20 bg-[radial-gradient(circle_at_50%_0%,rgba(216,183,91,.15),transparent_40%),linear-gradient(135deg,rgba(13,49,32,.95),rgba(4,10,7,.98))] p-4 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-5"><div className="max-w-3xl"><span className="premium-game-badge">Predict every winner</span><h2 className="mt-4 text-3xl font-black uppercase leading-[.92] tracking-[-.05em] sm:text-5xl">Your road to<br /><span className="text-gradient">World Cup glory</span></h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/58">Tap a team to send them through. Change any pick and that path updates automatically.</p></div></section>

      <div className="mt-4 grid grid-cols-5 gap-1.5 lg:hidden">
        {ROUND_ORDER.map((round) => { const complete = completedRounds.includes(round); return <button key={round} type="button" onClick={() => setActiveRound(round)} className={`min-h-12 rounded-xl border px-1 text-[9px] font-black uppercase tracking-wide ${activeRound === round ? "border-[#d8b75b]/65 bg-[#d8b75b]/18 text-[#f6dc86]" : complete ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/45"}`}>{ROUND_META[round].short}{complete ? " ✓" : ""}</button>; })}
      </div>

      <section className="mt-3 lg:hidden">
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#d8b75b]">Current stage</p><h2 className="text-2xl font-black">{ROUND_META[activeRound].label}</h2></div><span className="text-[10px] font-black text-white/35">{rounds[activeRound].filter((match) => match.winner).length}/{rounds[activeRound].length}</span></div>
        <div className="grid gap-2 min-[560px]:grid-cols-2">{rounds[activeRound].map((match) => <MatchCard key={match.id} match={match} round={activeRound} onPick={pickWinner} />)}</div>
      </section>

      <section className="mt-5 hidden min-w-0 lg:block"><div className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-3"><div className="bracket-predictor-desktop mx-auto grid min-h-[900px] min-w-[1420px] grid-cols-[1.22fr_1.08fr_.98fr_.9fr_1.12fr_.9fr_.98fr_1.08fr_1.22fr] gap-2 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <RoundColumn round="r32" matches={rounds.r32} indices={[0,1,2,3,4,5,6,7]} onPick={pickWinner} /><RoundColumn round="r16" matches={rounds.r16} indices={[0,1,2,3]} onPick={pickWinner} /><RoundColumn round="qf" matches={rounds.qf} indices={[0,1]} onPick={pickWinner} /><RoundColumn round="sf" matches={rounds.sf} indices={[0]} onPick={pickWinner} />
        <div className="flex min-w-0 flex-col items-center justify-center px-1"><span className={`text-6xl ${champion ? "champion-trophy" : "opacity-30"}`}>🏆</span><p className="mt-3 text-center text-[9px] font-black uppercase tracking-[.2em] text-[#d8b75b]">World Cup Final</p><div className="mt-3 w-full"><MatchCard match={rounds.final[0]} round="final" compact onPick={pickWinner} /></div><div className={`mt-5 w-full rounded-2xl border p-3 text-center ${champion ? "champion-glow border-[#d8b75b]/50 bg-[#d8b75b]/15" : "border-white/8 bg-white/[.03]"}`}><p className="text-[8px] font-black uppercase tracking-[.2em] text-white/35">Champion</p>{champion ? <><NationFlag nation={champion.flagNation} className="mt-2 text-4xl" /><p className="mt-2 truncate text-base font-black">{champion.name}</p></> : <p className="mt-2 text-xs font-bold text-white/25">Make 31 picks</p>}</div></div>
        <RoundColumn round="sf" matches={rounds.sf} indices={[1]} onPick={pickWinner} reverse /><RoundColumn round="qf" matches={rounds.qf} indices={[2,3]} onPick={pickWinner} reverse /><RoundColumn round="r16" matches={rounds.r16} indices={[4,5,6,7]} onPick={pickWinner} reverse /><RoundColumn round="r32" matches={rounds.r32} indices={[8,9,10,11,12,13,14,15]} onPick={pickWinner} reverse />
      </div></div></section>

      <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[.035] p-4">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#d8b75b]">Share your predictions</p><h2 className="text-xl font-black">Bracket graphics</h2></div><p className="text-[10px] font-bold text-white/35">Buttons unlock when each round is complete.</p></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROUND_ORDER.map((round) => <BracketShareButton key={round} label={`Share ${ROUND_META[round].label}`} disabled={!completedRounds.includes(round)} onShare={() => shareRound(round)} onStatus={setMessage} className="min-h-12 rounded-xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-3 text-[10px] font-black uppercase tracking-wider text-[#f6dc86]" />)}
          <BracketShareButton label="Share Whole Bracket" disabled={!champion} onShare={() => shareWholeBracketImage({ rounds: shareRounds, url })} onStatus={setMessage} className="min-h-12 rounded-xl bg-[#d8b75b] px-3 text-[10px] font-black uppercase tracking-wider text-black shadow-[0_0_28px_rgba(216,183,91,.16)]" />
        </div>
      </section>

      {champion ? <section className="champion-glow mt-5 overflow-hidden rounded-[2rem] border border-[#d8b75b]/45 bg-[radial-gradient(circle_at_50%_0%,rgba(246,220,134,.25),transparent_48%),linear-gradient(135deg,#183d28,#07110b)] p-6 text-center sm:p-10"><div className="champion-confetti mx-auto max-w-2xl"><span className="champion-trophy text-7xl">🏆</span><p className="mt-4 text-[10px] font-black uppercase tracking-[.35em] text-[#f6dc86]">Your World Cup champions</p><NationFlag nation={champion.flagNation} className="mt-5 text-7xl" /><h2 className="mt-3 text-4xl font-black uppercase tracking-[-.05em] sm:text-6xl">{champion.name}</h2><div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2"><BracketShareButton label="Share Final" disabled={false} onShare={() => shareRound("final")} onStatus={setMessage} className="min-h-12 rounded-2xl bg-[#d8b75b] px-4 text-xs font-black uppercase tracking-wider text-black" /><ChallengeFriendButton title="World Cup Bracket Predictor" text="Can you predict the World Cup bracket better than me?" url={url} onStatus={setMessage} className="min-h-12 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black uppercase tracking-wider text-white" /><button type="button" onClick={resetBracket} className="min-h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-xs font-black uppercase tracking-wider text-white/70">Reset Bracket</button><Link href="/" className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 text-xs font-black uppercase tracking-wider text-white/70">Home</Link></div></div></section> : null}
      {!champion ? <div className="mt-5 grid gap-2 sm:grid-cols-2"><ChallengeFriendButton title="World Cup Bracket Predictor" text="Can you predict the World Cup bracket better than me?" url={url} onStatus={setMessage} className="min-h-12 rounded-2xl border border-[#d8b75b]/30 bg-[#d8b75b]/10 px-4 text-xs font-black uppercase tracking-wider text-[#f6dc86]" /><Link href="/" className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/65">Home</Link></div> : null}
      {message ? <p role="status" className="mt-3 text-center text-xs font-bold text-emerald-200">{message}</p> : null}
    </div>
  </main>;
}
