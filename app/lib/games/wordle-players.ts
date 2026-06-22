import { OFFICIAL_PLAYER_SEEDS } from "../../../data/players";

export type WordlePosition =
  | "GK"
  | "CB"
  | "FB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST";

export type Confederation = "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";

export interface WordlePlayer {
  id: string;
  name: string;
  nation: string;
  position: WordlePosition;
  age: number;
  caps: number;
  goals: number;
}

type PlayerMetadata = {
  dateOfBirth: string;
  position: WordlePosition;
};

// Only player IDs from the current 2026 simulator squad list are eligible.
// Players not listed here have no verified date of birth in the app data and are excluded.
const WORDLE_PLAYER_METADATA: Record<string, PlayerMetadata> = {
  "arg-09": { dateOfBirth: "2000-01-31", position: "ST" },
  "arg-10": { dateOfBirth: "1987-06-24", position: "RW" },
  "arg-20": { dateOfBirth: "1998-12-24", position: "CM" },
  "arg-22": { dateOfBirth: "1997-08-22", position: "ST" },
  "arg-23": { dateOfBirth: "1992-09-02", position: "GK" },
  "arg-24": { dateOfBirth: "2001-01-17", position: "CM" },
  "bel-01": { dateOfBirth: "1992-05-11", position: "GK" },
  "bel-11": { dateOfBirth: "2002-05-27", position: "LW" },
  "bra-01": { dateOfBirth: "1992-10-02", position: "GK" },
  "bra-04": { dateOfBirth: "1994-05-14", position: "CB" },
  "bra-05": { dateOfBirth: "1992-02-23", position: "CDM" },
  "bra-07": { dateOfBirth: "2000-07-12", position: "LW" },
  "bra-11": { dateOfBirth: "1996-12-14", position: "RW" },
  "bra-19": { dateOfBirth: "2006-07-21", position: "ST" },
  "bra-23": { dateOfBirth: "1993-08-17", position: "GK" },
  "can-10": { dateOfBirth: "2000-01-14", position: "ST" },
  "can-19": { dateOfBirth: "2000-11-02", position: "FB" },
  "col-07": { dateOfBirth: "1997-01-13", position: "LW" },
  "col-10": { dateOfBirth: "1991-07-12", position: "CAM" },
  "cro-08": { dateOfBirth: "1994-05-06", position: "CM" },
  "cro-10": { dateOfBirth: "1985-09-09", position: "CM" },
  "ecu-03": { dateOfBirth: "2002-01-09", position: "CB" },
  "ecu-23": { dateOfBirth: "2001-11-02", position: "CDM" },
  "egy-10": { dateOfBirth: "1992-06-15", position: "RW" },
  "eng-07": { dateOfBirth: "2001-09-05", position: "RW" },
  "eng-09": { dateOfBirth: "1993-07-28", position: "ST" },
  "eng-10": { dateOfBirth: "2003-06-29", position: "CAM" },
  "fra-07": { dateOfBirth: "1997-05-15", position: "RW" },
  "fra-10": { dateOfBirth: "1998-12-20", position: "ST" },
  "fra-11": { dateOfBirth: "2001-12-12", position: "RW" },
  "fra-17": { dateOfBirth: "2001-03-24", position: "CB" },
  "fra-18": { dateOfBirth: "2006-03-08", position: "CM" },
  "ger-07": { dateOfBirth: "1999-06-11", position: "ST" },
  "ger-10": { dateOfBirth: "2003-02-26", position: "CAM" },
  "ger-17": { dateOfBirth: "2003-05-03", position: "CAM" },
  "ger-19": { dateOfBirth: "1996-01-11", position: "RW" },
  "irn-09": { dateOfBirth: "1992-07-18", position: "ST" },
  "jpn-08": { dateOfBirth: "2001-06-04", position: "RW" },
  "mex-11": { dateOfBirth: "2001-04-18", position: "ST" },
  "mar-02": { dateOfBirth: "1998-11-04", position: "FB" },
  "mar-04": { dateOfBirth: "1996-08-21", position: "CDM" },
  "mar-10": { dateOfBirth: "1999-08-03", position: "RW" },
  "mar-11": { dateOfBirth: "2001-01-28", position: "CM" },
  "nor-09": { dateOfBirth: "2000-07-21", position: "ST" },
  "nor-10": { dateOfBirth: "1998-12-17", position: "CAM" },
  "por-07": { dateOfBirth: "1985-02-05", position: "ST" },
  "por-08": { dateOfBirth: "1994-09-08", position: "CAM" },
  "por-11": { dateOfBirth: "1999-11-10", position: "ST" },
  "por-15": { dateOfBirth: "2004-09-27", position: "CM" },
  "por-17": { dateOfBirth: "1999-06-10", position: "LW" },
  "esp-06": { dateOfBirth: "1996-06-22", position: "CM" },
  "esp-09": { dateOfBirth: "2004-08-05", position: "CM" },
  "esp-10": { dateOfBirth: "1998-05-07", position: "CAM" },
  "esp-16": { dateOfBirth: "1996-06-22", position: "CDM" },
  "esp-17": { dateOfBirth: "2002-07-12", position: "LW" },
  "esp-19": { dateOfBirth: "2007-07-13", position: "RW" },
  "esp-20": { dateOfBirth: "2002-11-25", position: "CM" },
  "esp-23": { dateOfBirth: "1997-06-11", position: "GK" },
  "esp-24": { dateOfBirth: "1998-07-22", position: "FB" },
  "swe-09": { dateOfBirth: "1999-09-21", position: "ST" },
  "swe-17": { dateOfBirth: "1998-06-04", position: "ST" },
  "tur-06": { dateOfBirth: "2000-12-29", position: "CM" },
  "tur-07": { dateOfBirth: "1998-10-21", position: "LW" },
  "tur-08": { dateOfBirth: "2005-02-25", position: "CAM" },
  "tur-10": { dateOfBirth: "1994-02-08", position: "CM" },
  "uru-08": { dateOfBirth: "1998-07-22", position: "CM" },
  "uru-09": { dateOfBirth: "1999-06-24", position: "ST" },
  "usa-10": { dateOfBirth: "1998-09-18", position: "RW" },
};

export const NATION_CONFEDERATIONS: Record<string, Confederation> = {
  Algeria: "CAF", Argentina: "CONMEBOL", Australia: "AFC", Austria: "UEFA",
  Belgium: "UEFA", "Bosnia and Herzegovina": "UEFA", Brazil: "CONMEBOL",
  Canada: "CONCACAF", "Cape Verde": "CAF", Colombia: "CONMEBOL", Croatia: "UEFA",
  "Curaçao": "CONCACAF", "Czech Republic": "UEFA", "DR Congo": "CAF",
  Ecuador: "CONMEBOL", Egypt: "CAF", England: "UEFA", France: "UEFA",
  Germany: "UEFA", Ghana: "CAF", Haiti: "CONCACAF", Iran: "AFC", Iraq: "AFC",
  "Ivory Coast": "CAF", Japan: "AFC", Jordan: "AFC", Mexico: "CONCACAF",
  Morocco: "CAF", Netherlands: "UEFA", "New Zealand": "OFC", Norway: "UEFA",
  Panama: "CONCACAF", Paraguay: "CONMEBOL", Portugal: "UEFA", Qatar: "AFC",
  "Saudi Arabia": "AFC", Scotland: "UEFA", Senegal: "CAF", "South Africa": "CAF",
  "South Korea": "AFC", Spain: "UEFA", Sweden: "UEFA", Switzerland: "UEFA",
  Tunisia: "CAF", Turkey: "UEFA", USA: "CONCACAF", Uruguay: "CONMEBOL",
  Uzbekistan: "AFC",
};

export function calculateAge(dateOfBirth: string, referenceDate = new Date()) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthday =
    referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= birthDate.getUTCDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

export function getPositionGroup(position: WordlePosition) {
  if (position === "GK") return "goalkeeper";
  if (position === "CB" || position === "FB") return "defender";
  if (position === "CDM" || position === "CM" || position === "CAM") return "midfielder";
  return "attacker";
}

export const WORDLE_PLAYERS: WordlePlayer[] = OFFICIAL_PLAYER_SEEDS.flatMap(
  (player) => {
    const metadata = WORDLE_PLAYER_METADATA[player.id];
    if (!metadata) return [];
    return [{
      id: player.id,
      name: player.name,
      nation: player.nation,
      position: metadata.position,
      age: calculateAge(metadata.dateOfBirth),
      caps: player.caps,
      goals: player.goals,
    }];
  },
);
