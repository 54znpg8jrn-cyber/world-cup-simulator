export const HIGHER_LOWER_CATEGORIES = {
  "world-cup-titles": {
    label: "World Cup Titles",
    statLabel: "World Cup titles",
  },
  "fifa-ranking": {
    label: "FIFA Ranking",
    statLabel: "FIFA ranking position",
  },
  population: {
    label: "Population",
    statLabel: "Population (2024)",
  },
  gdp: {
    label: "GDP",
    statLabel: "GDP (2024, US$)",
  },
  "stadium-capacity": {
    label: "Stadium Capacity",
    statLabel: "Stadium capacity",
  },
  "international-trophies": {
    label: "International Trophies",
    statLabel: "Major international trophies",
  },
} as const;

export type HigherLowerCategory = keyof typeof HIGHER_LOWER_CATEGORIES;

export interface HigherLowerItem {
  id: string;
  label: string;
  type: "nation" | "stadium" | "club";
  category: HigherLowerCategory;
  statLabel: string;
  value: number;
  display: string;
  flagOrEmoji: string;
}

type ItemSeed = readonly [string, number, string, string];

function createItems(
  category: HigherLowerCategory,
  type: HigherLowerItem["type"],
  items: readonly ItemSeed[],
): HigherLowerItem[] {
  const { statLabel } = HIGHER_LOWER_CATEGORIES[category];
  return items.map(([label, value, display, flagOrEmoji]) => ({
    id: `${category}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
    type,
    category,
    statLabel,
    value,
    display,
    flagOrEmoji,
  }));
}

// Snapshot-based categories keep each comparison stable between releases.
export const HIGHER_LOWER_ITEMS: HigherLowerItem[] = [
  ...createItems("world-cup-titles", "nation", [
    ["Brazil", 5, "5 titles", "🇧🇷"],
    ["Germany", 4, "4 titles", "🇩🇪"],
    ["Italy", 4, "4 titles", "🇮🇹"],
    ["Argentina", 3, "3 titles", "🇦🇷"],
    ["Uruguay", 2, "2 titles", "🇺🇾"],
    ["France", 2, "2 titles", "🇫🇷"],
    ["England", 1, "1 title", "🏴"],
    ["Spain", 1, "1 title", "🇪🇸"],
    ["Netherlands", 0, "0 titles", "🇳🇱"],
    ["Portugal", 0, "0 titles", "🇵🇹"],
    ["Belgium", 0, "0 titles", "🇧🇪"],
    ["Croatia", 0, "0 titles", "🇭🇷"],
  ]),
  ...createItems("fifa-ranking", "nation", [
    ["Argentina", 1, "Rank #1", "🇦🇷"],
    ["Spain", 2, "Rank #2", "🇪🇸"],
    ["France", 3, "Rank #3", "🇫🇷"],
    ["England", 4, "Rank #4", "🏴"],
    ["Brazil", 5, "Rank #5", "🇧🇷"],
    ["Portugal", 6, "Rank #6", "🇵🇹"],
    ["Netherlands", 7, "Rank #7", "🇳🇱"],
    ["Belgium", 8, "Rank #8", "🇧🇪"],
    ["Germany", 9, "Rank #9", "🇩🇪"],
    ["Croatia", 10, "Rank #10", "🇭🇷"],
    ["Italy", 11, "Rank #11", "🇮🇹"],
    ["Morocco", 12, "Rank #12", "🇲🇦"],
  ]),
  ...createItems("population", "nation", [
    ["India", 1451, "1.45B people", "🇮🇳"],
    ["China", 1419, "1.42B people", "🇨🇳"],
    ["United States", 345, "345M people", "🇺🇸"],
    ["Indonesia", 283, "283M people", "🇮🇩"],
    ["Pakistan", 252, "252M people", "🇵🇰"],
    ["Nigeria", 233, "233M people", "🇳🇬"],
    ["Brazil", 212, "212M people", "🇧🇷"],
    ["Bangladesh", 174, "174M people", "🇧🇩"],
    ["Russia", 144, "144M people", "🇷🇺"],
    ["Mexico", 130, "130M people", "🇲🇽"],
    ["Japan", 124, "124M people", "🇯🇵"],
    ["Ethiopia", 132, "132M people", "🇪🇹"],
  ]),
  ...createItems("gdp", "nation", [
    ["United States", 29298, "$29.3T GDP", "🇺🇸"],
    ["China", 18945, "$18.9T GDP", "🇨🇳"],
    ["Germany", 4684, "$4.7T GDP", "🇩🇪"],
    ["Japan", 4026, "$4.0T GDP", "🇯🇵"],
    ["India", 3913, "$3.9T GDP", "🇮🇳"],
    ["United Kingdom", 3644, "$3.6T GDP", "🇬🇧"],
    ["France", 3162, "$3.2T GDP", "🇫🇷"],
    ["Italy", 2373, "$2.4T GDP", "🇮🇹"],
    ["Canada", 2241, "$2.2T GDP", "🇨🇦"],
    ["Brazil", 2179, "$2.2T GDP", "🇧🇷"],
    ["Russia", 2174, "$2.2T GDP", "🇷🇺"],
    ["Mexico", 1853, "$1.9T GDP", "🇲🇽"],
  ]),
  ...createItems("stadium-capacity", "stadium", [
    ["Rungrado 1st of May Stadium", 114000, "114,000 seats", "🏟️"],
    ["Michigan Stadium", 107601, "107,601 seats", "🇺🇸"],
    ["Beaver Stadium", 106572, "106,572 seats", "🇺🇸"],
    ["Ohio Stadium", 102780, "102,780 seats", "🇺🇸"],
    ["Melbourne Cricket Ground", 100024, "100,024 seats", "🇦🇺"],
    ["Camp Nou", 99354, "99,354 seats", "🇪🇸"],
    ["FNB Stadium", 94736, "94,736 seats", "🇿🇦"],
    ["Rose Bowl", 92542, "92,542 seats", "🇺🇸"],
    ["Wembley Stadium", 90000, "90,000 seats", "🏴"],
    ["Lusail Stadium", 88966, "88,966 seats", "🇶🇦"],
    ["Estadio Azteca", 87523, "87,523 seats", "🇲🇽"],
    ["Bukit Jalil National Stadium", 87411, "87,411 seats", "🇲🇾"],
  ]),
  ...createItems("international-trophies", "club", [
    ["Real Madrid", 34, "34 major trophies", "🇪🇸"],
    ["Al Ahly", 27, "27 major trophies", "🇪🇬"],
    ["Barcelona", 22, "22 major trophies", "🇪🇸"],
    ["Boca Juniors", 22, "22 major trophies", "🇦🇷"],
    ["Independiente", 20, "20 major trophies", "🇦🇷"],
    ["AC Milan", 18, "18 major trophies", "🇮🇹"],
    ["Bayern Munich", 15, "15 major trophies", "🇩🇪"],
    ["Liverpool", 14, "14 major trophies", "🏴"],
    ["Manchester United", 8, "8 major trophies", "🏴"],
    ["Chelsea", 8, "8 major trophies", "🏴"],
    ["Inter Milan", 9, "9 major trophies", "🇮🇹"],
    ["Juventus", 6, "6 major trophies", "🇮🇹"],
  ]),
];
