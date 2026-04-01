"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, getActiveCreators, getBoards, getDailyTotals, fmt, fmtFull, pct, colorFor } from "@/lib/data";
import PipelineChart from "@/components/PipelineChart";
import CreatorPanel from "@/components/CreatorPanel";

export default function RevenuePage() {
  const [D, setD] = useState<Creator[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [selected, setSelected] = useState<Creator|null>(null);
  const [search, setSearch] = useState("");
  const [boardFilter, setBoardFilter] = useState("all");

  useEffect(() => { fetchCreators().then(setD); }, []);
  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;

  const active = getActiveCreators(D);
  const tRun = active.reduce((a,c) => a+c.run, 0);
  const tGoal = active.reduce((a,c) => a+c.goal, 0);
  const tFeb = active.reduce((a,c) => a+c.feb, 0);
  const tJan = active.reduce((a,c) => a+c.jan, 0);
  const tDec = active.reduce((a,c) => a+c.dec, 0);
  const dt = getDailyTotals(D);
  const boards = getBoards(D);

  const getVal = (c: Creator) => tab === "march" ? c.run : tab === "feb" ? c.feb : c.jan;
  const filtered = active.filter(c => {
    if (search && !(c.t||c.n).toLowerCase().includes(search.toLowerCase())) return false;
    if (boardFilter !== "all" && c.b !== boardFilter) return false;
    return true;
  }).sort((a,b) => getVal(b) - getVal(a));

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Revenue Tracker</h1><p className="text-[13px] text-[#78716c] mt-1">2026 REV TRACKER — Stellar OPS</p></div>
      <div className="flex gap-0.5 mb-6 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
        {[["dashboard","Dashboard"],["march","March"],["feb","February"],["jan","January"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === k ? "bg-white/[0.08] text-white" : "text-[#78716c] hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <>
          <div className="grid grid-cols-4 gap-3.5 mb-7">
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">March Running</div><div className="text-[28px] font-extrabold text-[#4ade80] leading-none">{fmtFull(tRun)}</div><div className="text-xs text-[#57534e] mt-2">{pct(tRun,tGoal)}% of goal</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">February</div><div className="text-[28px] font-extrabold text-[#60a5fa] leading-none">{fmt(tFeb)}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">January</div><div className="text-[28px] font-extrabold text-[#22d3ee] leading-none">{fmt(tJan)}</div></div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">December</div><div className="text-[28px] font-extrabold leading-none">{fmt(tDec)}</div></div>
          </div>
          <PipelineChart dailyTotals={dt} total={tRun} />
          <div className="mt-7">
            <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Boards Summary</div>
            <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
                <th className="text-left p-3 font-semibold">Board</th><th className="text-left p-3 font-semibold">Creators</th><th className="text-left p-3 font-semibold">Running</th><th className="text-left p-3 font-semibold">Goal</th><th className="text-left p-3 font-semibold">% to Goal</th>
              </tr></thead><tbody>
                {boards.map(b => <tr key={b.name} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 font-bold">{b.name}</td><td className="p-3">{b.creators.length}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(b.running)}</td><td className="p-3">{fmt(b.goal)}</td><td className="p-3"><span className="font-bold" style={{color: colorFor(b.pct)}}>{b.pct}%</span></td></tr>)}
              </tbody></table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2.5 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px]" />
            <select value={boardFilter} onChange={e => setBoardFilter(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="all">All Boards</option><option>Board 1</option><option>Board 2</option><option>Board 3</option><option>Training Board</option>
            </select>
          </div>
          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
              <th className="text-left p-3 font-semibold">#</th><th className="text-left p-3 font-semibold">Creator</th><th className="text-left p-3 font-semibold">Board</th><th className="text-left p-3 font-semibold">Agency</th><th className="text-left p-3 font-semibold">Revenue</th><th className="text-left p-3 font-semibold">Goal</th><th className="text-left p-3 font-semibold">%</th>
            </tr></thead><tbody>
              {filtered.map((c, i) => { const v = getVal(c); const p = pct(v, c.goal); return (
                <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold">{c.t||c.n}</td><td className="p-3 text-xs">{c.b||"-"}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(v)}</td><td className="p-3">{fmt(c.goal)}</td><td className="p-3 font-bold" style={{color: colorFor(p)}}>{p}%</td></tr>
              );})}
            </tbody></table>
          </div>
        </>
      )}
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
