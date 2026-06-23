export const HIGHER_LOWER_CATEGORIES = {
  "world-cup-titles": {
    label: "World Cup Titles",
    statLabel: "World Cup titles",
  },
  "world-cup-goals": {
    label: "Most World Cup Goals",
    statLabel: "World Cup goals",
  },
  "world-cup-assists": {
    label: "Most World Cup Assists",
    statLabel: "World Cup assists",
  },
  "world-cup-appearances": {
    label: "Most World Cup Appearances",
    statLabel: "World Cup appearances",
  },
  "world-cup-tournaments": {
    label: "Most World Cup Tournaments Played",
    statLabel: "World Cup tournaments played",
  },
  "world-cup-clean-sheets": {
    label: "Most World Cup Clean Sheets",
    statLabel: "World Cup clean sheets",
  },
  "world-cup-goals-by-nation": {
    label: "Most World Cup Goals by Nation",
    statLabel: "World Cup goals by nation",
  },
  "world-cup-finals": {
    label: "Most World Cup Finals Reached",
    statLabel: "World Cup finals reached",
  },
  "world-cup-wins": {
    label: "Most World Cup Wins by Nation",
    statLabel: "World Cup wins by nation",
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
  type: "nation" | "stadium" | "club" | "player";
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
  ...createItems("world-cup-goals", "player", [
    ["Miroslav Klose", 16, "16 goals", "🇩🇪"],
    ["Ronaldo", 15, "15 goals", "🇧🇷"],
    ["Gerd Müller", 14, "14 goals", "🇩🇪"],
    ["Just Fontaine", 13, "13 goals", "🇫🇷"],
    ["Lionel Messi", 18, "18 goals", "🇦🇷"],
    ["Pelé", 12, "12 goals", "🇧🇷"],
    ["Kylian Mbappé", 16, "16 goals", "🇫🇷"],
    ["Jürgen Klinsmann", 11, "11 goals", "🇩🇪"],
    ["Gabriel Batistuta", 10, "10 goals", "🇦🇷"],
    ["Gary Lineker", 10, "10 goals", "🏴"],
  ]),
  ...createItems("world-cup-assists", "player", [
    ["Pelé", 10, "10 assists", "🇧🇷"],
    ["Lionel Messi", 8, "8 assists", "🇦🇷"],
    ["Diego Maradona", 8, "8 assists", "🇦🇷"],
    ["Grzegorz Lato", 7, "7 assists", "🇵🇱"],
    ["Lothar Matthäus", 7, "7 assists", "🇩🇪"],
    ["Thomas Müller", 6, "6 assists", "🇩🇪"],
    ["Bastian Schweinsteiger", 6, "6 assists", "🇩🇪"],
    ["Kevin De Bruyne", 5, "5 assists", "🇧🇪"],
    ["James Rodríguez", 5, "5 assists", "🇨🇴"],
    ["Kylian Mbappé", 5, "5 assists", "🇫🇷"],
  ]),
  ...createItems("world-cup-appearances", "player", [
    ["Lionel Messi", 26, "26 matches", "🇦🇷"],
    ["Lothar Matthäus", 25, "25 matches", "🇩🇪"],
    ["Miroslav Klose", 24, "24 matches", "🇩🇪"],
    ["Paolo Maldini", 23, "23 matches", "🇮🇹"],
    ["Cristiano Ronaldo", 22, "22 matches", "🇵🇹"],
    ["Diego Maradona", 21, "21 matches", "🇦🇷"],
    ["Uwe Seeler", 21, "21 matches", "🇩🇪"],
    ["Philipp Lahm", 20, "20 matches", "🇩🇪"],
    ["Antoine Griezmann", 19, "19 matches", "🇫🇷"],
    ["Kylian Mbappé", 14, "14 matches", "🇫🇷"],
  ]),
  ...createItems("world-cup-tournaments", "player", [
    ["Antonio Carbajal", 5, "5 tournaments", "🇲🇽"],
    ["Lothar Matthäus", 5, "5 tournaments", "🇩🇪"],
    ["Rafael Márquez", 5, "5 tournaments", "🇲🇽"],
    ["Gianluigi Buffon", 5, "5 tournaments", "🇮🇹"],
    ["Lionel Messi", 5, "5 tournaments", "🇦🇷"],
    ["Cristiano Ronaldo", 5, "5 tournaments", "🇵🇹"],
    ["Pelé", 4, "4 tournaments", "🇧🇷"],
    ["Miroslav Klose", 4, "4 tournaments", "🇩🇪"],
    ["Cafu", 4, "4 tournaments", "🇧🇷"],
    ["Diego Maradona", 4, "4 tournaments", "🇦🇷"],
  ]),
  ...createItems("world-cup-clean-sheets", "player", [
    ["Peter Shilton", 10, "10 clean sheets", "🏴"],
    ["Fabien Barthez", 10, "10 clean sheets", "🇫🇷"],
    ["Dino Zoff", 8, "8 clean sheets", "🇮🇹"],
    ["Sepp Maier", 8, "8 clean sheets", "🇩🇪"],
    ["Manuel Neuer", 7, "7 clean sheets", "🇩🇪"],
    ["Iker Casillas", 6, "6 clean sheets", "🇪🇸"],
    ["Gianluigi Buffon", 5, "5 clean sheets", "🇮🇹"],
    ["Claudio Taffarel", 5, "5 clean sheets", "🇧🇷"],
    ["Hugo Lloris", 5, "5 clean sheets", "🇫🇷"],
    ["Thibaut Courtois", 4, "4 clean sheets", "🇧🇪"],
  ]),
  ...createItems("world-cup-goals-by-nation", "nation", [
    ["Brazil", 237, "237 goals", "🇧🇷"],
    ["Germany", 232, "232 goals", "🇩🇪"],
    ["Argentina", 152, "152 goals", "🇦🇷"],
    ["France", 136, "136 goals", "🇫🇷"],
    ["Italy", 128, "128 goals", "🇮🇹"],
    ["England", 104, "104 goals", "🏴"],
    ["Spain", 99, "99 goals", "🇪🇸"],
    ["Netherlands", 96, "96 goals", "🇳🇱"],
    ["Uruguay", 89, "89 goals", "🇺🇾"],
    ["Hungary", 87, "87 goals", "🇭🇺"],
  ]),
  ...createItems("world-cup-finals", "nation", [
    ["Germany", 8, "8 finals", "🇩🇪"],
    ["Brazil", 7, "7 finals", "🇧🇷"],
    ["Italy", 6, "6 finals", "🇮🇹"],
    ["Argentina", 6, "6 finals", "🇦🇷"],
    ["France", 4, "4 finals", "🇫🇷"],
    ["Netherlands", 3, "3 finals", "🇳🇱"],
    ["Uruguay", 2, "2 finals", "🇺🇾"],
    ["Hungary", 2, "2 finals", "🇭🇺"],
    ["Czechia", 2, "2 finals", "🇨🇿"],
    ["England", 1, "1 final", "🏴"],
  ]),
  ...createItems("world-cup-wins", "nation", [
    ["Brazil", 76, "76 wins", "🇧🇷"],
    ["Germany", 68, "68 wins", "🇩🇪"],
    ["Argentina", 47, "47 wins", "🇦🇷"],
    ["Italy", 45, "45 wins", "🇮🇹"],
    ["France", 39, "39 wins", "🇫🇷"],
    ["Spain", 31, "31 wins", "🇪🇸"],
    ["England", 30, "30 wins", "🏴"],
    ["Netherlands", 30, "30 wins", "🇳🇱"],
    ["Uruguay", 25, "25 wins", "🇺🇾"],
    ["Belgium", 21, "21 wins", "🇧🇪"],
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
