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
  getFallbackCalculatorScores,
  updateFixtureResult,
  type CalculatorScores,
} from "../lib/world-cup-calculator";

const STORAGE_KEY = "world-cup-calculator-scores-v1";

export default function WorldCupCalculatorPage() {
  const [liveScores, setLiveScores] = useState<CalculatorScores>(() => getFallbackCalculatorScores());
  const [manualScores, setManualScores] = useState<CalculatorScores>({});
  const [notice, setNotice] = useState("Loading live results...");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState("");
  const [dataStatus, setDataStatus] = useState<"live" | "cached" | "fallback" | "api-error">("fallback");
  const [liveFixtureIds, setLiveFixtureIds] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const loaded = useRef(false);
  const scores = useMemo(() => ({ ...liveScores, ...manualScores }), [liveScores, manualScores]);
  const tables = useMemo(() => calculateGroupTables(scores), [scores]);
  const bestThirds = useMemo(() => calculateBestThirdPlacedTeams(tables), [tables]);
  const bracket = useMemo(() => calculateKnockoutBracket(tables), [tables]);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setManualScores(JSON.parse(saved) as CalculatorScores);
      } catch {
        setNotice("Could not restore local results");
      } finally {
        loaded.current = true;
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    let active = true;
    const loadLiveResults = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/world-cup-live", { cache: "no-store" });
        if (!response.ok) throw new Error("Live results request failed");
        const data = await response.json() as { status?: "live" | "fallback" | "api-error"; valid?: boolean; results?: CalculatorScores; liveFixtureIds?: string[]; updatedAt?: string };
        if (!active) return;
        const hasValidScores = Boolean(data.valid && data.results && Object.values(data.results).some((score) => score.home !== "" && score.away !== ""));
        if (hasValidScores) {
          setLiveScores((current) => ({ ...current, ...data.results }));
          setDataStatus(data.status === "live" ? "live" : "fallback");
          setLiveFixtureIds(data.liveFixtureIds ?? []);
          setLastUpdated(data.updatedAt ?? new Date().toISOString());
          setNotice(data.status === "live" ? "Live API connected" : "Live API not connected — fallback data");
          setLiveError("");
        } else {
          console.error("World Cup Calculator ignored invalid live payload", data);
          setDataStatus(data.status === "api-error" ? "api-error" : "cached");
          setNotice("Keeping last valid results");
          setLiveError(data.status === "api-error" ? "Live API failed. Standings are using the last valid result set." : "Live API returned incomplete data. Standings are using the last valid result set.");
        }
      } catch (error) {
        console.error("World Cup Calculator live data failed", error);
        if (!active) return;
        setDataStatus("api-error");
        setLiveError("Live results are temporarily unavailable. Standings are using the last valid result set.");
        setNotice("Live data unavailable");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadLiveResults();
    const interval = window.setInterval(() => void loadLiveResults(), 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(manualScores)); } catch { setNotice("Manual overrides update for this session"); }
  }, [manualScores]);

  const updateScore = (fixtureId: string, side: "home" | "away", value: string) => {
    setManualScores((current) => updateFixtureResult(current, fixtureId, side, value));
    setNotice("Manual override saved on this device");
  };

  const reset = () => {
    if (!window.confirm("Reset every result in the calculator?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setManualScores({});
    setNotice("Manual overrides reset");
  };

  return <main className="stadium-bg min-h-dvh w-full max-w-full overflow-x-hidden px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
    <div className="mx-auto w-full max-w-7xl min-w-0">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d8b75b]">World Cup Games</p><h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-5xl">World Cup Calculator</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Live standings, qualifying races, and the tournament picture as it stands right now.</p></div>
        <nav className="flex flex-wrap gap-2"><Link href="/" className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/70">Home</Link><button type="button" onClick={() => setShowManual((current) => !current)} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-wider text-white/70">Manual Override</button></nav>
      </header>

      <section className="mt-5 rounded-[1.5rem] border border-[#d8b75b]/25 bg-[#d8b75b]/[0.06] p-4 shadow-[0_20px_60px_rgba(0,0,0,.2)] sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">Live tournament view</p><h2 className="mt-1 text-2xl font-black">If it ended now...</h2><p className="mt-1 text-sm text-white/50">The provisional Round of 32 uses the current group order and top eight third-placed teams.</p></div><div className="text-left sm:text-right"><span className={`inline-flex w-fit rounded-full border px-3 py-2 text-xs font-black ${dataStatus === "live" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : dataStatus === "fallback" ? "border-[#d8b75b]/25 bg-[#d8b75b]/10 text-[#f6dc86]" : dataStatus === "cached" ? "border-sky-300/25 bg-sky-300/10 text-sky-100" : "border-rose-300/25 bg-rose-300/10 text-rose-100"}`}>{loading ? "Refreshing..." : dataStatus === "live" ? "Live" : dataStatus === "fallback" ? "Fallback" : dataStatus === "cached" ? "Cached" : "API Error"}</span><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-white/35">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--:--:--"}</p><p className="mt-1 text-[10px] font-bold text-white/40">{notice}</p></div></div>{liveError ? <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-bold text-amber-100">{liveError}</p> : null}</section>

      <section className="mt-8"><SectionHeading eyebrow="Current standings" title="Live Group Tables" description="Points, goal difference, then goals scored decide each group." /><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.keys(WORLD_CUP_GROUPS).map((group) => <GroupTable key={group} group={group} rows={tables[group]} />)}</div></section>

      <section className="mt-10"><SectionHeading eyebrow="Third-place race" title="Best Third-Placed Teams" description="The highlighted top eight currently complete the knockout field." /><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(tables).map(([group, rows]) => { const third = rows[2]; const qualified = bestThirds.some((team) => team.nation.code === third.nation.code); return <article key={group} className={`flex items-center justify-between rounded-xl border p-3 ${qualified ? "border-emerald-300/30 bg-emerald-300/[0.09]" : "border-white/10 bg-white/[0.035]"}`}><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-white/35">Group {group} · 3rd</p><p className="mt-1 truncate text-sm font-black"><NationFlag nation={third.nation.name} className="mr-1" />{third.nation.name}</p></div><div className="text-right"><p className="text-lg font-black text-[#f6dc86]">{third.points}</p><p className="text-[9px] font-black uppercase text-white/35">{qualified ? "Qualifying" : "Outside"}</p></div></article>; })}</div></section>

      <section className="mt-10"><SectionHeading eyebrow="Provisional knockout stage" title="If It Ended Now..." description="Group winners, runners-up and the best third-placed teams fill the official Round of 32 slots." /><div className="mt-4 grid gap-3 md:grid-cols-2">{bracket.map((fixture) => <article key={fixture.id} className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">Round of 32 · Match {fixture.matchNumber}</p><div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-black"><span className="min-w-0 truncate text-right"><NationFlag nation={fixture.home.name} className="mr-1" />{fixture.home.name}</span><span className="text-white/30">vs</span><span className="min-w-0 truncate"><NationFlag nation={fixture.away.name} className="mr-1" />{fixture.away.name}</span></div></article>)}</div></section>

      <section className="mt-10"><SectionHeading eyebrow="What is next" title="Upcoming / Live Matches" description="A live provider marks in-progress matches; scheduled fixtures remain ready for the next refresh." /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{WALL_CHART_FIXTURES.filter((fixture) => liveFixtureIds.includes(fixture.id) || !scores[fixture.id] || scores[fixture.id].home === "" || scores[fixture.id].away === "").slice(0, 12).map((fixture) => <article key={fixture.id} className={`rounded-xl border p-3 ${liveFixtureIds.includes(fixture.id) ? "border-rose-300/30 bg-rose-300/[0.08]" : "border-white/10 bg-white/[0.035]"}`}><p className={`text-[9px] font-black uppercase tracking-wider ${liveFixtureIds.includes(fixture.id) ? "text-rose-200" : "text-[#d8b75b]"}`}>{liveFixtureIds.includes(fixture.id) ? "Live now" : `Group ${fixture.group} · Match ${fixture.matchNumber}`}</p><p className="mt-2 text-sm font-black"><NationFlag nation={fixture.home.name} className="mr-1" />{fixture.home.name} <span className="text-white/35">{liveFixtureIds.includes(fixture.id) ? `${scores[fixture.id]?.home ?? 0} - ${scores[fixture.id]?.away ?? 0}` : "vs"}</span> <NationFlag nation={fixture.away.name} className="ml-1" />{fixture.away.name}</p></article>)}</div></section>

      {showManual ? <section className="mt-10 pb-8"><div className="flex flex-wrap items-end justify-between gap-3"><SectionHeading eyebrow="Optional override" title="Manual Results" description="Use only to test scenarios. Live results stay the default source." /><button type="button" onClick={reset} className="min-h-11 rounded-xl border border-rose-300/25 bg-rose-300/[0.08] px-4 text-xs font-black uppercase tracking-wider text-rose-100">Clear overrides</button></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{WALL_CHART_FIXTURES.map((fixture) => <article key={fixture.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"><div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-white/35"><span>Match {fixture.matchNumber}</span><span className="text-[#d8b75b]">Group {fixture.group}</span></div><div className="mt-3 grid grid-cols-[minmax(0,1fr)_2.5rem_1rem_2.5rem_minmax(0,1fr)] items-center gap-1.5 text-xs font-black"><span className="truncate text-right">{fixture.home.name} <NationFlag nation={fixture.home.name} /></span><ScoreBox value={manualScores[fixture.id]?.home ?? ""} label={`${fixture.home.name} score`} onChange={(value) => updateScore(fixture.id, "home", value)} /><span className="text-center text-white/30">-</span><ScoreBox value={manualScores[fixture.id]?.away ?? ""} label={`${fixture.away.name} score`} onChange={(value) => updateScore(fixture.id, "away", value)} /><span className="truncate"><NationFlag nation={fixture.away.name} /> {fixture.away.name}</span></div></article>)}</div></section> : null}
    </div>
  </main>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">{eyebrow}</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-white/45">{description}</p></div>; }

function GroupTable({ group, rows }: { group: string; rows: ReturnType<typeof calculateGroupTables>[string] }) { return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"><header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">Group {group}</p><span className="text-[9px] font-black uppercase tracking-wider text-white/35">Live table</span></header><div className="overflow-x-auto"><table className="w-full min-w-[31rem] text-xs"><thead className="text-[9px] font-black uppercase tracking-wider text-white/35"><tr><th className="px-3 py-3 text-left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.nation.code} className="border-t border-white/5"><td className="max-w-0 px-3 py-3 font-black"><span className="mr-2 text-white/35">{index + 1}</span><NationFlag nation={row.nation.name} className="mr-1" />{row.nation.name}</td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalsFor - row.goalsAgainst}</td><td className="font-black text-[#f6dc86]">{row.points}</td></tr>)}</tbody></table></div></article>; }

function ScoreBox({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) { return <input aria-label={label} type="number" min="0" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-white/15 bg-black/25 text-center text-sm font-black outline-none focus:border-[#d8b75b]" />; }
