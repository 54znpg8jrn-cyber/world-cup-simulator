import type {
  Formation,
  PitchSlot,
  PositionCategory,
} from "./types";

export { NATIONS, WORLD_CUP_GROUPS, getGroupForNation } from "../data/groups";

export function getSlotCategory(label: string): PositionCategory {
  if (label === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(label)) return "DF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(label)) return "MF";
  return "FW";
}

const row = (labels: string[], top: number, prefix: string): PitchSlot[] =>
  labels.map((label, index) => ({
    id: `${prefix}-${index}`,
    label,
    category: getSlotCategory(label),
    top,
    left: ((index + 1) * 100) / (labels.length + 1),
  }));

const makeFormation = (...parts: Array<string[] | number | string>) => {
  const slots: PitchSlot[] = [];
  for (let index = 0; index < parts.length; index += 3) {
    slots.push(
      ...row(
        parts[index] as string[],
        parts[index + 1] as number,
        parts[index + 2] as string,
      ),
    );
  }
  return [
    ...slots,
    { id: "gk-0", label: "GK", category: "GK" as const, top: 90, left: 50 },
  ];
};

export const FORMATION_SLOTS: Record<Formation, PitchSlot[]> = {
  "4-3-3": makeFormation(["LW", "ST", "RW"], 17, "att", ["CM", "CM", "CM"], 46, "mid", ["LB", "CB", "CB", "RB"], 72, "def"),
  "4-4-2": makeFormation(["ST", "ST"], 18, "att", ["LM", "CM", "CM", "RM"], 47, "mid", ["LB", "CB", "CB", "RB"], 72, "def"),
  "4-2-3-1": makeFormation(["ST"], 14, "att", ["LW", "CAM", "RW"], 34, "am", ["CDM", "CDM"], 55, "dm", ["LB", "CB", "CB", "RB"], 74, "def"),
  "3-4-3": makeFormation(["LW", "ST", "RW"], 17, "att", ["LM", "CM", "CM", "RM"], 48, "mid", ["CB", "CB", "CB"], 73, "def"),
  "3-5-2": makeFormation(["ST", "ST"], 16, "att", ["LM", "CM", "CAM", "CM", "RM"], 47, "mid", ["CB", "CB", "CB"], 73, "def"),
  "5-3-2": makeFormation(["ST", "ST"], 16, "att", ["CM", "CDM", "CM"], 48, "mid", ["LB", "CB", "CB", "CB", "RB"], 73, "def"),
  "4-1-2-1-2": makeFormation(["ST", "ST"], 14, "att", ["CAM"], 34, "am", ["CM", "CM"], 50, "cm", ["CDM"], 62, "dm", ["LB", "CB", "CB", "RB"], 76, "def"),
  "4-5-1": makeFormation(["ST"], 15, "att", ["LM", "CM", "CAM", "CM", "RM"], 46, "mid", ["LB", "CB", "CB", "RB"], 73, "def"),
  "4-2-2-2": makeFormation(["ST", "ST"], 14, "att", ["CAM", "CAM"], 36, "am", ["CDM", "CDM"], 56, "dm", ["LB", "CB", "CB", "RB"], 75, "def"),
  "3-4-2-1": makeFormation(["ST"], 13, "att", ["CAM", "CAM"], 32, "am", ["LM", "CM", "CM", "RM"], 53, "mid", ["CB", "CB", "CB"], 76, "def"),
};
