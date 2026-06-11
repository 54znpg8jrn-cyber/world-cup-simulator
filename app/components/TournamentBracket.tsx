import type { TournamentRoundResults } from "../lib/types";

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

  return (
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[62rem] grid-flow-col auto-cols-[11.5rem] gap-3">
        {rounds.map((round) => (
          <section key={round.round}>
            <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#d8b75b]">
              {round.round}
            </h3>
            <div className="space-y-2">
              {round.fixtures.map((fixture) => {
                const highlighted =
                  fixture.home.code === selectedNationCode ||
                  fixture.away.code === selectedNationCode;
                return (
                  <div
                    key={fixture.id}
                    className={`rounded-xl border p-2 text-[10px] ${
                      highlighted
                        ? "border-[#d8b75b]/40 bg-[#d8b75b]/10"
                        : "border-white/8 bg-white/[0.035]"
                    }`}
                  >
                    {fixture.matchNumber ? (
                      <p className="mb-1 text-[8px] font-black uppercase tracking-wider text-white/25">
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
                      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-amber-300">
                        Upset
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
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
    <div className={`flex items-center gap-1.5 py-0.5 ${winner ? "font-black text-white" : "text-white/55"}`}>
      <span>{flag}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span>{score}</span>
    </div>
  );
}
