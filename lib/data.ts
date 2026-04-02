import { Creator, BoardData, BOARD_ORDER } from "./types";

// ─── CSV PARSER ───
function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let cur = ""; let inQ = false; let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { row.push(cur.trim().replace(/^"|"$/g, "")); cur = ""; }
    else if ((ch === "\n" || ch === "\r") && !inQ) { if (cur.length || row.length) { row.push(cur.trim().replace(/^"|"$/g, "")); rows.push(row); row = []; cur = ""; } }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur.trim().replace(/^"|"$/g, "")); rows.push(row); }
  return rows;
}

function pm(v: string|undefined): number {
  if (!v) return 0;
  const s = v.replace(/[$,"%\s]/g, "");
  if (!s || /DIV|VALUE|REF|N\/A/i.test(s)) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
function pp(v: string|undefined): number|null {
  if (!v || /DIV|VALUE|REF|N\/A/i.test(v)) return null;
  const s = v.replace(/[%",\s]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

// ─── SMART COLUMN DETECTION ───
// Finds column indices by looking at the header row
function findColumns(header: string[]): Record<string, number> {
  const cols: Record<string, number> = {};
  const h = header.map(c => c.toUpperCase().trim());
  
  // Find key columns by name matching
  for (let i = 0; i < h.length; i++) {
    const c = h[i];
    if (c.includes("INFLOW") || (c === "TEAMS" && !cols.teams)) cols.name = i;
    if (c === "BOARD" || c.includes("BOARD")) cols.board = cols.board ?? i;
    if (c === "TEAMS") cols.teams = i;
    if (c === "@" || c.includes("USERNAME")) cols.username = i;
    if (c === "AGENCY") cols.agency = i;
    if (c === "ACTIVE" || c === "ACTIVE?") cols.active = i;
    if (c.includes("RUNNING") && c.includes("SALES")) cols.run = i;
    if (c === "PROJECTION") cols.proj = i;
    if (c === "RATIO") cols.ratio = i;
    if (c === "GOAL" || c.includes("MONTH GOAL") || c.includes("MTH GOAL")) cols.goal = i;
    if (c.includes("DAILY") && c.includes("GOAL")) cols.dg = i;
    if (c.includes("% TO GOAL") || c === "% TO GOAL") cols.ptg = i;
    if (c.includes("1 DAY") || c === "1 DAY NET") cols.day1 = i;
    if (c.includes("TOTAL SUB")) cols.ts = i;
    if (c.includes("TIP") || (c.includes("MSG") && c.includes("$"))) cols.tip = i;
    if (c.includes("BONUS") && c.includes("TARGET")) cols.bt = i;
    // Previous months - look for month names
    if (c.includes("DEC")) cols.dec = i;
    if (c.includes("JAN")) cols.jan = i;
    if (c.includes("FEB")) cols.feb = i;
    if (c.includes("MAR")) cols.mar = i;
    if (c.includes("APR") && !c.includes("RATIO")) cols.apr = i;
  }
  
  return cols;
}

function isCreatorRow(row: string[], cols: Record<string, number>): boolean {
  const nameIdx = cols.teams ?? cols.name ?? 0;
  const name = (row[nameIdx] || "").trim();
  if (!name || name.length < 2) return false;
  if (/^(TOTAL|GRAND|SUM|BOARD|TEAMS)/i.test(name)) return false;
  // Skip header-like rows
  if (name === "TEAMS" || name === "BOARD 1" || name === "BOARD 2" || name === "BOARD 3" || name === "TRAINING BOARD") return false;
  return true;
}

// ─── FETCH + PARSE ───
export async function fetchCreators(month?: string): Promise<Creator[]> {
  try {
    const url = month ? `/api/sheet?sid=chatstars&sheet=${month}` : "/api/sheet?sid=chatstars";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Sheet fetch failed: " + res.status);
    const csv = await res.text();
    return parseSheetCSV(csv);
  } catch (e) {
    console.error("Fetch error, using embedded data:", e);
    return EMBEDDED_DATA;
  }
}

export function parseSheetCSV(csv: string): Creator[] {
  const rows = parseCSV(csv);
  if (rows.length < 3) return EMBEDDED_DATA;
  
  // Find header row (first row that contains "TEAMS" or "INFLOW")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const joined = rows[i].join(",").toUpperCase();
    if (joined.includes("TEAMS") || joined.includes("INFLOW") || joined.includes("AGENCY")) {
      headerIdx = i;
      break;
    }
  }
  
  const cols = findColumns(rows[headerIdx]);
  const creators: Creator[] = [];
  
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;
    if (!isCreatorRow(r, cols)) continue;
    
    const nameIdx = cols.teams ?? cols.name ?? 0;
    const name = (r[nameIdx] || "").trim();
    const inflowName = (r[cols.name ?? 0] || "").trim();
    
    // Get daily data (31 days starting from day1 column)
    const dy: number[] = [];
    const dayStart = cols.day1 ?? 10;
    for (let d = 0; d < 31; d++) {
      dy.push(pm(r[dayStart + d]));
    }
    
    creators.push({
      n: inflowName || name,
      b: (r[cols.board ?? 1] || "").trim(),
      t: name,
      ag: (r[cols.agency ?? 4] || "").trim(),
      ac: (r[cols.active ?? 5] || "").toUpperCase() === "TRUE",
      dec: pm(r[cols.dec ?? 6]),
      jan: pm(r[cols.jan ?? 7]),
      feb: pm(r[cols.feb ?? 8]),
      dy,
      run: pm(r[cols.run ?? 41]),
      tip: pm(r[cols.tip ?? 42]),
      oth: 0,
      lp: pm(r[cols.run ?? 41]),
      proj: pm(r[cols.proj ?? 47]),
      rat: pm(r[cols.ratio ?? 52]),
      jdp: null, fjp: null, mfp: null,
      sp: null,
      ptg: pp(r[cols.ptg ?? 54]),
      ts: pm(r[cols.ts ?? 55]),
      ns: 0, rs: 0,
      goal: pm(r[cols.goal ?? 59]),
      dg: pm(r[cols.dg ?? 60]),
      ptb: null,
      bt: pm(r[cols.bt ?? 63]),
      dt: 0,
    });
  }
  
  return creators.length > 0 ? creators : EMBEDDED_DATA;
}

// ─── HELPERS ───
export function getActiveCreators(D: Creator[]) { return D.filter(c => c.ac); }

export function getBoards(D: Creator[]): BoardData[] {
  const active = getActiveCreators(D);
  const map: Record<string, BoardData> = {};
  active.forEach(c => {
    if (!c.b) return;
    if (!map[c.b]) map[c.b] = { name: c.b, creators: [], running: 0, goal: 0, active: 0, pct: 0 };
    map[c.b].creators.push(c);
    map[c.b].running += c.run;
    map[c.b].goal += c.goal;
    map[c.b].active++;
  });
  Object.values(map).forEach(b => { b.pct = b.goal > 0 ? Math.round(b.running / b.goal * 100) : 0; });
  return BOARD_ORDER.map(n => map[n]).filter(Boolean);
}

export function getDailyTotals(D: Creator[]): number[] {
  const active = getActiveCreators(D);
  const t: number[] = [];
  for (let d = 0; d < 31; d++) { let s = 0; active.forEach(c => s += (c.dy[d] || 0)); t.push(s); }
  return t;
}

export function getAgencies(D: Creator[]) {
  const active = getActiveCreators(D);
  const map: Record<string, { name: string; running: number; goal: number; count: number }> = {};
  active.forEach(c => {
    const a = c.ag || "Unknown";
    if (!map[a]) map[a] = { name: a, running: 0, goal: 0, count: 0 };
    map[a].running += c.run; map[a].goal += c.goal; map[a].count++;
  });
  return Object.values(map).sort((a, b) => b.running - a.running);
}

export function getCompanyRatio(D: Creator[]): number {
  const rats = D.filter(c => c.ac && c.rat > 0).map(c => c.rat);
  return rats.length > 0 ? Math.round(rats.reduce((a, v) => a + v, 0) / rats.length * 100) / 100 : 0;
}

export function generateNotifications(D: Creator[]) {
  const active = getActiveCreators(D);
  const notifs: { text: string; type: "success"|"warning"|"danger"|"info"; time: string }[] = [];
  active.filter(c => c.run >= c.goal && c.goal > 0).slice(0, 5).forEach(c => {
    notifs.push({ text: `${c.t || c.n} hit their monthly goal! (${Math.round(c.run/c.goal*100)}%)`, type: "success", time: "Today" });
  });
  active.filter(c => c.goal > 0 && c.run / c.goal < 0.3 && c.run > 0).slice(0, 5).forEach(c => {
    notifs.push({ text: `${c.t || c.n} is at ${Math.round(c.run/c.goal*100)}% of goal — needs attention`, type: "danger", time: "Today" });
  });
  const off = D.filter(c => !c.ac);
  if (off.length > 0) notifs.push({ text: `${off.length} creators currently offboarded`, type: "info", time: "Today" });
  return notifs;
}

export function getCurrentMonth(): string {
  return ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"][new Date().getMonth()];
}

export function getMonthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function fmt(v: number): string { return "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
export function fmtFull(v: number): string { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
export function pct(a: number, b: number): number { return b > 0 ? Math.round(a / b * 100) : 0; }
export function colorFor(p: number): string { return p >= 100 ? "#4ade80" : p >= 70 ? "#facc15" : "#f87171"; }

// Embedded fallback (empty for now — live data should always work)
const EMBEDDED_DATA: Creator[] = [];
