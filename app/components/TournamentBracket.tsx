import type {
  TournamentFixture,
  TournamentRound,
  TournamentRoundResults,
} from "../lib/types";

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
  const splitRound = (
    round: Exclude<TournamentRound, "Group Stage" | "Final">,
  ) => {
    const fixtures = fixturesFor(round);
    const middle = Math.ceil(fixtures.length / 2);
    return [fixtures.slice(0, middle), fixtures.slice(middle)] as const;
  };
  const [left32, right32] = splitRound("Round of 32");
  const [left16, right16] = splitRound("Round of 16");
  const [leftQuarter, rightQuarter] = splitRound("Quarter-final");
  const [leftSemi, rightSemi] = splitRound("Semi-final");
  const final = fixturesFor("Final")[0];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid min-w-[92rem] grid-cols-[repeat(4,10rem)_13rem_repeat(4,10rem)] gap-3">
        <BracketColumn
          title="Round of 32"
          fixtures={left32}
          selectedNationCode={selectedNationCode}
        />
        <BracketColumn
          title="Round of 16"
          fixtures={left16}
          selectedNationCode={selectedNationCode}
          inset
        />
        <BracketColumn
          title="Quarter-finals"
          fixtures={leftQuarter}
          selectedNationCode={selectedNationCode}
          inset
        />
        <BracketColumn
          title="Semi-finals"
          fixtures={leftSemi}
          selectedNationCode={selectedNationCode}
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
          inset
        />
        <BracketColumn
          title="Quarter-finals"
          fixtures={rightQuarter}
          selectedNationCode={selectedNationCode}
          inset
        />
        <BracketColumn
          title="Round of 16"
          fixtures={right16}
          selectedNationCode={selectedNationCode}
          inset
        />
        <BracketColumn
          title="Round of 32"
          fixtures={right32}
          selectedNationCode={selectedNationCode}
        />
      </div>
    </div>
  );
}

function BracketColumn({
  title,
  fixtures,
  selectedNationCode,
  inset = false,
}: {
  title: string;
  fixtures: TournamentFixture[];
  selectedNationCode: string;
  inset?: boolean;
}) {
  return (
    <section className="flex min-h-[31rem] flex-col">
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
      className={`w-full rounded-xl border p-2 text-[10px] ${
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
        flag={fixture.home.flag}
        score={fixture.homeGoals}
        winner={fixture.winner?.code === fixture.home.code}
      />
      <FixtureTeam
        name={fixture.away.name}
        flag={fixture.away.flag}
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
