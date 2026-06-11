import type { Player } from "./types";

export interface TeamRatings {
  overall: number | null;
  attack: number | null;
  midfield: number | null;
  defense: number | null;
  filled: number;
}

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;

export function calculateTeamRatings(players: (Player | undefined)[]): TeamRatings {
  const selected = players.filter((player): player is Player => Boolean(player));
  return {
    overall: average(selected.map((player) => player.rating)),
    attack: average(selected.map((player) => player.attack)),
    midfield: average(selected.map((player) => player.midfield)),
    defense: average(selected.map((player) => player.defense)),
    filled: selected.length,
  };
}
