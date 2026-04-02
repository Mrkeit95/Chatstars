"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, getActiveCreators, getBoards, getDailyTotals, getCurrentMonth, getMonthLabel, fmt, fmtFull, pct, colorFor } from "@/lib/data";
import PipelineChart from "@/components/PipelineChart";
import CreatorPanel from "@/components/CreatorPanel";

const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
const SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function RevenuePage() {
  const [D, setD] = useState<Creator[]>([]);
  const [tab, setTab] = useState("current");
  const [selected, setSelected] = useState<Creator|null>(null);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");

  const curIdx = new Date().getMonth();
  const currentMonth = MONTHS[curIdx];
  const prevMonths = [MONTHS[curIdx-1], MONTHS[curIdx-2], MONTHS[curIdx-3]].filter(Boolean);

  useEffect(() => {
    const month = tab === "current" ? currentMonth : tab;
    fetchCreators(month).then(setD);
  }, [tab]);

  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading {tab === "current" ? currentMonth : tab} data...</div>;

  const active = getActiveCreators(D);
  const tRun = active.reduce((a,c) => a+c.run, 0);
  const tGoal = active.reduce((a,c) => a+c.goal, 0);
  const tFeb = active.reduce((a,c) => a+c.feb, 0);
  const tJan = active.reduce((a,c) => a+c.jan, 0);
  const tDec = active.reduce((a,c) => a+c.dec, 0);
  const dt = getDailyTotals(D);
  const boards = getBoards(D);
  const activeDays = dt.filter(v => v > 0).length;
  const projEOM = activeDays > 0 ? (tRun / activeDays) * 31 : tRun;

  const isCurrentTab = tab === "current";
  const tabLabel = isCurrentTab ? SHORT[curIdx] : SHORT[MONTHS.indexOf(tab)];

  const filtered = active.filter(c => {
    if (search && !(c.t||c.n).toLowerCase().includes(search.toLowerCase())) return false;
    if (boardFilter !== "all" && c.b !== boardFilter) return false;
    return true;
  }).sort((a,b) => b.run - a.run);

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Revenue Tracker</h1><p className="text-[13px] text-[#78716c] mt-1">2026 REV TRACKER — Stellar OPS</p></div>

      {/* Month Tabs */}
      <div className="flex gap-0.5 mb-6 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
        <button onClick={() => setTab("current")} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === "current" ? "bg-white/[0.08] text-white" : "text-[#78716c] hover:text-white"}`}>Dashboard</button>
        {[currentMonth, ...prevMonths].map(m => (
          <button key={m} onClick={() => setTab(m)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === m ? "bg-white/[0.08] text-white" : "text-[#78716c] hover:text-white"}`}>{SHORT[MONTHS.indexOf(m)]}</button>
        ))}
      </div>

      {isCurrentTab ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3.5 mb-7">
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]">
              <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">{SHORT[curIdx]} Running</div>
              <div className="text-[28px] font-extrabold text-[#4ade80] leading-none">{fmtFull(tRun)}</div>
              <div className="text-xs text-[#57534e] mt-2">{pct(tRun,tGoal)}% of goal</div>
              <div className="h-1 rounded bg-white/[0.06] mt-2 overflow-hidden"><div className="h-full rounded bg-[#4ade80]" style={{width: Math.min(pct(tRun,tGoal),100)+"%"}} /></div>
              <div className="text-xs text-[#57534e] mt-2">Projected EOM <b className="text-[#a8a29e]">{fmt(projEOM)}</b></div>
            </div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">{SHORT[curIdx-1] || "Prev"}</div><div className="text-[28px] font-extrabold text-[#60a5fa] leading-none">{fmt(tFeb)}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">{SHORT[curIdx-2] || "Prev"}</div><div className="text-[28px] font-extrabold text-[#22d3ee] leading-none">{fmt(tJan)}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">{SHORT[curIdx-3] || "Prev"}</div><div className="text-[28px] font-extrabold leading-none">{fmt(tDec)}</div></div>
          </div>
          <PipelineChart dailyTotals={dt} total={tRun} />
          <div className="mt-7">
            <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Boards Summary</div>
            <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
                <th className="text-left p-3">Board</th><th className="text-left p-3">Creators</th><th className="text-left p-3">Running</th><th className="text-left p-3">Goal</th><th className="text-left p-3">%</th>
              </tr></thead><tbody>
                {boards.map(b => <tr key={b.name} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 font-bold">{b.name}</td><td className="p-3">{b.creators.length}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(b.running)}</td><td className="p-3">{fmt(b.goal)}</td><td className="p-3 font-bold" style={{color: colorFor(b.pct)}}>{b.pct}%</td></tr>)}
              </tbody></table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">{tabLabel} Revenue</div><div className="text-[28px] font-extrabold text-[#4ade80]">{fmtFull(tRun)}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Creators</div><div className="text-[28px] font-extrabold">{active.length}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">% to Goal</div><div className="text-[28px] font-extrabold" style={{color: colorFor(pct(tRun,tGoal))}}>{pct(tRun,tGoal)}%</div></div>
          </div>
          <PipelineChart dailyTotals={dt} total={tRun} />
          <div className="flex gap-2.5 my-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px]" />
            <select value={boardFilter} onChange={e => setBoardFilter(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="all">All Boards</option><option>Board 1</option><option>Board 2</option><option>Board 3</option><option>Training Board</option>
            </select>
          </div>
          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
              <th className="text-left p-3">#</th><th className="text-left p-3">Creator</th><th className="text-left p-3">Board</th><th className="text-left p-3">Agency</th><th className="text-left p-3">{tabLabel} Revenue</th><th className="text-left p-3">Goal</th><th className="text-left p-3">%</th>
            </tr></thead><tbody>
              {filtered.map((c, i) => { const p = pct(c.run, c.goal); return (
                <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold">{c.t||c.n}</td><td className="p-3 text-xs">{c.b||"-"}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(c.run)}</td><td className="p-3">{fmt(c.goal)}</td><td className="p-3 font-bold" style={{color: colorFor(p)}}>{p}%</td></tr>
              );})}
            </tbody></table>
          </div>
        </>
      )}
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
