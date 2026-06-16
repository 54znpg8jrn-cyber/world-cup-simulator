export interface HigherLowerItem {
  id: string;
  label: string;
  type: "team" | "player" | "record";
  statLabel: string;
  value: number;
  display: string;
  flagOrEmoji: string;
}

export const HIGHER_LOWER_ITEMS: HigherLowerItem[] = [
  { id: "titles-brazil", label: "Brazil", type: "team", statLabel: "World Cup titles", value: 5, display: "5 titles", flagOrEmoji: "🇧🇷" },
  { id: "titles-germany", label: "Germany", type: "team", statLabel: "World Cup titles", value: 4, display: "4 titles", flagOrEmoji: "🇩🇪" },
  { id: "titles-italy", label: "Italy", type: "team", statLabel: "World Cup titles", value: 4, display: "4 titles", flagOrEmoji: "🇮🇹" },
  { id: "titles-argentina", label: "Argentina", type: "team", statLabel: "World Cup titles", value: 3, display: "3 titles", flagOrEmoji: "🇦🇷" },
  { id: "titles-france", label: "France", type: "team", statLabel: "World Cup titles", value: 2, display: "2 titles", flagOrEmoji: "🇫🇷" },
  { id: "titles-uruguay", label: "Uruguay", type: "team", statLabel: "World Cup titles", value: 2, display: "2 titles", flagOrEmoji: "🇺🇾" },
  { id: "titles-england", label: "England", type: "team", statLabel: "World Cup titles", value: 1, display: "1 title", flagOrEmoji: "🏴" },
  { id: "titles-spain", label: "Spain", type: "team", statLabel: "World Cup titles", value: 1, display: "1 title", flagOrEmoji: "🇪🇸" },
  { id: "titles-netherlands", label: "Netherlands", type: "team", statLabel: "World Cup titles", value: 0, display: "0 titles", flagOrEmoji: "🇳🇱" },
  { id: "titles-portugal", label: "Portugal", type: "team", statLabel: "World Cup titles", value: 0, display: "0 titles", flagOrEmoji: "🇵🇹" },
  { id: "titles-croatia", label: "Croatia", type: "team", statLabel: "World Cup titles", value: 0, display: "0 titles", flagOrEmoji: "🇭🇷" },
  { id: "titles-belgium", label: "Belgium", type: "team", statLabel: "World Cup titles", value: 0, display: "0 titles", flagOrEmoji: "🇧🇪" },

  { id: "apps-brazil", label: "Brazil", type: "team", statLabel: "World Cup appearances", value: 22, display: "22 appearances", flagOrEmoji: "🇧🇷" },
  { id: "apps-germany", label: "Germany", type: "team", statLabel: "World Cup appearances", value: 20, display: "20 appearances", flagOrEmoji: "🇩🇪" },
  { id: "apps-italy", label: "Italy", type: "team", statLabel: "World Cup appearances", value: 18, display: "18 appearances", flagOrEmoji: "🇮🇹" },
  { id: "apps-argentina", label: "Argentina", type: "team", statLabel: "World Cup appearances", value: 18, display: "18 appearances", flagOrEmoji: "🇦🇷" },
  { id: "apps-mexico", label: "Mexico", type: "team", statLabel: "World Cup appearances", value: 17, display: "17 appearances", flagOrEmoji: "🇲🇽" },
  { id: "apps-france", label: "France", type: "team", statLabel: "World Cup appearances", value: 16, display: "16 appearances", flagOrEmoji: "🇫🇷" },
  { id: "apps-spain", label: "Spain", type: "team", statLabel: "World Cup appearances", value: 16, display: "16 appearances", flagOrEmoji: "🇪🇸" },
  { id: "apps-england", label: "England", type: "team", statLabel: "World Cup appearances", value: 16, display: "16 appearances", flagOrEmoji: "🏴" },
  { id: "apps-belgium", label: "Belgium", type: "team", statLabel: "World Cup appearances", value: 14, display: "14 appearances", flagOrEmoji: "🇧🇪" },
  { id: "apps-uruguay", label: "Uruguay", type: "team", statLabel: "World Cup appearances", value: 14, display: "14 appearances", flagOrEmoji: "🇺🇾" },
  { id: "apps-switzerland", label: "Switzerland", type: "team", statLabel: "World Cup appearances", value: 12, display: "12 appearances", flagOrEmoji: "🇨🇭" },
  { id: "apps-usa", label: "USA", type: "team", statLabel: "World Cup appearances", value: 11, display: "11 appearances", flagOrEmoji: "🇺🇸" },
  { id: "apps-netherlands", label: "Netherlands", type: "team", statLabel: "World Cup appearances", value: 11, display: "11 appearances", flagOrEmoji: "🇳🇱" },
  { id: "apps-croatia", label: "Croatia", type: "team", statLabel: "World Cup appearances", value: 6, display: "6 appearances", flagOrEmoji: "🇭🇷" },

  { id: "goals-klose", label: "Miroslav Klose", type: "player", statLabel: "World Cup goals", value: 16, display: "16 goals", flagOrEmoji: "🇩🇪" },
  { id: "goals-ronaldo-brazil", label: "Ronaldo", type: "player", statLabel: "World Cup goals", value: 15, display: "15 goals", flagOrEmoji: "🇧🇷" },
  { id: "goals-gerd-muller", label: "Gerd Müller", type: "player", statLabel: "World Cup goals", value: 14, display: "14 goals", flagOrEmoji: "🇩🇪" },
  { id: "goals-fontaine", label: "Just Fontaine", type: "player", statLabel: "World Cup goals", value: 13, display: "13 goals", flagOrEmoji: "🇫🇷" },
  { id: "goals-messi", label: "Lionel Messi", type: "player", statLabel: "World Cup goals", value: 13, display: "13 goals", flagOrEmoji: "🇦🇷" },
  { id: "goals-pele", label: "Pelé", type: "player", statLabel: "World Cup goals", value: 12, display: "12 goals", flagOrEmoji: "🇧🇷" },
  { id: "goals-mbappe", label: "Kylian Mbappe", type: "player", statLabel: "World Cup goals", value: 12, display: "12 goals", flagOrEmoji: "🇫🇷" },
  { id: "goals-klinsmann", label: "Jürgen Klinsmann", type: "player", statLabel: "World Cup goals", value: 11, display: "11 goals", flagOrEmoji: "🇩🇪" },
  { id: "goals-batistuta", label: "Gabriel Batistuta", type: "player", statLabel: "World Cup goals", value: 10, display: "10 goals", flagOrEmoji: "🇦🇷" },
  { id: "goals-lineker", label: "Gary Lineker", type: "player", statLabel: "World Cup goals", value: 10, display: "10 goals", flagOrEmoji: "🏴" },
  { id: "goals-neymar", label: "Neymar", type: "player", statLabel: "World Cup goals", value: 8, display: "8 goals", flagOrEmoji: "🇧🇷" },
  { id: "goals-cristiano", label: "Cristiano Ronaldo", type: "player", statLabel: "World Cup goals", value: 8, display: "8 goals", flagOrEmoji: "🇵🇹" },
  { id: "goals-maradona", label: "Diego Maradona", type: "player", statLabel: "World Cup goals", value: 8, display: "8 goals", flagOrEmoji: "🇦🇷" },
  { id: "goals-harry-kane", label: "Harry Kane", type: "player", statLabel: "World Cup goals", value: 8, display: "8 goals", flagOrEmoji: "🏴" },
  { id: "goals-suarez", label: "Luis Suárez", type: "player", statLabel: "World Cup goals", value: 7, display: "7 goals", flagOrEmoji: "🇺🇾" },
  { id: "goals-griezmann", label: "Antoine Griezmann", type: "player", statLabel: "World Cup goals", value: 4, display: "4 goals", flagOrEmoji: "🇫🇷" },

  { id: "player-apps-messi", label: "Lionel Messi", type: "player", statLabel: "Player World Cup appearances", value: 26, display: "26 matches", flagOrEmoji: "🇦🇷" },
  { id: "player-apps-matthaus", label: "Lothar Matthäus", type: "player", statLabel: "Player World Cup appearances", value: 25, display: "25 matches", flagOrEmoji: "🇩🇪" },
  { id: "player-apps-klose", label: "Miroslav Klose", type: "player", statLabel: "Player World Cup appearances", value: 24, display: "24 matches", flagOrEmoji: "🇩🇪" },
  { id: "player-apps-maldini", label: "Paolo Maldini", type: "player", statLabel: "Player World Cup appearances", value: 23, display: "23 matches", flagOrEmoji: "🇮🇹" },
  { id: "player-apps-cristiano", label: "Cristiano Ronaldo", type: "player", statLabel: "Player World Cup appearances", value: 22, display: "22 matches", flagOrEmoji: "🇵🇹" },
  { id: "player-apps-maradona", label: "Diego Maradona", type: "player", statLabel: "Player World Cup appearances", value: 21, display: "21 matches", flagOrEmoji: "🇦🇷" },
  { id: "player-apps-uwe-seeler", label: "Uwe Seeler", type: "player", statLabel: "Player World Cup appearances", value: 21, display: "21 matches", flagOrEmoji: "🇩🇪" },
  { id: "player-apps-lahm", label: "Philipp Lahm", type: "player", statLabel: "Player World Cup appearances", value: 20, display: "20 matches", flagOrEmoji: "🇩🇪" },
  { id: "player-apps-griezmann", label: "Antoine Griezmann", type: "player", statLabel: "Player World Cup appearances", value: 19, display: "19 matches", flagOrEmoji: "🇫🇷" },
  { id: "player-apps-mbappe", label: "Kylian Mbappe", type: "player", statLabel: "Player World Cup appearances", value: 14, display: "14 matches", flagOrEmoji: "🇫🇷" },
  { id: "player-apps-neymar", label: "Neymar", type: "player", statLabel: "Player World Cup appearances", value: 13, display: "13 matches", flagOrEmoji: "🇧🇷" },
  { id: "player-apps-harry-kane", label: "Harry Kane", type: "player", statLabel: "Player World Cup appearances", value: 11, display: "11 matches", flagOrEmoji: "🏴" },

  { id: "record-biggest-win", label: "Biggest World Cup win", type: "record", statLabel: "World Cup record number", value: 9, display: "9-goal margin", flagOrEmoji: "📈" },
  { id: "record-fastest-goal", label: "Fastest World Cup goal", type: "record", statLabel: "World Cup record number", value: 11, display: "11 seconds", flagOrEmoji: "⚡" },
  { id: "record-most-goals-match", label: "Most goals in one match", type: "record", statLabel: "World Cup record number", value: 12, display: "12 goals", flagOrEmoji: "🎯" },
  { id: "record-fontaine-tournament", label: "Most goals in one tournament", type: "record", statLabel: "World Cup record number", value: 13, display: "13 goals", flagOrEmoji: "🔥" },
  { id: "record-most-finals-team", label: "Most final appearances by a team", type: "record", statLabel: "World Cup record number", value: 8, display: "8 finals", flagOrEmoji: "🏆" },
  { id: "record-most-hosts", label: "Most times hosted by one nation", type: "record", statLabel: "World Cup record number", value: 2, display: "2 times", flagOrEmoji: "🏟️" },
  { id: "record-most-red-cards", label: "Most red cards in a match", type: "record", statLabel: "World Cup record number", value: 4, display: "4 red cards", flagOrEmoji: "🟥" },
  { id: "record-most-penalties-shootout", label: "Longest World Cup shootout", type: "record", statLabel: "World Cup record number", value: 12, display: "12 penalties taken", flagOrEmoji: "🥅" },
  { id: "record-most-goals-player", label: "Most career World Cup goals", type: "record", statLabel: "World Cup record number", value: 16, display: "16 goals", flagOrEmoji: "👑" },
  { id: "record-most-matches-player", label: "Most matches by one player", type: "record", statLabel: "World Cup record number", value: 26, display: "26 matches", flagOrEmoji: "👑" },
  { id: "record-youngest-scorer", label: "Youngest World Cup scorer age", type: "record", statLabel: "World Cup record number", value: 17, display: "17 years old", flagOrEmoji: "🌟" },
  { id: "record-oldest-scorer", label: "Oldest World Cup scorer age", type: "record", statLabel: "World Cup record number", value: 42, display: "42 years old", flagOrEmoji: "⏳" },

  { id: "finals-germany", label: "Germany", type: "team", statLabel: "World Cup final appearances", value: 8, display: "8 finals", flagOrEmoji: "🇩🇪" },
  { id: "finals-brazil", label: "Brazil", type: "team", statLabel: "World Cup final appearances", value: 7, display: "7 finals", flagOrEmoji: "🇧🇷" },
  { id: "finals-italy", label: "Italy", type: "team", statLabel: "World Cup final appearances", value: 6, display: "6 finals", flagOrEmoji: "🇮🇹" },
  { id: "finals-argentina", label: "Argentina", type: "team", statLabel: "World Cup final appearances", value: 6, display: "6 finals", flagOrEmoji: "🇦🇷" },
  { id: "finals-france", label: "France", type: "team", statLabel: "World Cup final appearances", value: 4, display: "4 finals", flagOrEmoji: "🇫🇷" },
  { id: "finals-netherlands", label: "Netherlands", type: "team", statLabel: "World Cup final appearances", value: 3, display: "3 finals", flagOrEmoji: "🇳🇱" },
  { id: "finals-uruguay", label: "Uruguay", type: "team", statLabel: "World Cup final appearances", value: 2, display: "2 finals", flagOrEmoji: "🇺🇾" },
  { id: "finals-croatia", label: "Croatia", type: "team", statLabel: "World Cup final appearances", value: 1, display: "1 final", flagOrEmoji: "🇭🇷" },
  { id: "finals-england", label: "England", type: "team", statLabel: "World Cup final appearances", value: 1, display: "1 final", flagOrEmoji: "🏴" },
  { id: "finals-spain", label: "Spain", type: "team", statLabel: "World Cup final appearances", value: 1, display: "1 final", flagOrEmoji: "🇪🇸" },

  { id: "podiums-germany", label: "Germany", type: "team", statLabel: "World Cup top-three finishes", value: 12, display: "12 top-three finishes", flagOrEmoji: "🇩🇪" },
  { id: "podiums-brazil", label: "Brazil", type: "team", statLabel: "World Cup top-three finishes", value: 9, display: "9 top-three finishes", flagOrEmoji: "🇧🇷" },
  { id: "podiums-italy", label: "Italy", type: "team", statLabel: "World Cup top-three finishes", value: 8, display: "8 top-three finishes", flagOrEmoji: "🇮🇹" },
  { id: "podiums-argentina", label: "Argentina", type: "team", statLabel: "World Cup top-three finishes", value: 6, display: "6 top-three finishes", flagOrEmoji: "🇦🇷" },
  { id: "podiums-france", label: "France", type: "team", statLabel: "World Cup top-three finishes", value: 6, display: "6 top-three finishes", flagOrEmoji: "🇫🇷" },
  { id: "podiums-netherlands", label: "Netherlands", type: "team", statLabel: "World Cup top-three finishes", value: 4, display: "4 top-three finishes", flagOrEmoji: "🇳🇱" },
  { id: "podiums-sweden", label: "Sweden", type: "team", statLabel: "World Cup top-three finishes", value: 4, display: "4 top-three finishes", flagOrEmoji: "🇸🇪" },
  { id: "podiums-uruguay", label: "Uruguay", type: "team", statLabel: "World Cup top-three finishes", value: 3, display: "3 top-three finishes", flagOrEmoji: "🇺🇾" },
];

export const HIGHER_LOWER_STAT_LABELS = Array.from(
  new Set(HIGHER_LOWER_ITEMS.map((item) => item.statLabel)),
);
