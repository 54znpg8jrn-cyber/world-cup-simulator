import { getPlayersByNation } from "../../data/players";
import { NATIONS, WORLD_CUP_GROUPS } from "../data/groups";
import type {
  Nation,
  TournamentAwards,
  TournamentFixture,
  TournamentRound,
  TournamentRoundResults,
} from "./types";

const knockoutRounds: Array<Exclude<TournamentRound, "Group Stage">> = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
];

function randomScore() {
  let goals = 0;
  for (let chance = 0; chance < 5; chance += 1) {
    if (Math.random() < 0.27) goals += 1;
  }
  return goals;
}

function quickFixture(
  id: string,
  round: TournamentRound,
  home: Nation,
  away: Nation,
): TournamentFixture {
  let homeGoals = randomScore();
  let awayGoals = randomScore();
  if (round !== "Group Stage" && homeGoals === awayGoals) {
    if (Math.random() < home.strength / (home.strength + away.strength)) homeGoals += 1;
    else awayGoals += 1;
  }
  const winner =
    homeGoals === awayGoals ? undefined : homeGoals > awayGoals ? home : away;
  return {
    id,
    round,
    home,
    away,
    homeGoals,
    awayGoals,
    winner,
    isUpset: Boolean(winner && winner.strength + 4 < (winner.code === home.code ? away : home).strength),
  };
}

export function createBackgroundGroupResults(selectedNation: Nation) {
  return Object.entries(WORLD_CUP_GROUPS).flatMap(([groupName, nations]) => {
    const fixtures: TournamentFixture[] = [];
    for (let home = 0; home < nations.length; home += 1) {
      for (let away = home + 1; away < nations.length; away += 1) {
        if (
          nations[home].code === selectedNation.code ||
          nations[away].code === selectedNation.code
        ) {
          continue;
        }
        fixtures.push(
          quickFixture(
            `group-${groupName}-${home}-${away}`,
            "Group Stage",
            nations[home],
            nations[away],
          ),
        );
      }
    }
    return fixtures;
  });
}

export function createKnockoutRoundResults(
  round: Exclude<TournamentRound, "Group Stage">,
  selectedNation: Nation,
  opponent: Nation,
  userGoals: number,
  opponentGoals: number,
): TournamentRoundResults {
  const fixtureCount = {
    "Round of 32": 16,
    "Round of 16": 8,
    "Quarter-final": 4,
    "Semi-final": 2,
    Final: 1,
  }[round];
  const userFixture: TournamentFixture = {
    id: `${round}-user`,
    round,
    home: selectedNation,
    away: opponent,
    homeGoals: userGoals,
    awayGoals: opponentGoals,
    winner: userGoals > opponentGoals ? selectedNation : opponent,
    isUserMatch: true,
    isUpset:
      (userGoals > opponentGoals ? selectedNation : opponent).strength + 4 <
      (userGoals > opponentGoals ? opponent : selectedNation).strength,
  };
  const pool = NATIONS.filter(
    (nation) =>
      nation.code !== selectedNation.code && nation.code !== opponent.code,
  ).sort(() => Math.random() - 0.5);
  const fixtures = [userFixture];
  for (let index = 0; fixtures.length < fixtureCount; index += 2) {
    fixtures.push(
      quickFixture(
        `${round}-${fixtures.length}`,
        round,
        pool[index % pool.length],
        pool[(index + 1) % pool.length],
      ),
    );
  }
  return { round, fixtures };
}

function starFor(nation: Nation, positions?: string[]) {
  const squad = getPlayersByNation(nation.name).filter(
    (player) => !positions || positions.includes(player.position),
  );
  return [...squad].sort((a, b) => b.rating - a.rating)[0];
}

export function createTournamentAwards(
  rounds: TournamentRoundResults[],
  selectedNation: Nation,
  scorers: Record<string, number>,
): TournamentAwards {
  const final = rounds.find((round) => round.round === "Final")?.fixtures[0];
  const fallbackWinner = [...NATIONS].sort((a, b) => b.strength - a.strength)[0];
  const winner = final?.winner ?? fallbackWinner;
  const runnerUp = final
    ? final.winner?.code === final.home.code
      ? final.away
      : final.home
    : [...NATIONS].sort((a, b) => b.strength - a.strength)[1];
  const globalStars = NATIONS.map((nation) => ({
    nation,
    player: starFor(nation),
  }))
    .filter((entry) => entry.player)
    .sort((a, b) => b.player.rating - a.player.rating);
  const selectedTopScorer = Object.entries(scorers).sort((a, b) => b[1] - a[1])[0];
  const goldenBootStar = selectedTopScorer
    ? { name: selectedTopScorer[0], nation: selectedNation.name, goals: Math.max(5, selectedTopScorer[1]) }
    : { name: globalStars[0].player.name, nation: globalStars[0].nation.name, goals: 7 };
  const bestKeeper = starFor(winner, ["GK"]) ?? starFor(runnerUp, ["GK"]);
  const youngPool = globalStars.filter((entry) => entry.player.caps < 35);

  return {
    winner,
    runnerUp,
    finalScore: final ? `${final.homeGoals}-${final.awayGoals}` : "2-1",
    goldenBoot: goldenBootStar,
    playerOfTournament: {
      name: starFor(winner)?.name ?? globalStars[0].player.name,
      nation: winner.name,
    },
    bestGoalkeeper: {
      name: bestKeeper?.name ?? "Tournament goalkeeper",
      nation: winner.name,
    },
    bestYoungPlayer: {
      name: youngPool[0]?.player.name ?? globalStars[1].player.name,
      nation: youngPool[0]?.nation.name ?? globalStars[1].nation.name,
    },
  };
}

export function ensureCompleteBracket(
  currentRounds: TournamentRoundResults[],
  selectedNation: Nation,
) {
  const rounds = [...currentRounds];
  let featured = selectedNation;
  for (const round of knockoutRounds) {
    if (rounds.some((item) => item.round === round)) {
      featured =
        rounds.find((item) => item.round === round)?.fixtures[0]?.winner ?? featured;
      continue;
    }
    const opponent =
      NATIONS.find(
        (nation) =>
          nation.code !== featured.code &&
          !rounds.some((item) =>
            item.fixtures.some(
              (fixture) =>
                fixture.home.code === nation.code || fixture.away.code === nation.code,
            ),
          ),
      ) ?? NATIONS.find((nation) => nation.code !== featured.code)!;
    const featuredGoals = randomScore();
    const opponentGoals = featuredGoals === 0 ? 1 : Math.max(0, featuredGoals - 1);
    const generated = createKnockoutRoundResults(
      round,
      featured,
      opponent,
      featuredGoals,
      opponentGoals,
    );
    rounds.push(generated);
    featured = generated.fixtures[0].winner ?? featured;
  }
  return rounds;
}
