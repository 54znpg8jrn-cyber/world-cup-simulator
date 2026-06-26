import { PLAYERS } from "../../../data/players";
import { NATIONS } from "../data";

export type RankingItemType = "player" | "nation";

export type RankingItem = {
  id: string;
  label: string;
  meta: string;
  type: RankingItemType;
};

export type RankingCategory = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  itemType: RankingItemType;
  seedIds: string[];
};

const nationItems = NATIONS.map((nation) => ({
  id: `nation-${nation.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  label: nation.name,
  meta: "World Cup nation",
  type: "nation" as const,
}));

const playerItems = PLAYERS.map((player) => ({
  id: player.id,
  label: player.name,
  meta: `${player.nation} · ${player.club}`,
  type: "player" as const,
}));

const itemByName = new Map([...playerItems, ...nationItems].map((item) => [item.label, item]));

function ids(names: string[]) {
  return names
    .map((name) => itemByName.get(name)?.id)
    .filter((id): id is string => Boolean(id));
}

function topPlayers(position?: "FW" | "MF" | "DF" | "GK") {
  return PLAYERS
    .filter((player) => !position || player.position === position)
    .sort((left, right) => right.rating - left.rating || right.caps - left.caps)
    .slice(0, 24)
    .map((player) => player.id);
}

function topNations(metric: "rating" | "attack" | "defense" | "experience" | "goals") {
  return [...NATIONS]
    .map((nation) => {
      const players = PLAYERS.filter((player) => player.nation === nation.name);
      const value = metric === "rating"
        ? average(players.map((player) => player.rating))
        : metric === "attack"
          ? average(players.map((player) => player.attack))
          : metric === "defense"
            ? average(players.map((player) => player.defense))
            : metric === "experience"
              ? players.reduce((total, player) => total + player.caps, 0)
              : players.reduce((total, player) => total + player.goals, 0);
      return { nation, value };
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 24)
    .map(({ nation }) => nationItems.find((item) => item.label === nation.name)?.id)
    .filter((id): id is string => Boolean(id));
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

export const RANKING_ITEMS: RankingItem[] = [...playerItems, ...nationItems];

export const RANKING_CATEGORIES: RankingCategory[] = [
  {
    id: "players-right-now",
    label: "Top World Cup players right now",
    shortLabel: "World Cup players",
    description: "The platform's premium player ranking, seeded from rating, status, and squad role.",
    itemType: "player",
    seedIds: ids(["Kylian Mbappe", "Lionel Messi", "Jude Bellingham", "Lamine Yamal", "Vinicius Junior", "Harry Kane", "Rodri", "Federico Valverde", "Neymar Jr", "Bukayo Saka"]).concat(topPlayers()),
  },
  {
    id: "young-stars",
    label: "Top young stars",
    shortLabel: "Young stars",
    description: "The next-wave names fans will argue about all tournament.",
    itemType: "player",
    seedIds: ids(["Lamine Yamal", "Jude Bellingham", "Jamal Musiala", "Pedri", "Bukayo Saka", "Nico Paz", "Thiago Almada", "Paul Wanner", "Ibrahim Maza", "Nestory Irankunda"]).concat(topPlayers()),
  },
  {
    id: "attackers",
    label: "Top attackers",
    shortLabel: "Attackers",
    description: "Forwards and wide threats ranked for content debates.",
    itemType: "player",
    seedIds: ids(["Kylian Mbappe", "Lionel Messi", "Vinicius Junior", "Harry Kane", "Lamine Yamal", "Neymar Jr", "Lautaro Martinez", "Bukayo Saka", "Julian Alvarez", "Riyad Mahrez"]).concat(topPlayers("FW")),
  },
  {
    id: "midfielders",
    label: "Top midfielders",
    shortLabel: "Midfielders",
    description: "Controllers, creators, runners, and big-match midfielders.",
    itemType: "player",
    seedIds: ids(["Jude Bellingham", "Rodri", "Federico Valverde", "Pedri", "Jamal Musiala", "Alexis Mac Allister", "Enzo Fernandez", "Bruno Fernandes", "James Rodriguez", "Marcel Sabitzer"]).concat(topPlayers("MF")),
  },
  {
    id: "defenders",
    label: "Top defenders",
    shortLabel: "Defenders",
    description: "Centre-backs, full-backs, and defensive leaders.",
    itemType: "player",
    seedIds: ids(["Virgil van Dijk", "William Saliba", "Ruben Dias", "Achraf Hakimi", "Cristian Romero", "David Alaba", "Ramy Bensebaini", "Lisandro Martinez", "Nicolas Otamendi", "Rayan Ait-Nouri"]).concat(topPlayers("DF")),
  },
  {
    id: "goalkeepers",
    label: "Top goalkeepers",
    shortLabel: "Goalkeepers",
    description: "Shot-stoppers and penalty-night main characters.",
    itemType: "player",
    seedIds: ids(["Thibaut Courtois", "Alisson", "Emiliano Martinez", "Mathew Ryan", "Juan Musso", "Geronimo Rulli", "Alexander Schlager", "Oussama Benbot"]).concat(topPlayers("GK")),
  },
  {
    id: "underrated",
    label: "Most underrated players",
    shortLabel: "Underrated players",
    description: "Players who make teams better without always owning the headline.",
    itemType: "player",
    seedIds: ids(["Federico Valverde", "Alexis Mac Allister", "William Saliba", "Rodri", "Hicham Boudaoui", "Konrad Laimer", "Jackson Irvine", "Rayan Ait-Nouri", "Amine Gouiri", "Fares Chaibi"]).concat(topPlayers()),
  },
  {
    id: "overrated",
    label: "Most overrated players",
    shortLabel: "Overrated debate",
    description: "A spicy debate seed. Edit it before posting if your group chat disagrees.",
    itemType: "player",
    seedIds: ids(["Neymar Jr", "Riyad Mahrez", "James Rodriguez", "Cristiano Ronaldo", "Harry Kane", "Lionel Messi", "Kylian Mbappe", "Vinicius Junior", "Jude Bellingham", "Lamine Yamal"]).concat(topPlayers()),
  },
  {
    id: "captains",
    label: "Best captains",
    shortLabel: "Captains",
    description: "Leadership, aura, and pressure-proof tournament profiles.",
    itemType: "player",
    seedIds: ids(["Lionel Messi", "Virgil van Dijk", "Harry Kane", "Cristiano Ronaldo", "Riyad Mahrez", "Nicolas Otamendi", "Mathew Ryan", "Ruben Dias", "Achraf Hakimi", "David Alaba"]).concat(topPlayers()),
  },
  {
    id: "penalties",
    label: "Best penalty takers",
    shortLabel: "Penalty takers",
    description: "The names you want walking up in the 120th minute.",
    itemType: "player",
    seedIds: ids(["Lionel Messi", "Harry Kane", "Kylian Mbappe", "Cristiano Ronaldo", "Bruno Fernandes", "Neymar Jr", "Riyad Mahrez", "James Rodriguez", "Lautaro Martinez", "Marcel Sabitzer"]).concat(topPlayers()),
  },
  {
    id: "best-teams",
    label: "Best World Cup teams right now",
    shortLabel: "Best teams",
    description: "Simulator squad strength converted into a content ranking.",
    itemType: "nation",
    seedIds: ids(["France", "Argentina", "Brazil", "England", "Spain", "Portugal", "Germany", "Netherlands", "Uruguay", "Belgium"]).concat(topNations("rating")),
  },
  {
    id: "likely-winners",
    label: "Most likely to win the World Cup",
    shortLabel: "World Cup winners",
    description: "A blend of squad quality, stars, and tournament ceiling.",
    itemType: "nation",
    seedIds: ids(["France", "Argentina", "Brazil", "England", "Spain", "Portugal", "Germany", "Netherlands", "Uruguay", "Morocco"]).concat(topNations("rating")),
  },
  {
    id: "attacking-teams",
    label: "Best attacking teams",
    shortLabel: "Attacking teams",
    description: "Nations stacked with forwards, creators, and goals.",
    itemType: "nation",
    seedIds: ids(["France", "Brazil", "Argentina", "England", "Spain", "Portugal", "Netherlands", "Uruguay", "Colombia", "Algeria"]).concat(topNations("attack")),
  },
  {
    id: "defensive-teams",
    label: "Best defensive teams",
    shortLabel: "Defensive teams",
    description: "Back lines and keepers that can survive knockout chaos.",
    itemType: "nation",
    seedIds: ids(["France", "Netherlands", "Portugal", "England", "Argentina", "Spain", "Morocco", "Brazil", "Germany", "Uruguay"]).concat(topNations("defense")),
  },
  {
    id: "dark-horses",
    label: "Dark horses",
    shortLabel: "Dark horses",
    description: "Teams with enough punch to ruin a favorite's month.",
    itemType: "nation",
    seedIds: ids(["Morocco", "Uruguay", "Colombia", "Senegal", "Austria", "Switzerland", "Japan", "Algeria", "Ecuador", "Canada"]).concat(topNations("attack")),
  },
  {
    id: "disappointments",
    label: "Biggest disappointments",
    shortLabel: "Disappointments",
    description: "The danger-zone ranking. Pure group chat fuel.",
    itemType: "nation",
    seedIds: ids(["England", "Portugal", "Belgium", "Germany", "Brazil", "Netherlands", "Spain", "Argentina", "Italy", "USA"]).concat(topNations("rating")),
  },
  {
    id: "squads-on-paper",
    label: "Best squads on paper",
    shortLabel: "Squads on paper",
    description: "Depth, star power, and simulator ratings before the ball rolls.",
    itemType: "nation",
    seedIds: ids(["France", "England", "Brazil", "Argentina", "Spain", "Portugal", "Germany", "Netherlands", "Belgium", "Uruguay"]).concat(topNations("rating")),
  },
];

export function getRankingCategory(categoryId: string) {
  return RANKING_CATEGORIES.find((category) => category.id === categoryId) ?? RANKING_CATEGORIES[0];
}

export function getRankingItemsForCategory(category: RankingCategory) {
  const seen = new Set<string>();
  const categoryItems = category.seedIds
    .map((id) => RANKING_ITEMS.find((item) => item.id === id))
    .filter((item): item is RankingItem => Boolean(item))
    .filter((item) => {
      if (seen.has(item.id) || item.type !== category.itemType) return false;
      seen.add(item.id);
      return true;
    });
  const fallbackItems = RANKING_ITEMS.filter((item) => item.type === category.itemType && !seen.has(item.id));
  return [...categoryItems, ...fallbackItems];
}
