"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { NationFlag } from "../components/NationFlag";
import { WORLD_CUP_GROUPS } from "../data/groups";
import { WALL_CHART_FIXTURES } from "../lib/wall-chart";
import {
  calculateBestThirdPlacedTeams,
  calculateGroupTables,
  calculateKnockoutBracket,
  updateFixtureResult,
  type CalculatorScores,
} from "../lib/world-cup-calculator";

const STORAGE_KEY = "world-cup-calculator-scores-v1";

export default function WorldCupCalculatorPage() {
  const [scores, setScores] = useState<CalculatorScores>({});
  const [notice, setNotice] = useState("Local calculator mode");
  const loaded = useRef(false);
  const tables = useMemo(() => calculateGroupTables(scores), [scores]);
  const bestThirds = useMemo(() => calculateBestThirdPlacedTeams(tables), [tables]);
  const bracket = useMemo(() => calculateKnockoutBracket(tables), [tables]);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setScores(JSON.parse(saved) as CalculatorScores);
      } catch {
        setNotice("Could not restore local results");
      } finally {
        loaded.current = true;
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); } catch { setNotice("Results update locally for this session"); }
  }, [scores]);

  const updateScore = (fixtureId: string, side: "home" | "away", value: string) => {
    setScores((current) => updateFixtureResult(current, fixtureId, side, value));
    setNotice("Results saved on this device");
  };

  const reset = () => {
    if (!window.confirm("Reset every result in the calculator?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setScores({});
    setNotice("Calculator reset");
  };

  return <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">World Cup Games</p><h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-5xl">World Cup Calculator</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Enter scores, follow every group, and see the tournament picture update instantly.</p></div>
        <nav className="flex flex-wrap gap-2"><Link href="/" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/70">Home</Link><button type="button" onClick={reset} className="min-h-11 rounded-xl border border-rose-300/25 bg-rose-300/[0.08] px-4 text-xs font-black uppercase tracking-wider text-rose-100">Reset results</button></nav>
      </header>

      <section className="mt-5 rounded-[1.5rem] border border-[#d8b75b]/25 bg-[#d8b75b]/[0.06] p-4 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">Live-ready tournament view</p><h2 className="mt-1 text-2xl font-black">If it ended now...</h2><p className="mt-1 text-sm text-white/50">The provisional Round of 32 uses the current group order and top eight third-placed teams.</p></div><span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">{notice}</span></div></section>

      <section className="mt-8"><SectionHeading eyebrow="Current standings" title="Live Group Tables" description="Points, goal difference, then goals scored decide each group." /><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.keys(WORLD_CUP_GROUPS).map((group) => <GroupTable key={group} group={group} rows={tables[group]} />)}</div></section>

      <section className="mt-10"><SectionHeading eyebrow="Third-place race" title="Best Third-Placed Teams" description="The highlighted top eight currently complete the knockout field." /><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(tables).map(([group, rows]) => { const third = rows[2]; const qualified = bestThirds.some((team) => team.nation.code === third.nation.code); return <article key={group} className={`flex items-center justify-between rounded-xl border p-3 ${qualified ? "border-emerald-300/30 bg-emerald-300/[0.09]" : "border-white/10 bg-white/[0.035]"}`}><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-white/35">Group {group} · 3rd</p><p className="mt-1 truncate text-sm font-black"><NationFlag nation={third.nation.name} className="mr-1" />{third.nation.name}</p></div><div className="text-right"><p className="text-lg font-black text-[#f6dc86]">{third.points}</p><p className="text-[9px] font-black uppercase text-white/35">{qualified ? "Qualifying" : "Outside"}</p></div></article>; })}</div></section>

      <section className="mt-10"><SectionHeading eyebrow="Provisional knockout stage" title="If It Ended Now..." description="Group winners, runners-up and the best third-placed teams fill the official Round of 32 slots." /><div className="mt-4 grid gap-3 md:grid-cols-2">{bracket.map((fixture) => <article key={fixture.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">Round of 32 · Match {fixture.matchNumber}</p><div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-black"><span className="min-w-0 truncate text-right"><NationFlag nation={fixture.home.name} className="mr-1" />{fixture.home.name}</span><span className="text-white/30">vs</span><span className="min-w-0 truncate"><NationFlag nation={fixture.away.name} className="mr-1" />{fixture.away.name}</span></div></article>)}</div></section>

      <section className="mt-10 pb-8"><SectionHeading eyebrow="Enter results" title="Group Stage Fixtures" description="Every result updates the tables and provisional bracket immediately." /><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{WALL_CHART_FIXTURES.map((fixture) => <article key={fixture.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-white/35"><span>Match {fixture.matchNumber}</span><span className="text-[#d8b75b]">Group {fixture.group}</span></div><div className="mt-3 grid grid-cols-[minmax(0,1fr)_2.5rem_1rem_2.5rem_minmax(0,1fr)] items-center gap-1.5 text-xs font-black"><span className="truncate text-right">{fixture.home.name} <NationFlag nation={fixture.home.name} /></span><ScoreBox value={scores[fixture.id]?.home ?? ""} label={`${fixture.home.name} score`} onChange={(value) => updateScore(fixture.id, "home", value)} /><span className="text-center text-white/30">-</span><ScoreBox value={scores[fixture.id]?.away ?? ""} label={`${fixture.away.name} score`} onChange={(value) => updateScore(fixture.id, "away", value)} /><span className="truncate"><NationFlag nation={fixture.away.name} /> {fixture.away.name}</span></div></article>)}</div></section>
    </div>
  </main>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">{eyebrow}</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-white/45">{description}</p></div>; }

function GroupTable({ group, rows }: { group: string; rows: ReturnType<typeof calculateGroupTables>[string] }) { return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"><header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">Group {group}</p><span className="text-[9px] font-black uppercase tracking-wider text-white/35">Live table</span></header><div className="overflow-x-auto"><table className="w-full min-w-[31rem] text-xs"><thead className="text-[9px] font-black uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 text-left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.nation.code} className="border-t border-white/5"><td className="max-w-0 px-3 py-3 font-black"><span className="mr-2 text-white/35">{index + 1}</span><NationFlag nation={row.nation.name} className="mr-1" />{row.nation.name}</td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalsFor - row.goalsAgainst}</td><td className="font-black text-[#f6dc86]">{row.points}</td></tr>)}</tbody></table></div></article>; }

function ScoreBox({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) { return <input aria-label={label} type="number" min="0" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-white/15 bg-black/25 text-center text-sm font-black outline-none focus:border-[#d8b75b]" />; }
