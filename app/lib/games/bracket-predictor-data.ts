import {
  calculateGroupTables,
  calculateKnockoutBracket,
  getFallbackCalculatorScores,
} from "../world-cup-calculator";

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

const provisionalRoundOf32 = calculateKnockoutBracket(
  calculateGroupTables(getFallbackCalculatorScores()),
);

const blockForIndex = (index: number): PredictorBlock => {
  if (index < 4) return "top-left";
  if (index < 8) return "bottom-left";
  if (index < 12) return "top-right";
  return "bottom-right";
};

const toPredictorTeam = (nation: (typeof provisionalRoundOf32)[number]["home"]): PredictorTeam => ({
  name: nation.name,
  code: nation.code,
  flag: nation.flag,
  colors: nation.colors,
});

// The calculator snapshot is the single provisional source until the official
// knockout field is confirmed. Match order is intentionally never shuffled.
export const BRACKET_PREDICTOR_ROUND_OF_32: PredictorMatchSeed[] =
  provisionalRoundOf32.map((fixture, index) => {
    const block = blockForIndex(index);
    return {
      id: `r32-${index + 1}`,
      region: block,
      block,
      side: index < 8 ? "left" : "right",
      order: index + 1,
      teamA: toPredictorTeam(fixture.home),
      teamB: toPredictorTeam(fixture.away),
    };
  });

