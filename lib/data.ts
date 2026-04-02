import { Creator, BoardData, BOARD_ORDER } from "./types";

// ─── CSV PARSER (handles quoted commas) ───
function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let cur = ""; let inQ = false; let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { row.push(cur); cur = ""; }
    else if ((ch === "\n" || ch === "\r") && !inQ) { if (cur.length || row.length) { row.push(cur); rows.push(row); row = []; cur = ""; } }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.map(r => r.map(c => c.trim().replace(/^"|"$/g, "")));
}

function pm(v: string | undefined): number {
  if (!v) return 0;
  const s = v.replace(/[$,"%\s]/g, "");
  if (!s || /DIV|VALUE|REF|N\/A|#/i.test(s)) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

// ─── SMART COLUMN FINDER — searches header row by name ───
function findCol(header: string[], ...patterns: string[]): number {
  const h = header.map(c => c.toUpperCase().trim());
  for (const pat of patterns) {
    const p = pat.toUpperCase();
    // Exact match first
    const exact = h.findIndex(c => c === p);
    if (exact !== -1) return exact;
    // Contains match
    const contains = h.findIndex(c => c.includes(p));
    if (contains !== -1) return contains;
  }
  return -1;
}

function findDayStart(header: string[]): number {
  const h = header.map(c => c.toUpperCase().trim());
  return h.findIndex(c => c === "1 DAY NET" || c === "1 DAY" || c.startsWith("1 DAY"));
}

function findGoalCol(header: string[]): number {
  const h = header.map(c => c.toUpperCase().trim());
  // Look for "[Month] Goal" but NOT "Daily Goal"
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  for (let i = 0; i < h.length; i++) {
    if (h[i].includes("GOAL") && !h[i].includes("DAILY") && !h[i].includes("% TO")) {
      for (const m of months) {
        if (h[i].includes(m)) return i;
      }
    }
  }
  // Fallback: any "GOAL" not daily/bonus/%
  return h.findIndex(c => c.includes("GOAL") && !c.includes("DAILY") && !c.includes("% TO") && !c.includes("BONUS"));
}

// ─── PARSE SHEET CSV ───
export function parseSheetCSV(csv: string): Creator[] {
  const rows = parseCSV(csv);
  if (rows.length < 3) return [];

  // Find header row
  let hi = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const j = rows[i].join(",").toUpperCase();
    if (j.includes("TEAMS") && (j.includes("AGENCY") || j.includes("ACTIVE"))) { hi = i; break; }
  }
  const H = rows[hi];

  // Find all columns by name
  const cName = findCol(H, "INFLOW USERNAME");
  const cBoard = findCol(H, "BOARD");
  const cTeams = findCol(H, "TEAMS");
  const cAt = findCol(H, "@");
  const cAgency = findCol(H, "AGENCY");
  const cActive = findCol(H, "ACTIVE", "ACTIVE?");
  const cRun = findCol(H, "RUNNING SALES");
  const cTip = findCol(H, "TIPS & MSGS", "TIPS");
  const cOther = findCol(H, "OTHERS");
  const cProj = findCol(H, "PROJECTION");
  const cRatio = findCol(H, "RATIO");
  const cPtg = findCol(H, "% TO GOAL");
  const cTs = findCol(H, "TOTAL SUB $", "TOTAL SUB");
  const cGoal = findGoalCol(H);
  const cDg = findCol(H, "DAILY GOAL");
  const cBt = findCol(H, "BONUS TARGET");
  const cDay1 = findDayStart(H);

  // Previous months
  const cDec = findCol(H, "DECEMBER NET", "DEC NET");
  const cJan = findCol(H, "JANUARY NET", "JAN NET");
  const cFeb = findCol(H, "FEBRUARY NET", "FEB NET");
  const cMar = findCol(H, "MARCH NET", "MAR NET");

  const creators: Creator[] = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 5) continue;
    const nameVal = (r[cTeams >= 0 ? cTeams : cName >= 0 ? cName : 0] || "").trim();
    if (!nameVal || nameVal.length < 2) continue;
    // Skip section headers and summary rows
    if (/^(TOTAL|GRAND|SUM|BOARD \d|BOARD\d|TRAINING BOARD|TEAMS|AGENCIES)$/i.test(nameVal)) continue;
    // Skip agency summary rows at bottom of sheet (@ = COUNT or a pure number, no Active status)
    const atVal = (r[cAt >= 0 ? cAt : 3] || "").trim();
    if (atVal === "COUNT") continue;
    const activeVal = cActive >= 0 ? (r[cActive] || "").trim().toUpperCase() : "";
    // If no Active status AND @ is empty or a number, it's a summary row not a creator
    if (activeVal !== "TRUE" && activeVal !== "FALSE") {
      if (!atVal || /^\d+$/.test(atVal)) continue;
    }

    // Daily data
    const dy: number[] = [];
    if (cDay1 >= 0) { for (let d = 0; d < 31; d++) dy.push(pm(r[cDay1 + d])); }
    else { for (let d = 0; d < 31; d++) dy.push(0); }

    creators.push({
      n: (r[cName >= 0 ? cName : 0] || "").trim(),
      b: cBoard >= 0 ? (r[cBoard] || "").trim() : "",
      t: nameVal,
      ag: (r[cAgency >= 0 ? cAgency : 0] || "").trim(),
      ac: cActive >= 0 ? (r[cActive] || "").toUpperCase() === "TRUE" : true,
      dec: pm(r[cDec >= 0 ? cDec : -1]),
      jan: pm(r[cJan >= 0 ? cJan : -1]),
      feb: pm(r[cFeb >= 0 ? cFeb : -1]),
      dy,
      run: pm(r[cRun >= 0 ? cRun : -1]),
      tip: pm(r[cTip >= 0 ? cTip : -1]),
      oth: pm(r[cOther >= 0 ? cOther : -1]),
      lp: pm(r[cRun >= 0 ? cRun : -1]),
      proj: pm(r[cProj >= 0 ? cProj : -1]),
      rat: pm(r[cRatio >= 0 ? cRatio : -1]),
      jdp: null, fjp: null, mfp: null,
      sp: null,
      ptg: cPtg >= 0 ? pm(r[cPtg]) : null,
      ts: pm(r[cTs >= 0 ? cTs : -1]),
      ns: 0, rs: 0,
      goal: pm(r[cGoal >= 0 ? cGoal : -1]),
      dg: pm(r[cDg >= 0 ? cDg : -1]),
      ptb: null,
      bt: pm(r[cBt >= 0 ? cBt : -1]),
      dt: 0,
    });
  }
  return creators;
}

// ─── FETCH + PARSE ───
export async function fetchCreators(month?: string): Promise<Creator[]> {
  try {
    const url = month ? `/api/sheet?sid=chatstars&sheet=${month}` : "/api/sheet?sid=chatstars";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Sheet " + res.status);
    const csv = await res.text();
    const creators = parseSheetCSV(csv);
    return creators.length > 0 ? creators : [];
  } catch (e) {
    console.error("Fetch error:", e);
    return [];
  }
}

// ─── HELPERS ───
export function getActiveCreators(D: Creator[]) { return D.filter(c => c.ac); }
export function getBoards(D: Creator[]): BoardData[] {
  const active = getActiveCreators(D);
  const map: Record<string, BoardData> = {};
  active.forEach(c => {
    if (!c.b) return;
    if (!map[c.b]) map[c.b] = { name: c.b, creators: [], running: 0, goal: 0, active: 0, pct: 0 };
    map[c.b].creators.push(c); map[c.b].running += c.run; map[c.b].goal += c.goal; map[c.b].active++;
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
  active.forEach(c => { const a = c.ag || "Unknown"; if (!map[a]) map[a] = { name: a, running: 0, goal: 0, count: 0 }; map[a].running += c.run; map[a].goal += c.goal; map[a].count++; });
  return Object.values(map).sort((a, b) => b.running - a.running);
}
export function getCompanyRatio(D: Creator[]): number {
  const rats = D.filter(c => c.ac && c.rat > 0).map(c => c.rat);
  return rats.length > 0 ? Math.round(rats.reduce((a, v) => a + v, 0) / rats.length * 100) / 100 : 0;
}
export function generateNotifications(D: Creator[]) {
  const active = getActiveCreators(D);
  const notifs: { text: string; type: "success"|"warning"|"danger"|"info"; time: string }[] = [];
  active.filter(c => c.run >= c.goal && c.goal > 0).slice(0, 5).forEach(c => { notifs.push({ text: `${c.t || c.n} hit their monthly goal! (${Math.round(c.run/c.goal*100)}%)`, type: "success", time: "Today" }); });
  active.filter(c => c.goal > 0 && c.run / c.goal < 0.3 && c.run > 0).slice(0, 5).forEach(c => { notifs.push({ text: `${c.t || c.n} is at ${Math.round(c.run/c.goal*100)}% — needs attention`, type: "danger", time: "Today" }); });
  const off = D.filter(c => !c.ac);
  if (off.length > 0) notifs.push({ text: `${off.length} creators currently offboarded`, type: "info", time: "Today" });
  return notifs;
}
export function getCurrentMonth(): string { return ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"][new Date().getMonth()]; }
export function getMonthLabel(): string { return new Date().toLocaleString("en-US", { month: "long", year: "numeric" }); }
export function fmt(v: number): string { return "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
export function fmtFull(v: number): string { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
export function pct(a: number, b: number): number { return b > 0 ? Math.round(a / b * 100) : 0; }
export function colorFor(p: number): string { return p >= 100 ? "#4ade80" : p >= 70 ? "#facc15" : "#f87171"; }
