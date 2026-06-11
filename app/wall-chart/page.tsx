"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TournamentBracket } from "../components/TournamentBracket";
import { WORLD_CUP_GROUPS } from "../data/groups";
import {
  WALL_CHART_FIXTURES,
  buildManualKnockoutRounds,
  calculateWallChartTables,
  getWallChartRoundOf32,
  type ScoreValue,
} from "../lib/wall-chart";

export default function WallChartPage() {
  const [scores, setScores] = useState<Record<string, ScoreValue>>({});
  const tables = useMemo(() => calculateWallChartTables(scores), [scores]);
  const roundOf32 = useMemo(() => getWallChartRoundOf32(tables), [tables]);
  const knockoutRounds = useMemo(
    () => buildManualKnockoutRounds(roundOf32, scores),
    [roundOf32, scores],
  );
  const drawWarnings = knockoutRounds
    .flatMap((round) => round.fixtures)
    .filter((fixture) => {
      const score = scores[fixture.id];
      return score && score.home !== "" && score.away !== "" && score.home === score.away;
    });

  const updateScore = (id: string, side: "home" | "away", value: string) => {
    const normalized = value === "" ? "" : String(Math.max(0, Number(value)));
    setScores((current) => ({
      ...current,
      [id]: {
        home: current[id]?.home ?? "",
        away: current[id]?.away ?? "",
        [side]: normalized,
      },
    }));
  };

  return (
    <main className="wall-chart-page min-h-screen bg-[#07100b] text-white">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#07100b]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
              World Cup 2026
            </p>
            <h1 className="font-black">World Cup Wall Chart</h1>
          </div>
          <nav className="flex gap-2">
            <Link href="/" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">
              Home
            </Link>
            <Link href="/?simulator=1" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">
              Simulator
            </Link>
            <button onClick={() => window.print()} className="rounded-xl bg-[#d8b75b] px-3 py-2 text-xs font-black text-black">
              Download Printable A4 Wall Chart
            </button>
          </nav>
        </div>
      </header>

      <div className="print-sheet mx-auto max-w-7xl px-4 py-8">
        <section className="mb-7 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d8b75b]">
            Interactive tournament tracker
          </p>
          <h2 className="mt-2 text-4xl font-black">World Cup Wall Chart</h2>
          <p className="mt-2 text-sm text-white/45">
            Enter every score. Tables and the official knockout path update automatically.
          </p>
        </section>

        <section className="wall-groups grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(WORLD_CUP_GROUPS).map((group) => (
            <article key={group} className="wall-group rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-[#f6dc86]">
                Group {group}
              </h3>
              <div className="space-y-1.5">
                {WALL_CHART_FIXTURES.filter((fixture) => fixture.group === group).map(
                  (fixture) => (
                    <div key={fixture.id} className="fixture-row grid grid-cols-[1fr_2.5rem_auto_2.5rem_1fr] items-center gap-1 text-[10px]">
                      <span className="truncate text-right">{fixture.home.flag} {fixture.home.name}</span>
                      <ScoreInput value={scores[fixture.id]?.home ?? ""} onChange={(value) => updateScore(fixture.id, "home", value)} />
                      <span className="text-white/25">–</span>
                      <ScoreInput value={scores[fixture.id]?.away ?? ""} onChange={(value) => updateScore(fixture.id, "away", value)} />
                      <span className="truncate">{fixture.away.name} {fixture.away.flag}</span>
                    </div>
                  ),
                )}
              </div>
              <table className="group-table mt-4 w-full text-[9px]">
                <thead className="text-white/30">
                  <tr><th className="text-left"># Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr>
                </thead>
                <tbody>
                  {tables[group].map((row, index) => (
                    <tr key={row.nation.code} className={index < 2 ? "text-[#8cf2a7]" : index === 2 ? "text-[#f6dc86]" : "text-white/55"}>
                      <td className="py-1 font-bold">{index + 1}. {row.nation.flag} {row.nation.name}</td>
                      <td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td>
                      <td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalsFor - row.goalsAgainst}</td><td className="font-black">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </section>

        <section className="wall-knockout mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">Official path</p>
              <h2 className="text-2xl font-black">Knockout Bracket</h2>
            </div>
            {!roundOf32.length ? <p className="text-xs text-white/35">Complete all group fixtures to unlock.</p> : null}
          </div>

          {drawWarnings.length ? (
            <div className="no-print mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-bold text-amber-200">
              Knockout games need a winner.
            </div>
          ) : null}

          {knockoutRounds.length ? (
            <>
              <div className="no-print mb-6 space-y-5">
                {knockoutRounds.map((round) => (
                  <section key={round.round}>
                    <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-[#f6dc86]">{round.round}</h3>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                      {round.fixtures.map((fixture) => (
                        <div key={fixture.id} className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                          <p className="mb-2 text-[8px] font-black uppercase tracking-wider text-white/25">Match {fixture.matchNumber}</p>
                          <KnockoutScoreRow name={`${fixture.home.flag} ${fixture.home.name}`} value={scores[fixture.id]?.home ?? ""} onChange={(value) => updateScore(fixture.id, "home", value)} />
                          <KnockoutScoreRow name={`${fixture.away.flag} ${fixture.away.name}`} value={scores[fixture.id]?.away ?? ""} onChange={(value) => updateScore(fixture.id, "away", value)} />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="no-print">
                <TournamentBracket rounds={knockoutRounds} selectedNationCode="" />
              </div>
              <PrintableBracket rounds={knockoutRounds} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
              The bracket appears when all 72 group scores are complete.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ScoreInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="score-input h-8 w-10 rounded-lg border border-white/10 bg-black/25 text-center font-black outline-none focus:border-[#d8b75b]" />;
}

function KnockoutScoreRow({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return <div className="mb-1 flex items-center gap-2 text-xs last:mb-0"><span className="min-w-0 flex-1 truncate">{name}</span><ScoreInput value={value} onChange={onChange} /></div>;
}

function PrintableBracket({ rounds }: { rounds: ReturnType<typeof buildManualKnockoutRounds> }) {
  return (
    <div className="print-bracket hidden">
      {rounds.map((round) => (
        <section key={round.round}>
          <h3>{round.round}</h3>
          {round.fixtures.map((fixture) => (
            <p key={fixture.id}>M{fixture.matchNumber}: {fixture.home.name} ____ – ____ {fixture.away.name}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
