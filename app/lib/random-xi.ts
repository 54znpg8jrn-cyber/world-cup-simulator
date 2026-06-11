import { getPlayersByNation } from "../../data/players";
import type { PitchSlot, Player, PositionCategory } from "./types";

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function poolByCategory(
  players: Player[],
  usedIds: Set<string>,
): Record<PositionCategory, Player[]> {
  const available = players.filter((player) => !usedIds.has(player.id));
  return {
    GK: available
      .filter((player) => player.position === "GK")
      .sort((a, b) => b.rating - a.rating),
    DF: available
      .filter((player) => player.position === "DF")
      .sort((a, b) => b.rating - a.rating),
    MF: available
      .filter((player) => player.position === "MF")
      .sort((a, b) => b.rating - a.rating),
    FW: available
      .filter((player) => player.position === "FW")
      .sort((a, b) => b.rating - a.rating),
  };
}

export function generateRandomXI(
  nationName: string,
  slots: PitchSlot[],
): Record<string, Player> {
  const allPlayers = getPlayersByNation(nationName);
  const usedIds = new Set<string>();
  const selections: Record<string, Player> = {};

  for (const slot of slots) {
    const pools = poolByCategory(allPlayers, usedIds);
    let player = pickRandom(pools[slot.category]);

    if (!player) {
      const fallback = allPlayers
        .filter((candidate) => !usedIds.has(candidate.id))
        .sort((a, b) => b.rating - a.rating)[0];
      player = fallback;
    }

    if (player) {
      selections[slot.id] = player;
      usedIds.add(player.id);
    }
  }

  return selections;
}
