import type {
  TournamentFixture,
  TournamentRound,
  TournamentRoundResults,
} from "../lib/types";
import { getNationFlag } from "../lib/flags";

export function TournamentBracket({
  rounds,
  selectedNationCode,
}: {
  rounds: TournamentRoundResults[];
  selectedNationCode: string;
}) {
  if (!rounds.length) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-sm text-white/35">
        The knockout bracket will appear after the group stage.
      </div>
    );
  }

  const fixturesFor = (round: Exclude<TournamentRound, "Group Stage">) =>
    rounds.find((item) => item.round === round)?.fixtures ?? [];
  const fixturesByMatch = new Map(
    rounds
      .flatMap((round) => round.fixtures)
      .map((fixture) => [fixture.matchNumber, fixture]),
  );
  const matches = (matchNumbers: number[]) =>
    matchNumbers
      .map((matchNumber) => fixturesByMatch.get(matchNumber))
      .filter((fixture): fixture is TournamentFixture => Boolean(fixture));
  const left32 = matches([73, 75, 74, 77, 83, 84, 81, 82]);
  const right32 = matches([76, 78, 79, 80, 86, 88, 85, 87]);
  const left16 = matches([89, 90, 93, 94]);
  const right16 = matches([91, 92, 95, 96]);
  const leftQuarter = matches([97, 98]);
  const rightQuarter = matches([99, 100]);
  const leftSemi = matches([101]);
  const rightSemi = matches([102]);
  const final = fixturesFor("Final")[0];

  return (
    <>
      <div className="w-full max-w-full min-w-0 space-y-5 overflow-hidden md:hidden">
        {rounds.map((round) => (
          <section
            key={round.round}
            className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-3"
          >
            <h3 className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b75b]">
              {round.round}
            </h3>
            <div className="grid min-w-0 gap-2">
              {round.fixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  selectedNationCode={selectedNationCode}
                  final={round.round === "Final"}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="tournament-bracket-scroll hidden pb-4 md:block">
        <div className="tournament-bracket-grid">
        <BracketColumn
          title="Round of 32"
          fixtures={left32}
          selectedNationCode={selectedNationCode}
          side="left"
        />
        <BracketColumn
          title="Round of 16"
          fixtures={left16}
          selectedNationCode={selectedNationCode}
          side="left"
          inset
        />
        <BracketColumn
          title="Quarter-finals"
          fixtures={leftQuarter}
          selectedNationCode={selectedNationCode}
          side="left"
          inset
        />
        <BracketColumn
          title="Semi-finals"
          fixtures={leftSemi}
          selectedNationCode={selectedNationCode}
          side="left"
          inset
        />

        <section className="flex min-h-[31rem] flex-col items-center justify-center">
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-full border border-[#d8b75b]/35 bg-[#d8b75b]/10 text-3xl">
            🏆
          </div>
          <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b75b]">
            Final
          </h3>
          {final ? (
            <FixtureCard
              fixture={final}
              selectedNationCode={selectedNationCode}
              final
            />
          ) : (
            <div className="w-full rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/25">
              Final awaits
            </div>
          )}
        </section>

        <BracketColumn
          title="Semi-finals"
          fixtures={rightSemi}
          selectedNationCode={selectedNationCode}
          side="right"
          inset
        />
        <BracketColumn
          title="Quarter-finals"
          fixtures={rightQuarter}
          selectedNationCode={selectedNationCode}
          side="right"
          inset
        />
        <BracketColumn
          title="Round of 16"
          fixtures={right16}
          selectedNationCode={selectedNationCode}
          side="right"
          inset
        />
        <BracketColumn
          title="Round of 32"
          fixtures={right32}
          selectedNationCode={selectedNationCode}
          side="right"
        />
        </div>
      </div>
    </>
  );
}

function BracketColumn({
  title,
  fixtures,
  selectedNationCode,
  side,
  inset = false,
}: {
  title: string;
  fixtures: TournamentFixture[];
  selectedNationCode: string;
  side: "left" | "right";
  inset?: boolean;
}) {
  return (
    <section className={`tournament-bracket-column ${side} flex min-h-[36rem] flex-col`}>
      <h3 className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.14em] text-[#d8b75b]">
        {title}
      </h3>
      <div
        className={`flex flex-1 flex-col ${
          inset ? "justify-around" : "justify-between"
        }`}
      >
        {fixtures.length ? (
          fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              selectedNationCode={selectedNationCode}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/8 p-3 text-center text-[9px] text-white/20">
            Not played
          </div>
        )}
      </div>
    </section>
  );
}

function FixtureCard({
  fixture,
  selectedNationCode,
  final = false,
}: {
  fixture: TournamentFixture;
  selectedNationCode: string;
  final?: boolean;
}) {
  const highlighted =
    fixture.home.code === selectedNationCode ||
    fixture.away.code === selectedNationCode;
  const hasWinner = Boolean(fixture.winner);

  return (
    <div
      className={`tournament-bracket-match w-full rounded-xl border p-2.5 text-xs md:p-2 md:text-[10px] ${
        final && hasWinner
          ? "border-[#d8b75b]/55 bg-[#d8b75b]/15 shadow-[0_0_35px_rgba(216,183,91,.12)]"
          : highlighted
            ? "border-[#d8b75b]/40 bg-[#d8b75b]/10"
            : "border-white/8 bg-white/[0.035]"
      }`}
    >
      {fixture.matchNumber ? (
        <p className="mb-1 text-[7px] font-black uppercase tracking-wider text-white/25">
          Match {fixture.matchNumber}
        </p>
      ) : null}
      <FixtureTeam
        name={fixture.home.name}
        flag={getNationFlag(fixture.home.name)}
        score={fixture.homeGoals}
        winner={fixture.winner?.code === fixture.home.code}
      />
      <FixtureTeam
        name={fixture.away.name}
        flag={getNationFlag(fixture.away.name)}
        score={fixture.awayGoals}
        winner={fixture.winner?.code === fixture.away.code}
      />
      {fixture.isUpset ? (
        <p className="mt-1 text-[7px] font-black uppercase tracking-wider text-amber-300">
          Upset
        </p>
      ) : null}
    </div>
  );
}

function FixtureTeam({
  name,
  flag,
  score,
  winner,
}: {
  name: string;
  flag: string;
  score: number;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 py-0.5 ${
        winner ? "font-black text-[#f6dc86]" : "text-white/55"
      }`}
    >
      <span>{flag}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span>{score}</span>
    </div>
  );
}
