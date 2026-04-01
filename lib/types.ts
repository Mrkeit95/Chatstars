export interface Creator {
  n: string; b: string; t: string; ag: string; ac: boolean;
  dec: number; jan: number; feb: number;
  dy: number[]; run: number; tip: number; oth: number; lp: number;
  proj: number; rat: number;
  jdp: number|null; fjp: number|null; mfp: number|null;
  sp: number|null; ptg: number|null;
  ts: number; ns: number; rs: number;
  goal: number; dg: number;
  ptb: number|null; bt: number; dt: number;
}
export interface BoardData { name: string; creators: Creator[]; running: number; goal: number; active: number; pct: number; }
export const BOARD_COLORS: Record<string,string> = { "Board 1":"#4ade80","Board 2":"#60a5fa","Board 3":"#facc15","Training Board":"#a78bfa" };
export const BOARD_ORDER = ["Board 1","Board 2","Board 3","Training Board"];
export const ADMINS = ["Keit Dmitrijev","Alex Bakalov","Angelica","Zein","Jovs","Emman"];
export const PASS = "chatstars2026";
