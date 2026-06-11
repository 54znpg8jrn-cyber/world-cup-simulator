export const FORMATIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-4-3",
  "3-5-2",
  "5-3-2",
  "4-1-2-1-2",
  "4-5-1",
  "4-2-2-2",
  "3-4-2-1",
] as const;

export type Formation = (typeof FORMATIONS)[number];
export type PlayerPosition = "GK" | "DF" | "MF" | "FW";
export type PositionCategory = PlayerPosition;

export interface Nation {
  name: string;
  flag: string;
  code: string;
  strength: number;
  colors: [string, string];
}

export interface Player {
  id: string;
  name: string;
  nation: string;
  position: PlayerPosition;
  club: string;
  caps: number;
  goals: number;
  rating: number;
  attack: number;
  midfield: number;
  defense: number;
  imageUrl: string;
}

export interface PitchSlot {
  id: string;
  label: string;
  category: PositionCategory;
  top: number;
  left: number;
}

export type TournamentRound =
  | "Group Stage"
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Final";

export interface MatchEvent {
  minute: number;
  text: string;
  isGoal: boolean;
  forUser: boolean;
  phase: "chance" | "outcome";
  scorer?: string;
  kind?: "chance" | "penalty" | "var" | "free-kick" | "counter" | "late";
}

export interface SimMatch {
  round: TournamentRound;
  opponent: Nation;
  userGoals: number;
  opponentGoals: number;
  events: MatchEvent[];
}

export interface TournamentStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  scorers: Record<string, number>;
}

export interface GroupTableRow {
  nation: Nation;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface TournamentFixture {
  id: string;
  matchNumber?: number;
  round: TournamentRound;
  home: Nation;
  away: Nation;
  homeGoals: number;
  awayGoals: number;
  winner?: Nation;
  isUserMatch?: boolean;
  isUpset?: boolean;
}

export interface QualifiedTeam {
  nation: Nation;
  group: string;
  position: 1 | 2 | 3;
  tableRow: GroupTableRow;
}

export interface OfficialGroupStage {
  tables: Record<string, GroupTableRow[]>;
  qualifiers: QualifiedTeam[];
  bestThirdPlaced: QualifiedTeam[];
  roundOf32: TournamentFixture[];
}

export interface TournamentRoundResults {
  round: Exclude<TournamentRound, "Group Stage">;
  fixtures: TournamentFixture[];
}

export interface TournamentAwards {
  winner: Nation;
  runnerUp: Nation;
  finalScore: string;
  goldenBoot: { name: string; nation: string; goals: number };
  playerOfTournament: { name: string; nation: string };
  bestGoalkeeper: { name: string; nation: string };
  bestYoungPlayer: { name: string; nation: string };
}
