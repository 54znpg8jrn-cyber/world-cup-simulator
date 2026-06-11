import { getPlayersByNation } from "../../data/players";
import { NATIONS } from "../data/groups";
import type { Nation } from "./types";

export type TournamentForm = Record<string, number>;

const reputationBoosts: Record<string, number> = {
  Argentina: 5,
  Brazil: 5,
  France: 5,
  England: 4.5,
  Spain: 4.5,
  Germany: 4,
  Portugal: 4,
  Netherlands: 3.5,
  Belgium: 3,
  Croatia: 3,
  Uruguay: 3,
  Morocco: 2.5,
  Switzerland: 2,
  USA: 2,
  Mexico: 2,
  Japan: 2,
  Senegal: 2,
};

export function createTournamentForm(): TournamentForm {
  return Object.fromEntries(
    NATIONS.map((nation) => [
      nation.code,
      Number((Math.random() * 6 - 3).toFixed(2)),
    ]),
  );
}

export function getNationStrength(
  nation: Nation,
  form: TournamentForm = {},
  lineupRating?: number,
) {
  const squad = getPlayersByNation(nation.name);
  const squadAverage = squad.length
    ? squad.reduce((sum, player) => sum + player.rating, 0) / squad.length
    : nation.strength;
  const ratingBase = lineupRating ?? squadAverage;
  return Math.max(
    62,
    Math.min(
      94,
      ratingBase +
        (reputationBoosts[nation.name] ?? 0) +
        (form[nation.code] ?? 0),
    ),
  );
}
