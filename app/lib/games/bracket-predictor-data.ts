import { NATIONS } from "../../data/groups";

export type PredictorSide = "left" | "right";
export type PredictorBlock =
  | "top-left"
  | "bottom-left"
  | "top-right"
  | "bottom-right";

export type PredictorTeam = {
  name: string;
  code: string;
  flag: string;
  flagNation: string;
  colors: [string, string];
};

export type PredictorMatchSeed = {
  id: string;
  region: PredictorBlock;
  block: PredictorBlock;
  side: PredictorSide;
  order: number;
  teamA: PredictorTeam;
  teamB: PredictorTeam;
};

function team(code: string, displayName?: string): PredictorTeam {
  const nation = NATIONS.find((candidate) => candidate.code === code);
  if (!nation) throw new Error(`Missing bracket predictor nation: ${code}`);
  return {
    name: displayName ?? nation.name,
    code: nation.code,
    flag: nation.flag,
    flagNation: nation.name,
    colors: nation.colors,
  };
}

// Fixed predictor bracket. Keep this order and mapping independent from live
// standings, best-third calculations, simulator results, and team strength.
export const BRACKET_PREDICTOR_ROUND_OF_32: PredictorMatchSeed[] = [
  { id: "R32_L1", region: "top-left", block: "top-left", side: "left", order: 1, teamA: team("GER"), teamB: team("PAR") },
  { id: "R32_L2", region: "top-left", block: "top-left", side: "left", order: 2, teamA: team("FRA"), teamB: team("SWE") },
  { id: "R32_L3", region: "top-left", block: "top-left", side: "left", order: 3, teamA: team("RSA"), teamB: team("CAN") },
  { id: "R32_L4", region: "top-left", block: "top-left", side: "left", order: 4, teamA: team("NED"), teamB: team("MAR") },

  { id: "R32_L5", region: "bottom-left", block: "bottom-left", side: "left", order: 5, teamA: team("POR"), teamB: team("CRO") },
  { id: "R32_L6", region: "bottom-left", block: "bottom-left", side: "left", order: 6, teamA: team("ESP"), teamB: team("AUT") },
  { id: "R32_L7", region: "bottom-left", block: "bottom-left", side: "left", order: 7, teamA: team("USA", "United States"), teamB: team("BIH", "Bosnia & Herzegovina") },
  { id: "R32_L8", region: "bottom-left", block: "bottom-left", side: "left", order: 8, teamA: team("BEL"), teamB: team("SEN") },

  { id: "R32_R1", region: "top-right", block: "top-right", side: "right", order: 1, teamA: team("BRA"), teamB: team("JPN") },
  { id: "R32_R2", region: "top-right", block: "top-right", side: "right", order: 2, teamA: team("CIV"), teamB: team("NOR") },
  { id: "R32_R3", region: "top-right", block: "top-right", side: "right", order: 3, teamA: team("MEX"), teamB: team("ECU") },
  { id: "R32_R4", region: "top-right", block: "top-right", side: "right", order: 4, teamA: team("ENG"), teamB: team("COD") },

  { id: "R32_R5", region: "bottom-right", block: "bottom-right", side: "right", order: 5, teamA: team("ARG"), teamB: team("CPV") },
  { id: "R32_R6", region: "bottom-right", block: "bottom-right", side: "right", order: 6, teamA: team("AUS"), teamB: team("EGY") },
  { id: "R32_R7", region: "bottom-right", block: "bottom-right", side: "right", order: 7, teamA: team("SUI"), teamB: team("ALG") },
  { id: "R32_R8", region: "bottom-right", block: "bottom-right", side: "right", order: 8, teamA: team("COL"), teamB: team("GHA") },
];
