import { NextRequest, NextResponse } from "next/server";

const SHEET_ID = "1kUqGtf_Oc8HNOai1U8ZXey0oKw7Oj36R0RJNdFCSkn8";
const MONTHS_ALL = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

async function fetchMonthCSV(month: string): Promise<string> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${month}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 600 } });
    if (!res.ok) return "";
    return await res.text();
  } catch { return ""; }
}

// Proper CSV line parser that handles quoted values with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(cur.trim().replace(/^"|"$/g, "")); cur = ""; }
    else cur += ch;
  }
  result.push(cur.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseMonthSummary(csv: string, monthName: string): string {
  if (!csv || csv.length < 100) return `${monthName}: No data available`;
  const rows = csv.split("\n");
  
  // Find header row
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i].toUpperCase().includes("TEAMS") || rows[i].toUpperCase().includes("AGENCY")) { headerIdx = i; break; }
  }
  
  // Find Running Sales column
  const header = parseCSVLine(rows[headerIdx]).map(c => c.toUpperCase());
  let runCol = header.findIndex(h => h.includes("RUNNING") && h.includes("SALES"));
  if (runCol === -1) runCol = 41;
  let goalCol = header.findIndex(h => h.includes("GOAL") && !h.includes("DAILY"));
  if (goalCol === -1) goalCol = header.findIndex(h => h.includes("% TO GOAL")) - 1;
  let activeCol = header.findIndex(h => h === "ACTIVE" || h === "ACTIVE?");
  if (activeCol === -1) activeCol = 5;
  let boardCol = header.findIndex(h => h === "BOARD");
  if (boardCol === -1) boardCol = 1;
  let agencyCol = header.findIndex(h => h === "AGENCY");
  if (agencyCol === -1) agencyCol = 4;
  let teamsCol = header.findIndex(h => h === "TEAMS");
  if (teamsCol === -1) teamsCol = 0;

  const pm = (v: string) => parseFloat((v || "0").replace(/[$,%"]/g, "")) || 0;
  
  let totalRun = 0, totalGoal = 0, activeCount = 0, offCount = 0;
  const creators: { name: string; board: string; agency: string; active: boolean; run: number; goal: number; pct: number }[] = [];
  const boardTotals: Record<string, { run: number; goal: number; count: number }> = {};
  const agencyTotals: Record<string, { run: number; count: number }> = {};

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cols = parseCSVLine(rows[i]);
    const name = cols[teamsCol] || cols[0] || "";
    if (!name || name.length < 2 || /^(TOTAL|GRAND|SUM|BOARD|TEAMS|TRAINING)/i.test(name)) continue;
    
    const active = (cols[activeCol] || "").toUpperCase() === "TRUE";
    const run = pm(cols[runCol]);
    const goal = pm(cols[goalCol] || "0");
    const board = cols[boardCol] || "";
    const agency = cols[agencyCol] || "";

    if (active) {
      activeCount++;
      totalRun += run;
      totalGoal += goal;
      if (board) {
        if (!boardTotals[board]) boardTotals[board] = { run: 0, goal: 0, count: 0 };
        boardTotals[board].run += run; boardTotals[board].goal += goal; boardTotals[board].count++;
      }
      if (!agencyTotals[agency]) agencyTotals[agency] = { run: 0, count: 0 };
      agencyTotals[agency].run += run; agencyTotals[agency].count++;
    } else { offCount++; }
    
    creators.push({ name, board, agency, active, run, goal, pct: goal > 0 ? Math.round(run/goal*100) : 0 });
  }

  const sorted = creators.filter(c => c.active).sort((a, b) => b.run - a.run);
  const top10 = sorted.slice(0, 10).map((c, i) => `${i+1}. ${c.name}: $${Math.round(c.run).toLocaleString()} (${c.pct}% goal) [${c.board}, ${c.agency}]`).join("\n");
  const struggling = sorted.filter(c => c.goal > 0).sort((a,b) => a.pct - b.pct).slice(0, 5).map(c => `- ${c.name}: ${c.pct}% ($${Math.round(c.run).toLocaleString()} of $${Math.round(c.goal).toLocaleString()}) [${c.board}]`).join("\n");
  const boardSum = Object.entries(boardTotals).map(([b,d]) => `- ${b}: ${d.count} creators, $${Math.round(d.run).toLocaleString()} / $${Math.round(d.goal).toLocaleString()} (${d.goal > 0 ? Math.round(d.run/d.goal*100) : 0}%)`).join("\n");
  const agencySum = Object.entries(agencyTotals).sort((a,b) => b[1].run - a[1].run).slice(0,8).map(([a,d]) => `- ${a}: ${d.count} creators, $${Math.round(d.run).toLocaleString()}`).join("\n");
  const creatorDir = creators.map(c => `${c.name} | ${c.board || "N/A"} | ${c.agency} | ${c.active ? "Active" : "Off"} | $${Math.round(c.run).toLocaleString()} | ${c.pct}%`).join("\n");

  return `─── ${monthName} 2026 ───
Active: ${activeCount} | Offboarded: ${offCount}
Revenue: $${Math.round(totalRun).toLocaleString()} / Goal: $${Math.round(totalGoal).toLocaleString()} (${totalGoal > 0 ? Math.round(totalRun/totalGoal*100) : 0}%)

Boards:\n${boardSum}
Agencies:\n${agencySum}
Top 10:\n${top10}
Struggling:\n${struggling}

All Creators:\n${creatorDir}`;
}

async function getMondayData(): Promise<string> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) return "Monday.com not connected.";
  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": token, "API-Version": "2024-10" },
      body: JSON.stringify({ query: `{ boards(limit: 30) { id name items_count groups { title } } }` }),
    });
    const data = await res.json();
    return "MONDAY.COM BOARDS:\n" + (data?.data?.boards || []).map((b: any) => `- ${b.name} (${b.items_count} items)`).join("\n");
  } catch { return "Monday.com error."; }
}


async function getInflowwSummary(): Promise<string> {
  const apiKey = process.env.INFLOWW_API_KEY;
  const oid = process.env.INFLOWW_OID;
  if (!apiKey || !oid) return "Infloww not connected.";
  const headers = { "Accept": "application/json", "Authorization": apiKey, "x-oid": oid };
  try {
    const [cRes, tRes, lRes, rRes] = await Promise.all([
      fetch("https://openapi.infloww.com/v1/creators?limit=100", { headers }).then(r => r.json()).catch(() => null),
      fetch("https://openapi.infloww.com/v1/transactions?limit=100", { headers }).then(r => r.json()).catch(() => null),
      fetch("https://openapi.infloww.com/v1/links?limit=50", { headers }).then(r => r.json()).catch(() => null),
      fetch("https://openapi.infloww.com/v1/refunds?limit=50", { headers }).then(r => r.json()).catch(() => null),
    ]);
    const creators = cRes?.data?.list || [];
    const txns = tRes?.data?.list || [];
    const links = lRes?.data?.list || [];
    const refunds = rRes?.data?.list || [];
    const totalGross = txns.reduce((a: number, t: any) => a + (parseFloat(t.amount) || 0), 0);
    const totalNet = txns.reduce((a: number, t: any) => a + (parseFloat(t.net) || 0), 0);
    const totalFees = txns.reduce((a: number, t: any) => a + (parseFloat(t.fee) || 0), 0);
    const totalRefunds = refunds.reduce((a: number, r: any) => a + (r.paymentAmount || 0), 0);
    const byType: Record<string, number> = {};
    txns.forEach((t: any) => { byType[t.type || "Unknown"] = (byType[t.type || "Unknown"] || 0) + (parseFloat(t.net) || 0); });
    const linkEarnings = links.reduce((a: number, l: any) => a + (l.earningsNet || 0), 0) / 100;
    const linkSubs = links.reduce((a: number, l: any) => a + (l.subCount || 0), 0);
    return `INFLOWW LIVE DATA:
Connected creators: ${creators.length}
${creators.map((c: any) => `- ${c.name || c.userName} (@${c.userName})`).join("\n")}

Transactions (last ${txns.length}):
Gross: $${Math.round(totalGross).toLocaleString()} | Net: $${Math.round(totalNet).toLocaleString()} | Fees: $${Math.round(totalFees).toLocaleString()}
Revenue by type: ${Object.entries(byType).map(([t, v]) => `${t}: $${Math.round(v).toLocaleString()}`).join(", ")}

Refunds: ${refunds.length} totaling $${Math.round(totalRefunds).toLocaleString()}

Marketing Links: ${links.length} links, ${linkSubs} subscribers, $${Math.round(linkEarnings).toLocaleString()} net earnings
Active campaigns: ${links.filter((l: any) => !l.finishedFlag).length}`;
  } catch (e) { return "Infloww data fetch error."; }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return NextResponse.json({ reply: "AI not configured. Add ANTHROPIC_API_KEY to Vercel env vars." });

  const curMonth = new Date().getMonth();
  const monthsToFetch = [MONTHS_ALL[curMonth], MONTHS_ALL[curMonth-1], MONTHS_ALL[curMonth-2], MONTHS_ALL[curMonth-3]].filter(Boolean);
  
  // Fetch all months + Monday in parallel
  const [mondayData, inflowwData, ...monthCSVs] = await Promise.all([
    getMondayData(),
    getInflowwSummary(),
    ...monthsToFetch.map(m => fetchMonthCSV(m)),
  ]);
  
  const monthSummaries = monthsToFetch.map((m, i) => parseMonthSummary(monthCSVs[i], m)).join("\n\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are the AI operations assistant for Chatstars, an OnlyFans creator management agency. You have LIVE data for MULTIPLE MONTHS.

${monthSummaries}

${mondayData}

${inflowwData}

You can answer ANY question about:
- INFLOWW LIVE DATA: Real-time transactions, tips, messages, subscriptions, refunds, marketing links, fan spending
- Where any creator is (board, agency, status, revenue for any month)
- Revenue comparisons across months (April vs March vs Feb etc)
- Board and agency performance for any month
- Top/bottom performers for any month
- Write mass messages, chat scripts, captions
- Strategy and projections
- Monday.com boards and tasks

RULES:
- Use real numbers from the data
- If asked about a month, reference that month's data specifically
- Compare months when asked (growth, decline, trends)
- "Where is [name]" → find in creator directory, give board + agency + revenue + status
- Be concise, use bullet points
- Format currency as $X,XXX`,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    return NextResponse.json({ reply: data.content?.[0]?.text || "No response" });
  } catch (e: any) {
    return NextResponse.json({ reply: "AI error: " + e.message });
  }
}
