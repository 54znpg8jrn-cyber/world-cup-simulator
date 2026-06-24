import { canPlayPosition, getPlayersByNation } from "../../../data/players";
import type { Player, PlayerPosition } from "../types";
import { NATIONS } from "../data";
import { NATION_CONFEDERATIONS } from "./wordle-players";

export type ClubLineupPlayer = {
  id: string;
  name: string;
  club: string;
  position: string;
};

export type NationClubPuzzle = {
  nation: string;
  confederation: string;
  lineup: ClubLineupPlayer[];
};

const FORMATION: Array<{ position: string; category: PlayerPosition }> = [
  { position: "GK", category: "GK" },
  { position: "RB", category: "DF" },
  { position: "CB", category: "DF" },
  { position: "CB", category: "DF" },
  { position: "LB", category: "DF" },
  { position: "CM", category: "MF" },
  { position: "CM", category: "MF" },
  { position: "CAM", category: "MF" },
  { position: "RW", category: "FW" },
  { position: "ST", category: "FW" },
  { position: "LW", category: "FW" },
];

function clubLabel(club: string) {
  return club.replace(/\s+\([A-Z]{3}\)$/, "");
}

function preferredPlayers(players: Player[], position: string, category: PlayerPosition, used: Set<string>) {
  const available = players.filter((player) => !used.has(player.id));
  const exact = available.filter((player) => canPlayPosition(player, position as Player["positions"][number]));
  const categoryFallback = available.filter((player) => player.position === category);
  return (exact.length ? exact : categoryFallback).sort((a, b) => b.rating - a.rating || b.caps - a.caps);
}

export function createClubPuzzle(nation: string): NationClubPuzzle | null {
  const players = getPlayersByNation(nation);
  const used = new Set<string>();
  const lineup = FORMATION.map(({ position, category }) => {
    const player = preferredPlayers(players, position, category, used)[0];
    if (!player) return null;
    used.add(player.id);
    return { id: player.id, name: player.name, club: clubLabel(player.club), position };
  });

  if (lineup.some((player) => player === null)) return null;
  return {
    nation,
    confederation: NATION_CONFEDERATIONS[nation] ?? "Unknown confederation",
    lineup: lineup as ClubLineupPlayer[],
  };
}

export const CLUB_PUZZLE_NATIONS = NATIONS
  .map((nation) => nation.name)
  .filter((nation) => createClubPuzzle(nation) !== null);

export function getDailyClubPuzzle(day: string) {
  let hash = 0;
  for (const character of day) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return createClubPuzzle(CLUB_PUZZLE_NATIONS[hash % CLUB_PUZZLE_NATIONS.length]);
}

