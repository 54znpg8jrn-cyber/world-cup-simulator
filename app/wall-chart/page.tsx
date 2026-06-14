"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { NationFlag } from "../components/NationFlag";

const WALL_CHART_STORAGE_KEY = "world-cup-wall-chart-scores-v1";

const WALL_CHART_NATION_NAMES: Record<string, string> = {
  USA: "United States",
  "Czech Republic": "Czechia",
};

const wallChartNationName = (name: string) =>
  WALL_CHART_NATION_NAMES[name] ?? name;

const GROUP_COLORS: Record<string, string> = {
  A: "#36c98f",
  B: "#6dd3ff",
  C: "#ffd166",
  D: "#ff7a8a",
  E: "#a58cff",
  F: "#ff9e64",
  G: "#66d9d0",
  H: "#ef8ed8",
  I: "#9cdb69",
  J: "#7fa8ff",
  K: "#f5c451",
  L: "#ef6b6b",
};

const BRACKET_SIDES = {
  left: {
    round32: [73, 75, 74, 77, 83, 84, 81, 82],
    round16: [89, 90, 93, 94],
    quarter: [97, 98],
    semi: [101],
  },
  right: {
    round32: [76, 78, 79, 80, 86, 88, 85, 87],
    round16: [91, 92, 95, 96],
    quarter: [99, 100],
    semi: [102],
  },
};

const PLACEHOLDERS_BY_MATCH = new Map(
  KNOCKOUT_PLACEHOLDER_ROUNDS.flatMap((round) => round.fixtures).map(
    (fixture) => [fixture.matchNumber, fixture],
  ),
);

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
  const hasKnockoutDraw = knockoutRounds
    .flatMap((round) => round.fixtures)
    .some((fixture) => {
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
      // Inputs still work when browser storage is unavailable.
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

  const printPage = (target: "groups" | "knockout") => {
    document.body.dataset.wallChartPrint = target;
    const cleanup = () => {
      delete document.body.dataset.wallChartPrint;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  return (
    <main className="wall-chart-page min-h-screen w-full max-w-full overflow-x-hidden bg-[#06100c] text-white">
      <header className="safe-inline-padding no-print sticky top-0 z-40 w-full max-w-full border-b border-white/10 bg-[#06100c]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[96rem] min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
              Tournament Planner
            </p>
            <h1 className="font-black">World Cup Results &amp; Overview</h1>
          </div>
          <nav className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Link href="/" className="wall-nav-button">
              Home
            </Link>
            <Link href="/?simulator=1" className="wall-nav-button">
              Simulator
            </Link>
            <button
              type="button"
              onClick={resetWallChart}
              className="wall-nav-button text-rose-200"
            >
              Reset Wall Chart
            </button>
          </nav>
        </div>
      </header>

      <div className="safe-inline-padding no-print mx-auto w-full max-w-[96rem] min-w-0 px-4 py-6 sm:py-8">
        <section className="wall-hero">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d8b75b]">
              World Cup 2026
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-none sm:text-6xl">
              Every match. Every table. One path to the trophy.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">
              Enter results in official match-number order. Group tables and the
              tournament bracket update automatically.
            </p>
          </div>
          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
              {saveMessage}
            </span>
          </div>
        </section>

        <section className="mt-6 w-full max-w-full min-w-0 rounded-2xl border border-[#d8b75b]/20 bg-[#d8b75b]/[0.055] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d8b75b]">
              Print at home
            </p>
            <h2 className="mt-1 text-xl font-black">
              Printable World Cup Wall Chart
            </h2>
            <p className="mt-1 text-xs text-white/45">
              One-page group stage planner and knockout bracket.
            </p>
          </div>
          <div className="mt-4 grid w-full gap-2 sm:mt-0 sm:w-auto sm:grid-cols-2">
            <PrintButton onClick={() => printPage("groups")}>
              Print Group Stage
            </PrintButton>
            <PrintButton onClick={() => printPage("knockout")}>
              Print Knockout Bracket
            </PrintButton>
          </div>
        </section>

        <section className="mt-10 w-full max-w-full min-w-0">
          <SectionTitle
            eyebrow="Matches 1-72"
            title="Match Schedule"
            description="Fixtures follow the official chronological match sequence."
          />
          <div className="wall-schedule-grid mt-5">
            {WALL_CHART_FIXTURES.map((fixture) => (
              <article
                key={fixture.id}
                className="wall-fixture-card"
                style={
                  {
                    "--group-accent": GROUP_COLORS[fixture.group],
                  } as React.CSSProperties
                }
              >
                <div className="wall-fixture-meta">
                  <span>Match {fixture.matchNumber}</span>
                  <b>Group {fixture.group}</b>
                </div>
                <div className="wall-fixture-teams">
                  <span>
                    <NationFlag nation={fixture.home.name} className="mr-1 text-base" />
                    {wallChartNationName(fixture.home.name)}
                  </span>
                  <ScoreInput
                    value={scores[fixture.id]?.home ?? ""}
                    label={`Match ${fixture.matchNumber}, ${wallChartNationName(fixture.home.name)} score`}
                    onChange={(value) =>
                      updateScore(fixture.id, "home", value)
                    }
                  />
                  <i>-</i>
                  <ScoreInput
                    value={scores[fixture.id]?.away ?? ""}
                    label={`Match ${fixture.matchNumber}, ${wallChartNationName(fixture.away.name)} score`}
                    onChange={(value) =>
                      updateScore(fixture.id, "away", value)
                    }
                  />
                  <span>
                    {wallChartNationName(fixture.away.name)}{" "}
                    <NationFlag nation={fixture.away.name} className="ml-1 text-base" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <SectionTitle
            eyebrow="Live Standings"
            title="Group Tables"
            description="The top two qualify automatically; the eight best third-placed teams also advance."
          />
          <div className="mt-5 grid w-full max-w-full min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.keys(WORLD_CUP_GROUPS).map((group) => (
              <article
                key={group}
                className="wall-group-card"
                style={
                  {
                    "--group-accent": GROUP_COLORS[group],
                  } as React.CSSProperties
                }
              >
                <header>
                  <span>Group</span>
                  <b>{group}</b>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GD</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables[group].map((row, index) => (
                      <tr key={row.nation.code}>
                        <td>
                          <span>{index + 1}</span>{" "}
                          <NationFlag nation={row.nation.name} className="mr-1 text-base" />
                          {row.nation.name}
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.goalsFor - row.goalsAgainst}</td>
                        <td>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 w-full max-w-full min-w-0">
          <SectionTitle
            eyebrow="Matches 73-104"
            title="Knockout Bracket"
            description="Round of 32 fixtures begin at the outside and progress toward the final."
          />
          {hasKnockoutDraw ? (
            <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-bold text-amber-200">
              Knockout games need a winner.
            </div>
          ) : null}
          <div className="mt-5 w-full max-w-full min-w-0 overflow-hidden">
            <WallChartBracket
              fixtures={knockoutFixtures}
              scores={scores}
              onScoreChange={updateScore}
            />
          </div>
        </section>
      </div>

      <PrintableWallChart />
    </main>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d8b75b]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-white/40">{description}</p>
    </div>
  );
}

function ScoreInput({
  value,
  label,
  onChange,
  disabled = false,
}: {
  value: string;
  label: string;
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
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      className="wall-score-input"
    />
  );
}

function WallChartBracket({
  fixtures,
  scores,
  onScoreChange,
}: {
  fixtures: Map<number | undefined, TournamentFixture>;
  scores: Record<string, ScoreValue>;
  onScoreChange: (
    id: string,
    side: "home" | "away",
    value: string,
  ) => void;
}) {
  return (
    <>
      <div className="w-full max-w-full min-w-0 space-y-5 overflow-hidden md:hidden">
        {KNOCKOUT_PLACEHOLDER_ROUNDS.map((round) => (
          <section
            key={round.round}
            className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-3"
          >
            <h3 className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
              {round.round}
            </h3>
            <div className="grid min-w-0 gap-2">
              {round.fixtures.map((placeholder) => (
                <DigitalBracketMatch
                  key={placeholder.matchNumber}
                  placeholder={placeholder}
                  fixture={fixtures.get(placeholder.matchNumber)}
                  score={scores[placeholder.id]}
                  onScoreChange={onScoreChange}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="wall-bracket-scroll hidden md:block">
        <div className="wall-bracket">
        <BracketColumn
          title="Round of 32"
          side="left"
          roundClass="round-32"
          matchNumbers={BRACKET_SIDES.left.round32}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Round of 16"
          side="left"
          roundClass="round-16"
          matchNumbers={BRACKET_SIDES.left.round16}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Quarter-finals"
          side="left"
          roundClass="quarter"
          matchNumbers={BRACKET_SIDES.left.quarter}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Semi-finals"
          side="left"
          roundClass="semi"
          matchNumbers={BRACKET_SIDES.left.semi}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <FinalColumn
          fixture={fixtures.get(104)}
          score={scores["match-104"]}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Semi-finals"
          side="right"
          roundClass="semi"
          matchNumbers={BRACKET_SIDES.right.semi}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Quarter-finals"
          side="right"
          roundClass="quarter"
          matchNumbers={BRACKET_SIDES.right.quarter}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Round of 16"
          side="right"
          roundClass="round-16"
          matchNumbers={BRACKET_SIDES.right.round16}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        <BracketColumn
          title="Round of 32"
          side="right"
          roundClass="round-32"
          matchNumbers={BRACKET_SIDES.right.round32}
          fixtures={fixtures}
          scores={scores}
          onScoreChange={onScoreChange}
        />
        </div>
      </div>
    </>
  );
}

function BracketColumn({
  title,
  side,
  roundClass,
  matchNumbers,
  fixtures,
  scores,
  onScoreChange,
}: {
  title: string;
  side: "left" | "right";
  roundClass: string;
  matchNumbers: number[];
  fixtures: Map<number | undefined, TournamentFixture>;
  scores: Record<string, ScoreValue>;
  onScoreChange: (
    id: string,
    side: "home" | "away",
    value: string,
  ) => void;
}) {
  return (
    <section className={`wall-bracket-column ${side} ${roundClass}`}>
      <h3>{title}</h3>
      <div>
        {matchNumbers.map((matchNumber) => (
          <DigitalBracketMatch
            key={matchNumber}
            placeholder={PLACEHOLDERS_BY_MATCH.get(matchNumber)!}
            fixture={fixtures.get(matchNumber)}
            score={scores[`match-${matchNumber}`]}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>
    </section>
  );
}

function DigitalBracketMatch({
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
  return (
    <article className="wall-bracket-match">
      <small>Match {placeholder.matchNumber}</small>
      <BracketTeamRow
        name={
          fixture
            ? (
                <span className="flex min-w-0 items-center gap-1">
                  <NationFlag nation={fixture.home.name} className="text-base" />
                  <span className="truncate">{fixture.home.name}</span>
                </span>
              )
            : placeholder.homeLabel
        }
        score={score?.home ?? ""}
        disabled={!fixture}
        label={`Match ${placeholder.matchNumber} home score`}
        onChange={(value) => onScoreChange(placeholder.id, "home", value)}
      />
      <BracketTeamRow
        name={
          fixture
            ? (
                <span className="flex min-w-0 items-center gap-1">
                  <NationFlag nation={fixture.away.name} className="text-base" />
                  <span className="truncate">{fixture.away.name}</span>
                </span>
              )
            : placeholder.awayLabel
        }
        score={score?.away ?? ""}
        disabled={!fixture}
        label={`Match ${placeholder.matchNumber} away score`}
        onChange={(value) => onScoreChange(placeholder.id, "away", value)}
      />
    </article>
  );
}

function BracketTeamRow({
  name,
  score,
  disabled,
  label,
  onChange,
}: {
  name: ReactNode;
  score: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="wall-bracket-team">
      <span>{name}</span>
      <ScoreInput
        value={score}
        label={label}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}

function FinalColumn({
  fixture,
  score,
  onScoreChange,
}: {
  fixture?: TournamentFixture;
  score?: ScoreValue;
  onScoreChange: (
    id: string,
    side: "home" | "away",
    value: string,
  ) => void;
}) {
  return (
    <section className="wall-bracket-final">
      <span className="wall-bracket-trophy">🏆</span>
      <h3>Final</h3>
      <DigitalBracketMatch
        placeholder={PLACEHOLDERS_BY_MATCH.get(104)!}
        fixture={fixture}
        score={score}
        onScoreChange={onScoreChange}
      />
    </section>
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
    <button type="button" onClick={onClick} className="wall-print-button">
      {children}
    </button>
  );
}

function PrintableWallChart() {
  return (
    <div className="print-wall-chart">
      <section className="print-page print-groups-page">
        <PrintPageHeader
          eyebrow="Matches 1-72"
          title="World Cup 2026 Group Stage"
          subtitle="Write each score, then complete the tables by hand."
        />
        <div className="print-schedule-grid">
          {chunk(WALL_CHART_FIXTURES, 18).map((fixtures, column) => (
            <div key={column} className="print-schedule-column">
              {fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="print-schedule-match"
                  style={
                    {
                      "--group-accent": GROUP_COLORS[fixture.group],
                    } as React.CSSProperties
                  }
                >
                  <b>{fixture.matchNumber}</b>
                  <em>{fixture.group}</em>
                  <span>{wallChartNationName(fixture.home.name)}</span>
                  <i />
                  <strong>-</strong>
                  <i />
                  <span>{wallChartNationName(fixture.away.name)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="print-standings-grid">
          {Object.keys(WORLD_CUP_GROUPS).map((group) => (
            <article
              key={group}
              className="print-standings-card"
              style={
                {
                  "--group-accent": GROUP_COLORS[group],
                } as React.CSSProperties
              }
            >
              <h2>Group {group}</h2>
              <table>
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
          eyebrow="Matches 73-104"
          title="World Cup 2026 Knockout Bracket"
          subtitle="Fill in team names and scores as each round is completed."
        />
        <PrintableKnockoutBracket />
      </section>
    </div>
  );
}

function PrintableKnockoutBracket() {
  return (
    <div className="print-knockout-bracket">
      <PrintableBracketColumn
        title="Round of 32"
        side="left"
        roundClass="round-32"
        matchNumbers={BRACKET_SIDES.left.round32}
      />
      <PrintableBracketColumn
        title="Round of 16"
        side="left"
        roundClass="round-16"
        matchNumbers={BRACKET_SIDES.left.round16}
      />
      <PrintableBracketColumn
        title="Quarter-finals"
        side="left"
        roundClass="quarter"
        matchNumbers={BRACKET_SIDES.left.quarter}
      />
      <PrintableBracketColumn
        title="Semi-finals"
        side="left"
        roundClass="semi"
        matchNumbers={BRACKET_SIDES.left.semi}
      />
      <section className="print-final-column">
        <span>🏆</span>
        <h2>Final</h2>
        <PrintableBracketMatch matchNumber={104} />
      </section>
      <PrintableBracketColumn
        title="Semi-finals"
        side="right"
        roundClass="semi"
        matchNumbers={BRACKET_SIDES.right.semi}
      />
      <PrintableBracketColumn
        title="Quarter-finals"
        side="right"
        roundClass="quarter"
        matchNumbers={BRACKET_SIDES.right.quarter}
      />
      <PrintableBracketColumn
        title="Round of 16"
        side="right"
        roundClass="round-16"
        matchNumbers={BRACKET_SIDES.right.round16}
      />
      <PrintableBracketColumn
        title="Round of 32"
        side="right"
        roundClass="round-32"
        matchNumbers={BRACKET_SIDES.right.round32}
      />
    </div>
  );
}

function PrintableBracketColumn({
  title,
  side,
  roundClass,
  matchNumbers,
}: {
  title: string;
  side: "left" | "right";
  roundClass: string;
  matchNumbers: number[];
}) {
  return (
    <section className={`print-bracket-column ${side} ${roundClass}`}>
      <h2>{title}</h2>
      <div>
        {matchNumbers.map((matchNumber) => (
          <PrintableBracketMatch key={matchNumber} matchNumber={matchNumber} />
        ))}
      </div>
    </section>
  );
}

function PrintableBracketMatch({ matchNumber }: { matchNumber: number }) {
  const fixture = PLACEHOLDERS_BY_MATCH.get(matchNumber)!;
  return (
    <article className="print-bracket-match">
      <small>M{matchNumber}</small>
      <PrintTeamSlot label={fixture.homeLabel} />
      <PrintTeamSlot label={fixture.awayLabel} />
    </article>
  );
}

function PrintTeamSlot({ label }: { label: string }) {
  return (
    <div>
      <span>{label}</span>
      <em />
      <i />
    </div>
  );
}

function PrintPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="print-page-header">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{subtitle}</span>
    </header>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size),
  );
}
