"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { WORLD_CUP_GROUPS } from "../data/groups";
import {
  KNOCKOUT_PLACEHOLDER_ROUNDS,
  WALL_CHART_FIXTURES,
  buildManualKnockoutRounds,
  calculateWallChartTables,
  getWallChartRoundOf32,
  type KnockoutPlaceholderFixture,
  type ScoreValue,
} from "../lib/wall-chart";
import type { TournamentFixture } from "../lib/types";

const WALL_CHART_STORAGE_KEY = "world-cup-wall-chart-scores-v1";

type PrintTarget = "all" | "groups" | "knockout";

export default function WallChartPage() {
  const [scores, setScores] = useState<Record<string, ScoreValue>>({});
  const [saveMessage, setSaveMessage] = useState("Autosaved on this device");
  const storageLoaded = useRef(false);
  const tables = useMemo(() => calculateWallChartTables(scores), [scores]);
  const roundOf32 = useMemo(() => getWallChartRoundOf32(tables), [tables]);
  const knockoutRounds = useMemo(
    () => buildManualKnockoutRounds(roundOf32, scores),
    [roundOf32, scores],
  );
  const knockoutFixtures = useMemo(
    () =>
      new Map(
        knockoutRounds
          .flatMap((round) => round.fixtures)
          .map((fixture) => [fixture.matchNumber, fixture]),
      ),
    [knockoutRounds],
  );
  const drawWarnings = knockoutRounds
    .flatMap((round) => round.fixtures)
    .filter((fixture) => {
      const score = scores[fixture.id];
      return (
        score &&
        score.home !== "" &&
        score.away !== "" &&
        score.home === score.away
      );
    });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(WALL_CHART_STORAGE_KEY);
        if (saved) {
          setScores(JSON.parse(saved) as Record<string, ScoreValue>);
          setSaveMessage("Saved wall chart restored");
        }
      } catch {
        setSaveMessage("Could not restore saved scores");
      } finally {
        storageLoaded.current = true;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageLoaded.current) return;
    try {
      window.localStorage.setItem(
        WALL_CHART_STORAGE_KEY,
        JSON.stringify(scores),
      );
    } catch {
      // Storage can be unavailable in private browsing; inputs still work.
    }
  }, [scores]);

  const updateScore = (id: string, side: "home" | "away", value: string) => {
    const normalized =
      value === "" ? "" : String(Math.max(0, Math.floor(Number(value))));
    setScores((current) => ({
      ...current,
      [id]: {
        home: current[id]?.home ?? "",
        away: current[id]?.away ?? "",
        [side]: normalized,
      },
    }));
    setSaveMessage("Autosaved on this device");
  };

  const resetWallChart = () => {
    if (!window.confirm("Reset every group and knockout score?")) return;
    window.localStorage.removeItem(WALL_CHART_STORAGE_KEY);
    setScores({});
    setSaveMessage("Wall chart reset");
  };

  const printWallChart = (target: PrintTarget) => {
    document.body.dataset.wallChartPrint = target;
    const cleanup = () => {
      delete document.body.dataset.wallChartPrint;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  return (
    <main className="wall-chart-page min-h-screen bg-[#07100b] text-white">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#07100b]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
              World Cup 2026
            </p>
            <h1 className="font-black">World Cup Wall Chart</h1>
          </div>
          <nav className="flex flex-wrap justify-end gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black"
            >
              Home
            </Link>
            <Link
              href="/?simulator=1"
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black"
            >
              Simulator
            </Link>
            <button
              type="button"
              onClick={resetWallChart}
              className="rounded-xl border border-rose-300/20 px-3 py-2 text-xs font-black text-rose-200"
            >
              Reset Wall Chart
            </button>
          </nav>
        </div>
      </header>

      <div className="no-print mx-auto max-w-7xl px-4 py-8">
        <section className="mb-7 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d8b75b]">
            Interactive tournament tracker
          </p>
          <h2 className="mt-2 text-4xl font-black">World Cup Wall Chart</h2>
          <p className="mt-2 text-sm text-white/45">
            Enter every score. Tables and the official knockout path update
            automatically.
          </p>
          <p className="mt-2 text-xs font-bold text-[#8cf2a7]" role="status">
            {saveMessage}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <PrintButton onClick={() => printWallChart("all")}>
              Print Wall Chart
            </PrintButton>
            <PrintButton onClick={() => printWallChart("groups")}>
              Print Group Stage Page
            </PrintButton>
            <PrintButton onClick={() => printWallChart("knockout")}>
              Print Knockout Bracket Page
            </PrintButton>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(WORLD_CUP_GROUPS).map((group) => (
            <article
              key={group}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-[#f6dc86]">
                Group {group}
              </h3>
              <div className="space-y-1.5">
                {WALL_CHART_FIXTURES.filter(
                  (fixture) => fixture.group === group,
                ).map((fixture) => (
                  <div
                    key={fixture.id}
                    className="grid grid-cols-[1fr_2.5rem_auto_2.5rem_1fr] items-center gap-1 text-[10px]"
                  >
                    <span className="truncate text-right">
                      {fixture.home.flag} {fixture.home.name}
                    </span>
                    <ScoreInput
                      value={scores[fixture.id]?.home ?? ""}
                      onChange={(value) =>
                        updateScore(fixture.id, "home", value)
                      }
                    />
                    <span className="text-white/25">-</span>
                    <ScoreInput
                      value={scores[fixture.id]?.away ?? ""}
                      onChange={(value) =>
                        updateScore(fixture.id, "away", value)
                      }
                    />
                    <span className="truncate">
                      {fixture.away.name} {fixture.away.flag}
                    </span>
                  </div>
                ))}
              </div>
              <table className="mt-4 w-full text-[9px]">
                <thead className="text-white/30">
                  <tr>
                    <th className="text-left"># Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {tables[group].map((row, index) => (
                    <tr
                      key={row.nation.code}
                      className={
                        index < 2
                          ? "text-[#8cf2a7]"
                          : index === 2
                            ? "text-[#f6dc86]"
                            : "text-white/55"
                      }
                    >
                      <td className="py-1 font-bold">
                        {index + 1}. {row.nation.flag} {row.nation.name}
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{row.goalsFor - row.goalsAgainst}</td>
                      <td className="font-black">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
                Official path
              </p>
              <h2 className="text-2xl font-black">Knockout Bracket</h2>
            </div>
            {!roundOf32.length ? (
              <p className="max-w-xs text-right text-xs text-white/35">
                Placeholder slots fill with teams when all group scores are
                complete.
              </p>
            ) : null}
          </div>

          {drawWarnings.length ? (
            <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-bold text-amber-200">
              Knockout games need a winner.
            </div>
          ) : null}

          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1180px] grid-cols-[repeat(5,minmax(190px,1fr))] items-center gap-4">
              {KNOCKOUT_PLACEHOLDER_ROUNDS.map((round) => (
                <section key={round.round}>
                  <h3 className="mb-3 text-center text-xs font-black uppercase tracking-wider text-[#f6dc86]">
                    {round.round}
                  </h3>
                  <div className="flex flex-col justify-around gap-2">
                    {round.fixtures.map((placeholder) => (
                      <DigitalKnockoutFixture
                        key={placeholder.id}
                        placeholder={placeholder}
                        fixture={knockoutFixtures.get(
                          placeholder.matchNumber,
                        )}
                        score={scores[placeholder.id]}
                        onScoreChange={updateScore}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>

      <PrintableWallChart />
    </main>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      disabled={disabled}
      aria-label="Score"
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-10 rounded-lg border border-white/10 bg-black/25 text-center font-black outline-none focus:border-[#d8b75b] disabled:cursor-not-allowed disabled:opacity-30"
    />
  );
}

function DigitalKnockoutFixture({
  placeholder,
  fixture,
  score,
  onScoreChange,
}: {
  placeholder: KnockoutPlaceholderFixture;
  fixture?: TournamentFixture;
  score?: ScoreValue;
  onScoreChange: (
    id: string,
    side: "home" | "away",
    value: string,
  ) => void;
}) {
  const homeName = fixture
    ? `${fixture.home.flag} ${fixture.home.name}`
    : placeholder.homeLabel;
  const awayName = fixture
    ? `${fixture.away.flag} ${fixture.away.name}`
    : placeholder.awayLabel;

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="mb-2 text-[8px] font-black uppercase tracking-wider text-white/25">
        Match {placeholder.matchNumber}
      </p>
      <KnockoutScoreRow
        name={homeName}
        value={score?.home ?? ""}
        disabled={!fixture}
        onChange={(value) =>
          onScoreChange(placeholder.id, "home", value)
        }
      />
      <KnockoutScoreRow
        name={awayName}
        value={score?.away ?? ""}
        disabled={!fixture}
        onChange={(value) =>
          onScoreChange(placeholder.id, "away", value)
        }
      />
    </article>
  );
}

function KnockoutScoreRow({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-1 flex items-center gap-2 text-xs last:mb-0">
      <span className="min-w-0 flex-1 leading-tight">{name}</span>
      <ScoreInput value={value} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function PrintButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-[#d8b75b] px-4 py-3 text-xs font-black text-black hover:bg-[#f6dc86]"
    >
      {children}
    </button>
  );
}

function PrintableWallChart() {
  return (
    <div className="print-wall-chart">
      <section className="print-page print-groups-page">
        <PrintPageHeader
          title="World Cup 2026 Group Stage Planner"
          subtitle="Write each score, then complete the tables by hand."
        />
        <div className="print-group-grid">
          {Object.entries(WORLD_CUP_GROUPS).map(([group]) => (
            <article key={group} className="print-group-card">
              <h2>Group {group}</h2>
              <div className="print-fixtures">
                {WALL_CHART_FIXTURES.filter(
                  (fixture) => fixture.group === group,
                ).map((fixture) => (
                  <div key={fixture.id} className="print-fixture">
                    <span>{fixture.home.name}</span>
                    <i />
                    <b>-</b>
                    <i />
                    <span>{fixture.away.name}</span>
                  </div>
                ))}
              </div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>Pts</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((position) => (
                    <tr key={position}>
                      <td>{position}</td>
                      <td />
                      <td />
                      <td />
                      <td />
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </section>

      <section className="print-page print-knockout-page">
        <PrintPageHeader
          title="World Cup 2026 Knockout Bracket Planner"
          subtitle="Fill in each team and score as the tournament progresses."
        />
        <div className="print-knockout-grid">
          {KNOCKOUT_PLACEHOLDER_ROUNDS.map((round) => (
            <section key={round.round} className="print-round">
              <h2>{round.round}</h2>
              <div>
                {round.fixtures.map((fixture) => (
                  <article key={fixture.id} className="print-knockout-match">
                    <small>Match {fixture.matchNumber}</small>
                    <PrintTeamLine label={fixture.homeLabel} />
                    <PrintTeamLine label={fixture.awayLabel} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function PrintPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="print-page-header">
      <p>WORLD CUP WALL CHART</p>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </header>
  );
}

function PrintTeamLine({ label }: { label: string }) {
  return (
    <div className="print-team-line">
      <span>
        <b>{label}</b>
        <em />
      </span>
      <i />
    </div>
  );
}
