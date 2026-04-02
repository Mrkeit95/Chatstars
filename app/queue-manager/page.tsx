"use client";
import { useState } from "react";

// ─── TYPES ───
interface QueueItem {
  id: number;
  creator: string;
  type: "photo" | "video" | "reel" | "story" | "carousel";
  caption: string;
  queueManager: string;
  status: "scheduled" | "posted" | "review" | "flagged" | "draft";
  scheduledDate: string;
  scheduledTime: string;
  platform: string;
  notes: string;
  quality: number; // 1-5
}

interface Alert {
  id: number;
  type: "quality" | "caption" | "late" | "missing" | "duplicate";
  severity: "critical" | "warning" | "info";
  message: string;
  creator: string;
  queueManager: string;
  time: string;
}

// ─── SAMPLE DATA ───
const QM_NAMES = ["Sarah", "Mike", "Jessica", "Carlos", "Priya", "James"];
const CREATORS_LIST = ["Jules Ari", "Corinna", "Anya", "Jadelyn", "Emily", "Kit", "Anna Louise", "Autumn Falls", "Marli", "Lena Polanski", "Hayley", "Bree", "Danielle", "Melody", "Briellah", "Claire", "Lacie Owens", "Cheerleader Kait", "Eva Lovia", "Raya"];

function genItems(): QueueItem[] {
  const types: QueueItem["type"][] = ["photo", "video", "reel", "story", "carousel"];
  const statuses: QueueItem["status"][] = ["scheduled", "posted", "posted", "posted", "review", "flagged", "draft", "scheduled", "scheduled", "posted"];
  const captions = [
    "just dropped something special for you 🔥 check my page",
    "new set alert!! 📸 who wants to see more?",
    "good morning babe ☀️ starting the day right",
    "this outfit tho 👀🔥 what do you think?",
    "behind the scenes from yesterday's shoot 🎬",
    "can't sleep... anyone else up? 🌙",
    "gym pump looking crazy today 💪",
    "POV: you wake up next to me 😏",
    "NEW VIDEO just posted!! go watch 🔥🔥",
    "feeling cute, might delete later 🥰",
    "asdfgh new content go check",  // bad caption
    "posted.",  // bad caption
    "🔥🔥🔥🔥🔥",  // lazy caption
    "link in bio for more exclusive content babe 💕",
    "your favorite girl is back with something 🌶️",
    "happy friday!! special surprise in your DMs tonight 😈",
    "who's ready for this weekend? 🎉",
    "just because you guys asked for it... here it is 👀",
    "I love my fans so much 💕 new post for you",
    "Watch video",  // bad caption
  ];
  const items: QueueItem[] = [];
  for (let i = 0; i < 40; i++) {
    const status = statuses[i % statuses.length];
    const day = Math.floor(i / 4) + 1;
    const caption = captions[i % captions.length];
    // Quality scoring
    let quality = 4;
    if (caption.length < 15) quality = 1;
    else if (caption.length < 30) quality = 2;
    else if (!caption.includes(" ")) quality = 1;
    else if (caption === caption.toUpperCase() && caption.length > 5) quality = 2;
    else if ((caption.match(/🔥/g) || []).length > 3 && caption.replace(/[🔥\s]/g, "").length < 5) quality = 1;
    else if (caption.length > 40 && /[😏🔥💕👀😈]/.test(caption)) quality = 5;
    else quality = 3 + Math.floor(Math.random() * 2);

    items.push({
      id: i + 1,
      creator: CREATORS_LIST[i % CREATORS_LIST.length],
      type: types[i % types.length],
      caption,
      queueManager: QM_NAMES[i % QM_NAMES.length],
      status: quality <= 2 ? "flagged" : status,
      scheduledDate: `2026-03-${String(Math.min(day, 31)).padStart(2, "0")}`,
      scheduledTime: `${9 + (i % 12)}:${i % 2 === 0 ? "00" : "30"}`,
      platform: "OnlyFans",
      notes: quality <= 2 ? "Auto-flagged: low quality caption" : "",
      quality,
    });
  }
  return items;
}

function genAlerts(items: QueueItem[]): Alert[] {
  const alerts: Alert[] = [];
  let id = 1;
  
  // Flag bad captions
  items.filter(i => i.quality <= 2).forEach(i => {
    const reasons = [];
    if (i.caption.length < 15) reasons.push("too short");
    if (!i.caption.includes(" ") && i.caption.length > 3) reasons.push("no real words");
    if ((i.caption.match(/🔥/g) || []).length > 3) reasons.push("emoji spam, no substance");
    if (i.caption.length < 30 && !/[.!?]/.test(i.caption)) reasons.push("lazy / low effort");
    alerts.push({
      id: id++,
      type: "caption",
      severity: i.quality <= 1 ? "critical" : "warning",
      message: `Bad caption on ${i.creator}'s ${i.type}: "${i.caption.substring(0, 50)}..." — ${reasons.join(", ")}`,
      creator: i.creator,
      queueManager: i.queueManager,
      time: "Today",
    });
  });

  // Late posts (draft still not scheduled)
  items.filter(i => i.status === "draft").forEach(i => {
    alerts.push({
      id: id++,
      type: "late",
      severity: "warning",
      message: `${i.creator}'s ${i.type} still in draft — was scheduled for ${i.scheduledDate}`,
      creator: i.creator,
      queueManager: i.queueManager,
      time: "Today",
    });
  });

  // Duplicate detection (same creator, same caption)
  const seen: Record<string, number> = {};
  items.forEach(i => {
    const key = i.creator + "|" + i.caption.substring(0, 20);
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] === 2) {
      alerts.push({
        id: id++,
        type: "duplicate",
        severity: "info",
        message: `Duplicate caption detected for ${i.creator} — "${i.caption.substring(0, 40)}..."`,
        creator: i.creator,
        queueManager: i.queueManager,
        time: "Today",
      });
    }
  });

  return alerts.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

const TYPE_COLORS: Record<string, string> = { photo: "#4ade80", video: "#60a5fa", reel: "#a78bfa", story: "#fb923c", carousel: "#22d3ee" };
const STATUS_COLORS: Record<string, string> = { scheduled: "#60a5fa", posted: "#4ade80", review: "#facc15", flagged: "#f87171", draft: "#78716c" };
const SEV_COLORS: Record<string, string> = { critical: "#f87171", warning: "#facc15", info: "#60a5fa" };
const QUALITY_LABELS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

export default function QueueManagerPage() {
  const [items] = useState<QueueItem[]>(genItems);
  const [alerts] = useState<Alert[]>(() => genAlerts(genItems()));
  const [tab, setTab] = useState<"queue" | "alerts" | "analytics">("queue");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qmFilter, setQmFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reviewCaption, setReviewCaption] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState("");

  const filtered = items.filter(i => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (qmFilter !== "all" && i.queueManager !== qmFilter) return false;
    if (search && !i.creator.toLowerCase().includes(search.toLowerCase()) && !i.caption.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Analytics
  const totalPosted = items.filter(i => i.status === "posted").length;
  const totalFlagged = items.filter(i => i.status === "flagged").length;
  const avgQuality = items.length > 0 ? (items.reduce((a, i) => a + i.quality, 0) / items.length).toFixed(1) : "0";
  const qmStats: Record<string, { total: number; posted: number; flagged: number; avgQ: number }> = {};
  items.forEach(i => {
    if (!qmStats[i.queueManager]) qmStats[i.queueManager] = { total: 0, posted: 0, flagged: 0, avgQ: 0 };
    qmStats[i.queueManager].total++;
    if (i.status === "posted") qmStats[i.queueManager].posted++;
    if (i.status === "flagged") qmStats[i.queueManager].flagged++;
    qmStats[i.queueManager].avgQ += i.quality;
  });
  Object.values(qmStats).forEach(s => { s.avgQ = Math.round(s.avgQ / s.total * 10) / 10; });

  async function reviewCaptionAI() {
    if (!reviewCaption.trim()) return;
    setReviewing(true);
    setReviewResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Review this OnlyFans caption for quality. Rate it 1-5 and give specific feedback on: length, emoji usage, call to action, engagement potential, authenticity. If it's bad, explain why and write an improved version.\n\nCaption: "${reviewCaption}"\n\nRespond in this format:\nRating: X/5\nFeedback: ...\nImproved version: ...` }] }),
      });
      const data = await res.json();
      setReviewResult(data.reply || "Couldn't review.");
    } catch { setReviewResult("Connection error."); }
    setReviewing(false);
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-tight">Queue Manager</h1>
        <p className="text-[13px] text-[#78716c] mt-1">Content scheduling, quality tracking & alerts</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Total Queue</div>
          <div className="text-[24px] font-extrabold">{items.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Posted</div>
          <div className="text-[24px] font-extrabold text-[#4ade80]">{totalPosted}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Flagged</div>
          <div className="text-[24px] font-extrabold text-[#f87171]">{totalFlagged}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Avg Quality</div>
          <div className="text-[24px] font-extrabold" style={{ color: +avgQuality >= 4 ? "#4ade80" : +avgQuality >= 3 ? "#facc15" : "#f87171" }}>{avgQuality}/5</div>
        </div>
        <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Active Alerts</div>
          <div className="text-[24px] font-extrabold text-[#fb923c]">{alerts.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-6 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
        {([["queue", "Content Queue"], ["alerts", `Alerts (${alerts.length})`], ["analytics", "QM Analytics"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === k ? "bg-white/[0.08] text-white" : "text-[#78716c] hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {/* QUEUE TAB */}
      {tab === "queue" && (
        <>
          <div className="flex gap-2.5 mb-4 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creator or caption..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px]" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="all">All Status</option>
              {["scheduled", "posted", "review", "flagged", "draft"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={qmFilter} onChange={e => setQmFilter(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="all">All Queue Managers</option>
              {QM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
                <th className="text-left p-3">Creator</th><th className="text-left p-3">Type</th><th className="text-left p-3">Caption</th><th className="text-left p-3">QM</th><th className="text-left p-3">Status</th><th className="text-left p-3">Quality</th><th className="text-left p-3">Date</th>
              </tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className={`border-t border-white/[0.03] hover:bg-white/[0.02] transition ${item.status === "flagged" ? "bg-[#f87171]/[0.03]" : ""}`}>
                    <td className="p-3 font-semibold whitespace-nowrap">{item.creator}</td>
                    <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: TYPE_COLORS[item.type] + "20", color: TYPE_COLORS[item.type] }}>{item.type}</span></td>
                    <td className="p-3 text-xs text-[#a8a29e] max-w-[300px]"><div className="truncate" title={item.caption}>{item.caption}</div>{item.notes && <div className="text-[10px] text-[#f87171] mt-0.5">{item.notes}</div>}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{item.queueManager}</td>
                    <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: STATUS_COLORS[item.status] + "20", color: STATUS_COLORS[item.status] }}>{item.status}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < item.quality ? (item.quality >= 4 ? "#4ade80" : item.quality >= 3 ? "#facc15" : "#f87171") : "rgba(255,255,255,0.06)" }} />)}
                        <span className="text-[10px] text-[#57534e] ml-1">{QUALITY_LABELS[item.quality]}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-[#57534e] whitespace-nowrap">{item.scheduledDate}<br/>{item.scheduledTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ALERTS TAB */}
      {tab === "alerts" && (
        <div className="space-y-2.5">
          {alerts.map(a => (
            <div key={a.id} className="flex items-start gap-4 p-4 bg-[#1a1714] border rounded-xl transition" style={{ borderColor: SEV_COLORS[a.severity] + "30" }}>
              <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: SEV_COLORS[a.severity] }} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium leading-relaxed">{a.message}</div>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#57534e]">
                  <span>QM: <b className="text-[#a8a29e]">{a.queueManager}</b></span>
                  <span>Type: <b className="text-[#a8a29e]">{a.type}</b></span>
                  <span>{a.time}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded shrink-0" style={{ background: SEV_COLORS[a.severity] + "20", color: SEV_COLORS[a.severity] }}>{a.severity}</span>
            </div>
          ))}
          {alerts.length === 0 && <div className="text-center py-16 text-[#57534e]">No active alerts 🎉</div>}

          {/* AI Caption Reviewer */}
          <div className="mt-8 p-5 bg-[#1a1714] border border-white/[0.06] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
              <span className="text-sm font-bold">AI Caption Reviewer</span>
            </div>
            <p className="text-xs text-[#78716c] mb-3">Paste a caption to get AI quality feedback and an improved version:</p>
            <div className="flex gap-2 mb-3">
              <input value={reviewCaption} onChange={e => setReviewCaption(e.target.value)} onKeyDown={e => e.key === "Enter" && reviewCaptionAI()} placeholder="Paste caption here to review..." className="flex-1 bg-[#0c0a09] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]/30" />
              <button onClick={reviewCaptionAI} disabled={reviewing} className="px-5 py-2.5 rounded-lg bg-[#4ade80] text-[#0a0a0a] text-sm font-bold hover:brightness-110 transition disabled:opacity-50">{reviewing ? "Reviewing..." : "Review"}</button>
            </div>
            {reviewResult && <div className="p-4 bg-[#0c0a09] border border-white/[0.06] rounded-lg text-sm text-[#a8a29e] whitespace-pre-wrap leading-relaxed">{reviewResult}</div>}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <>
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Queue Manager Performance</div>
          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
                <th className="text-left p-3">Queue Manager</th><th className="text-left p-3">Total Posts</th><th className="text-left p-3">Posted</th><th className="text-left p-3">Flagged</th><th className="text-left p-3">Flag Rate</th><th className="text-left p-3">Avg Quality</th>
              </tr></thead>
              <tbody>
                {Object.entries(qmStats).sort((a, b) => b[1].avgQ - a[1].avgQ).map(([name, s]) => {
                  const flagRate = s.total > 0 ? Math.round(s.flagged / s.total * 100) : 0;
                  return (
                    <tr key={name} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="p-3 font-semibold">{name}</td>
                      <td className="p-3">{s.total}</td>
                      <td className="p-3 text-[#4ade80] font-bold">{s.posted}</td>
                      <td className="p-3 text-[#f87171] font-bold">{s.flagged}</td>
                      <td className="p-3">
                        <span className="font-bold" style={{ color: flagRate > 20 ? "#f87171" : flagRate > 10 ? "#facc15" : "#4ade80" }}>{flagRate}%</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < Math.round(s.avgQ) ? (s.avgQ >= 4 ? "#4ade80" : s.avgQ >= 3 ? "#facc15" : "#f87171") : "rgba(255,255,255,0.06)" }} />)}</div>
                          <span className="text-xs font-bold" style={{ color: s.avgQ >= 4 ? "#4ade80" : s.avgQ >= 3 ? "#facc15" : "#f87171" }}>{s.avgQ}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Quality Distribution</div>
          <div className="grid grid-cols-5 gap-3">
            {[1,2,3,4,5].map(q => {
              const count = items.filter(i => i.quality === q).length;
              const pct = items.length > 0 ? Math.round(count / items.length * 100) : 0;
              const color = q >= 4 ? "#4ade80" : q >= 3 ? "#facc15" : "#f87171";
              return (
                <div key={q} className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06] text-center">
                  <div className="flex justify-center gap-0.5 mb-2">{Array.from({ length: 5 }, (_, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < q ? color : "rgba(255,255,255,0.06)" }} />)}</div>
                  <div className="text-lg font-extrabold" style={{ color }}>{count}</div>
                  <div className="text-[10px] text-[#57534e]">{QUALITY_LABELS[q]} ({pct}%)</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
