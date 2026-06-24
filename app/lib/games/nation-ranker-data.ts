import { getPlayersByNation } from "../../../data/players";
import { NATIONS } from "../data";

export type NationRankerMode = "best" | "worst";

export type NationRankerCategory = {
  id: string;
  label: string;
  description: string;
  mode: NationRankerMode;
  values: Record<string, number>;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function valuesFrom(metric: (nation: string) => number) {
  return Object.fromEntries(NATIONS.map((nation) => [nation.name, metric(nation.name)]));
}

function averageRating(nation: string) {
  const players = getPlayersByNation(nation);
  return round(players.reduce((total, player) => total + player.rating, 0) / players.length);
}

// These values deliberately come from the simulator squad dataset rather than a
// transient third-party feed. Swap this layer when live nation statistics are added.
export const NATION_RANKER_CATEGORIES: NationRankerCategory[] = [
  {
    id: "squad-strength",
    label: "Strongest simulator squad",
    description: "Average squad rating from World Cup Games data.",
    mode: "best",
    values: valuesFrom(averageRating),
  },
  {
    id: "squad-experience",
    label: "Most international experience",
    description: "Total international caps across the squad.",
    mode: "best",
    values: valuesFrom((nation) => getPlayersByNation(nation).reduce((total, player) => total + player.caps, 0)),
  },
  {
    id: "squad-goals",
    label: "Most international goals",
    description: "Total international goals across the squad.",
    mode: "best",
    values: valuesFrom((nation) => getPlayersByNation(nation).reduce((total, player) => total + player.goals, 0)),
  },
  {
    id: "squad-attack",
    label: "Strongest attack",
    description: "Average attack rating from the simulator.",
    mode: "best",
    values: valuesFrom((nation) => round(getPlayersByNation(nation).reduce((total, player) => total + player.attack, 0) / getPlayersByNation(nation).length)),
  },
  {
    id: "squad-defense",
    label: "Strongest defense",
    description: "Average defense rating from the simulator.",
    mode: "best",
    values: valuesFrom((nation) => round(getPlayersByNation(nation).reduce((total, player) => total + player.defense, 0) / getPlayersByNation(nation).length)),
  },
  {
    id: "lowest-squad-rating",
    label: "Lowest squad rating",
    description: "Average squad rating from the simulator.",
    mode: "worst",
    values: valuesFrom(averageRating),
  },
];

export function rankNations(category: NationRankerCategory, nations: string[]) {
  return [...nations].sort((left, right) => category.mode === "best"
    ? category.values[right] - category.values[left]
    : category.values[left] - category.values[right]);
}

