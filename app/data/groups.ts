import type { Nation } from "../lib/types";
import { PLAYER_NATIONS } from "../../data/players";

type NationSeed = [
  name: string,
  flag: string,
  code: string,
  strength: number,
  colors: [string, string],
];

const playerNationCodes = new Map(
  PLAYER_NATIONS.map((playerNation) => [playerNation.name, playerNation.code]),
);

const nation = ([name, flag, code, strength, colors]: NationSeed): Nation => {
  const playerNationCode = playerNationCodes.get(name);
  if (!playerNationCode) {
    throw new Error(`Missing player data for ${name}`);
  }
  if (playerNationCode !== code) {
    throw new Error(`Nation code mismatch for ${name}`);
  }

  return {
    name,
    flag,
    code: playerNationCode,
    strength,
    colors,
  };
};

// Confirmed 2026 tournament draw. Kept as one editable constant for future changes.
export const WORLD_CUP_GROUPS: Record<string, Nation[]> = {
  A: [
    nation(["Mexico", "🇲🇽", "MEX", 80, ["#006847", "#ce1126"]]),
    nation(["South Africa", "🇿🇦", "RSA", 75, ["#007749", "#ffb81c"]]),
    nation(["South Korea", "🇰🇷", "KOR", 80, ["#cd2e3a", "#0047a0"]]),
    nation(["Czech Republic", "🇨🇿", "CZE", 79, ["#11457e", "#d7141a"]]),
  ],
  B: [
    nation(["Canada", "🇨🇦", "CAN", 79, ["#ff0000", "#ffffff"]]),
    nation(["Bosnia and Herzegovina", "🇧🇦", "BIH", 76, ["#002395", "#fecb00"]]),
    nation(["Qatar", "🇶🇦", "QAT", 74, ["#8a1538", "#ffffff"]]),
    nation(["Switzerland", "🇨🇭", "SUI", 82, ["#d52b1e", "#ffffff"]]),
  ],
  C: [
    nation(["Brazil", "🇧🇷", "BRA", 89, ["#ffdf00", "#009c3b"]]),
    nation(["Morocco", "🇲🇦", "MAR", 84, ["#c1272d", "#006233"]]),
    nation(["Haiti", "🇭🇹", "HAI", 73, ["#00209f", "#d21034"]]),
    nation(["Scotland", "🏴", "SCO", 79, ["#005eb8", "#ffffff"]]),
  ],
  D: [
    nation(["USA", "🇺🇸", "USA", 81, ["#3c3b6e", "#b22234"]]),
    nation(["Paraguay", "🇵🇾", "PAR", 79, ["#d52b1e", "#ffffff"]]),
    nation(["Australia", "🇦🇺", "AUS", 77, ["#ffcd00", "#00843d"]]),
    nation(["Turkey", "🇹🇷", "TUR", 82, ["#e30a17", "#ffffff"]]),
  ],
  E: [
    nation(["Germany", "🇩🇪", "GER", 87, ["#ffffff", "#d4af37"]]),
    nation(["Curaçao", "🇨🇼", "CUW", 72, ["#002b7f", "#f9e814"]]),
    nation(["Ivory Coast", "🇨🇮", "CIV", 81, ["#f77f00", "#009e60"]]),
    nation(["Ecuador", "🇪🇨", "ECU", 81, ["#ffd100", "#034ea2"]]),
  ],
  F: [
    nation(["Netherlands", "🇳🇱", "NED", 87, ["#f36c21", "#ffffff"]]),
    nation(["Japan", "🇯🇵", "JPN", 82, ["#001e62", "#ffffff"]]),
    nation(["Sweden", "🇸🇪", "SWE", 79, ["#006aa7", "#fecc02"]]),
    nation(["Tunisia", "🇹🇳", "TUN", 77, ["#e70013", "#ffffff"]]),
  ],
  G: [
    nation(["Belgium", "🇧🇪", "BEL", 84, ["#d4071f", "#fdda24"]]),
    nation(["Egypt", "🇪🇬", "EGY", 79, ["#ce1126", "#ffffff"]]),
    nation(["Iran", "🇮🇷", "IRN", 80, ["#239f40", "#da0000"]]),
    nation(["New Zealand", "🇳🇿", "NZL", 74, ["#111111", "#ffffff"]]),
  ],
  H: [
    nation(["Spain", "🇪🇸", "ESP", 89, ["#aa151b", "#f1bf00"]]),
    nation(["Cape Verde", "🇨🇻", "CPV", 74, ["#003893", "#ffffff"]]),
    nation(["Saudi Arabia", "🇸🇦", "KSA", 76, ["#006c35", "#ffffff"]]),
    nation(["Uruguay", "🇺🇾", "URU", 84, ["#5bb4e5", "#ffffff"]]),
  ],
  I: [
    nation(["France", "🇫🇷", "FRA", 90, ["#173f8a", "#e63946"]]),
    nation(["Senegal", "🇸🇳", "SEN", 81, ["#00853f", "#fdef42"]]),
    nation(["Iraq", "🇮🇶", "IRQ", 75, ["#ce1126", "#ffffff"]]),
    nation(["Norway", "🇳🇴", "NOR", 83, ["#ba0c2f", "#00205b"]]),
  ],
  J: [
    nation(["Argentina", "🇦🇷", "ARG", 90, ["#75aadb", "#ffffff"]]),
    nation(["Algeria", "🇩🇿", "ALG", 79, ["#006233", "#ffffff"]]),
    nation(["Austria", "🇦🇹", "AUT", 82, ["#ed2939", "#ffffff"]]),
    nation(["Jordan", "🇯🇴", "JOR", 74, ["#007a3d", "#ce1126"]]),
  ],
  K: [
    nation(["Portugal", "🇵🇹", "POR", 88, ["#046a38", "#da291c"]]),
    nation(["DR Congo", "🇨🇩", "COD", 77, ["#007fff", "#ce1021"]]),
    nation(["Uzbekistan", "🇺🇿", "UZB", 76, ["#1eb53a", "#0099b5"]]),
    nation(["Colombia", "🇨🇴", "COL", 84, ["#fcd116", "#003893"]]),
  ],
  L: [
    nation(["England", "🏴", "ENG", 88, ["#ffffff", "#cf142b"]]),
    nation(["Croatia", "🇭🇷", "CRO", 84, ["#ff0000", "#ffffff"]]),
    nation(["Ghana", "🇬🇭", "GHA", 78, ["#ce1126", "#fcd116"]]),
    nation(["Panama", "🇵🇦", "PAN", 76, ["#da121a", "#005293"]]),
  ],
};

export const NATIONS = Object.values(WORLD_CUP_GROUPS).flat();

export function getGroupForNation(nationName: string) {
  return Object.entries(WORLD_CUP_GROUPS).find(([, teams]) =>
    teams.some((team) => team.name === nationName),
  );
}
