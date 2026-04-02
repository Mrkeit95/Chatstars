import { NextRequest, NextResponse } from "next/server";

// ─── DATA FETCHERS ───

async function getRevenueData(): Promise<string> {
  try {
    const SHEET_ID = "1kUqGtf_Oc8HNOai1U8ZXey0oKw7Oj36R0RJNdFCSkn8";
    const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    const currentMonth = months[new Date().getMonth()];
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${currentMonth}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 600 } });
    if (!res.ok) return "Revenue sheet unavailable.";
    const csv = await res.text();
    const rows = csv.split("\n");

    let totalRun = 0, totalGoal = 0, activeCount = 0, offboardedCount = 0;
    const creators: { name: string; board: string; agency: string; active: boolean; run: number; goal: number; pctGoal: number; feb: number; jan: number; tip: number; dg: number }[] = [];
    const boardTotals: Record<string, { run: number; goal: number; count: number }> = {};
    const agencyTotals: Record<string, { run: number; count: number }> = {};

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(c => c.replace(/"/g, "").trim());
      if (!cols[0] || cols[0].length < 2 || /total|grand|sum/i.test(cols[0])) continue;

      const pm = (v: string) => parseFloat((v || "0").replace(/[$,%]/g, "")) || 0;
      const name = cols[2] || cols[0];
      const board = cols[1] || "Unassigned";
      const agency = cols[4] || "Unknown";
      const active = (cols[5] || "").toUpperCase() === "TRUE";
      const run = pm(cols[41]);
      const goal = pm(cols[59]);
      const feb = pm(cols[8]);
      const jan = pm(cols[7]);
      const tip = pm(cols[42]);
      const dg = pm(cols[60]);

      if (active) {
        activeCount++;
        totalRun += run;
        totalGoal += goal;
        if (board && board !== "Unassigned") {
          if (!boardTotals[board]) boardTotals[board] = { run: 0, goal: 0, count: 0 };
          boardTotals[board].run += run; boardTotals[board].goal += goal; boardTotals[board].count++;
        }
        if (!agencyTotals[agency]) agencyTotals[agency] = { run: 0, count: 0 };
        agencyTotals[agency].run += run; agencyTotals[agency].count++;
      } else {
        offboardedCount++;
      }

      creators.push({ name, board, agency, active, run, goal, pctGoal: goal > 0 ? Math.round(run/goal*100) : 0, feb, jan, tip, dg });
    }

    const sorted = creators.filter(c => c.active).sort((a, b) => b.run - a.run);
    const top15 = sorted.slice(0, 15).map((c, i) => `${i+1}. ${c.name} — $${Math.round(c.run).toLocaleString()} (${c.pctGoal}% of $${Math.round(c.goal).toLocaleString()} goal) [${c.board}, ${c.agency}]`).join("\n");
    const struggling = sorted.filter(c => c.goal > 0).sort((a, b) => a.pctGoal - b.pctGoal).slice(0, 10).map(c => `- ${c.name}: ${c.pctGoal}% to goal, $${Math.round(c.run).toLocaleString()} of $${Math.round(c.goal).toLocaleString()} [${c.board}]`).join("\n");
    const overPerformers = sorted.filter(c => c.pctGoal >= 100).map(c => `- ${c.name}: ${c.pctGoal}% (${c.board})`).join("\n");
    const boardSummary = Object.entries(boardTotals).sort((a,b) => b[1].run - a[1].run).map(([b, d]) => `- ${b}: ${d.count} creators, $${Math.round(d.run).toLocaleString()} / $${Math.round(d.goal).toLocaleString()} (${Math.round(d.run/d.goal*100)}%)`).join("\n");
    const agencySummary = Object.entries(agencyTotals).sort((a,b) => b[1].run - a[1].run).slice(0, 10).map(([a, d]) => `- ${a}: ${d.count} creators, $${Math.round(d.run).toLocaleString()}`).join("\n");
    const offboardedList = creators.filter(c => !c.active).map(c => `- ${c.name} [was: ${c.board || "N/A"}, ${c.agency}] residual: $${Math.round(c.run).toLocaleString()}`).join("\n");

    // Build full creator lookup (for "where is X" questions)
    const creatorLookup = creators.map(c => `${c.name} | ${c.board} | ${c.agency} | ${c.active ? "Active" : "Offboarded"} | $${Math.round(c.run).toLocaleString()} | ${c.pctGoal}% to goal | Daily goal: $${Math.round(c.dg).toLocaleString()}`).join("\n");

    return `${currentMonth} 2026 REVENUE DATA (LIVE):
Active creators: ${activeCount} | Offboarded: ${offboardedCount} | Total: ${activeCount + offboardedCount}
Total MTD revenue: $${Math.round(totalRun).toLocaleString()}
Total goal: $${Math.round(totalGoal).toLocaleString()}
% to goal: ${Math.round(totalRun/totalGoal*100)}%
Projected EOM (based on daily avg): $${Math.round(totalRun / 31 * 31).toLocaleString()}

BOARDS:
${boardSummary}

TOP AGENCIES:
${agencySummary}

TOP 15 CREATORS:
${top15}

STRUGGLING CREATORS (lowest % to goal):
${struggling}

OVER-PERFORMERS (above 100% goal):
${overPerformers}

OFFBOARDED CREATORS:
${offboardedList}

FULL CREATOR DIRECTORY (Name | Board | Agency | Status | Revenue | % to Goal | Daily Goal):
${creatorLookup}`;
  } catch (e) {
    return "Revenue data fetch error: " + (e as Error).message;
  }
}

async function getMondayData(): Promise<string> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) return "Monday.com not connected (no MONDAY_API_TOKEN).";

  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": token, "API-Version": "2024-10" },
      body: JSON.stringify({ query: `{ boards(limit: 30) { id name items_count groups { title } } }` }),
    });
    const data = await res.json();
    const boards = data?.data?.boards || [];
    const summary = boards.map((b: any) => `- ${b.name} (ID: ${b.id}, ${b.items_count} items) Groups: ${(b.groups || []).map((g: any) => g.title).join(", ")}`).join("\n");
    return `MONDAY.COM BOARDS:\n${summary}`;
  } catch (e) {
    return "Monday.com fetch error: " + (e as Error).message;
  }
}

// ─── API HANDLER ───

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return NextResponse.json({ reply: "AI not configured. Add ANTHROPIC_API_KEY to Vercel env vars." });

  // Fetch all data sources in parallel
  const [revenueData, mondayData] = await Promise.all([
    getRevenueData(),
    getMondayData(),
  ]);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are the AI operations assistant for Chatstars, a large OnlyFans creator management agency. You are embedded in their Agency OS dashboard and have access to ALL their live data.

YOU KNOW EVERYTHING ABOUT THIS COMPANY. You can answer ANY question about:

1. CREATORS / PAGES:
- Where any creator/page is (which board, agency, status)
- Their revenue (current month, previous months)
- Their daily goal and % to goal
- Whether they're active or offboarded
- If you're asked "where is [name]" — search the creator directory and give their board, agency, status, and current revenue

2. REVENUE & PERFORMANCE:
- Total company revenue, goals, projections
- Board-level breakdowns and comparisons
- Agency performance comparisons
- Who's over-performing, who's struggling
- Growth trends (month over month)
- Daily averages and projections

3. CHATTERS / TEAM:
- Queue managers handle posting content on creator pages
- Chat managers handle conversations with subscribers
- Training managers onboard new chatters
- Hiring managers recruit new team members
- Content managers plan and approve content
- Account executives manage agency relationships

4. MASS MESSAGES:
- You can write mass messages for any purpose (PPV promos, engagement, re-engagement, tips, upsells, seasonal)
- Always write them in casual, human tone with emojis
- Keep them 2-4 short paragraphs
- Include a call to action
- Platform-safe (suggestive but not explicit)

5. QUEUE MANAGEMENT:
- Content quality standards: captions should be 40+ characters, include emojis, have personality, include a CTA
- Bad captions: too short, emoji spam, no substance, generic "link in bio"
- Good captions: personal, engaging, create urgency or curiosity, match creator's voice

6. OPERATIONS / MONDAY.COM:
- Company uses Monday.com for project management
- Boards exist for each team role and function
- You can reference board names and item counts

7. SCRIPTS & STRATEGY:
- Chat scripts should be conversational, not robotic
- Upsell naturally by building rapport first
- PPV pricing strategies based on creator tier
- Re-engagement scripts for expired subs
- Objection handling for pricing pushback

CURRENT LIVE DATA:
${revenueData}

${mondayData}

DASHBOARD PAGES (you can reference these):
- /dashboard — Main overview with KPIs, pipeline chart, board cards, top creators
- /revenue — Revenue tracker with month tabs, pipeline, boards summary
- /boards — Board detail pages with creator tables
- /clients — All creators searchable/filterable
- /billing — Revenue breakdown by agency, tips, subs, monthly comparison
- /offboarded — Inactive creators with residual revenue
- /mass-messages — 30+ message templates with AI generator
- /queue-manager — Content queue tracker with quality alerts
- /notifications — Auto-generated alerts
- /team/[role] — Management role pages (connected to Monday.com)
- /chatter/[section] — Chatter tools (schedule, meetings, rap sheets, feedback, handbook)

RULES:
- Be concise — use bullet points and bold for key numbers
- Always use real data from the sheets when available
- If someone asks "where is [creator]" — find them in the directory and give board + agency + revenue + status
- Proactively flag issues you notice in the data
- If asked to write content (mass messages, scripts, captions) — write it directly, ready to use
- Reference dashboard pages by name when suggesting where to find things
- Format currency as $X,XXX
- If you genuinely don't have the data to answer something, say so and suggest where to find it`,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || "No response";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: "AI error: " + e.message });
  }
}
