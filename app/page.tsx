"use client";
import { useState, useEffect } from "react";
import { Creator, BOARD_COLORS, BOARD_ORDER } from "@/lib/types";
import { fetchCreators, getActiveCreators, getMonthLabel, getBoards, getDailyTotals, getCompanyRatio, fmt, fmtFull, pct, colorFor } from "@/lib/data";
import PipelineChart from "@/components/PipelineChart";
import CreatorPanel from "@/components/CreatorPanel";
import Link from "next/link";

export default function Dashboard() {
  const [D, setD] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<Creator|null>(null);

  useEffect(() => { fetchCreators().then(setD); const iv = setInterval(() => fetchCreators().then(setD), 300000); return () => clearInterval(iv); }, []);

  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading dashboard...</div>;

  const active = getActiveCreators(D);
  const tRun = D.reduce((a, c) => a + c.run, 0); // All creators for total
  const tGoal = active.reduce((a, c) => a + c.goal, 0);
  const tp = pct(tRun, tGoal);
  const dt = getDailyTotals(D);
  const activeDays = dt.filter(v => v > 0).length;
  const projEOM = activeDays > 0 ? (tRun / activeDays) * 31 : tRun;
  const projPct = tGoal > 0 ? ((projEOM - tGoal) / tGoal * 100).toFixed(1) : "0";
  const lastDay = dt.reduce((last, v, i) => v > 0 ? i : last, -1);
  const yesterday = lastDay >= 0 ? dt[lastDay] : 0;
  const ratio = getCompanyRatio(D);
  const boards = getBoards(D);
  const top5 = [...active].sort((a, b) => b.run - a.run).slice(0, 5);
  const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const ydDate = new Date(2026, new Date().getMonth(), lastDay + 1);
  const ydLabel = `${dayNames[ydDate.getDay()]}, ${["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][new Date().getMonth()]} ${lastDay + 1}`;

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Dashboard</h1><p className="text-[13px] text-[#78716c] mt-1">{new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} · Stellar OPS</p></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer">
          <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Total MTD Revenue</div>
          <div className="text-[30px] font-extrabold text-[#4ade80] leading-none">{fmtFull(tRun)}</div>
          <div className="text-xs text-[#57534e] mt-2.5 font-semibold">{tp}% of goal</div>
          <div className="h-1 rounded bg-white/[0.06] mt-3 overflow-hidden"><div className="h-full rounded bg-[#4ade80] transition-all duration-1000" style={{width: Math.min(tp, 100) + "%"}} /></div>
          <div className="text-xs text-[#57534e] mt-2">Projected EOM <b className="text-[#a8a29e]">{fmt(projEOM)}</b> <span style={{color: +projPct >= 0 ? "#4ade80" : "#f87171"}}>{+projPct >= 0 ? "+" : ""}{projPct}%</span></div>
        </div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer">
          <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Company Ratio</div>
          <div className="text-[30px] font-extrabold leading-none">{ratio}</div>
          <div className="text-xs text-[#57534e] mt-2.5">avg across all boards</div>
        </div>
        <Link href="/clients" className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer block">
          <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Active Creators</div>
          <div className="text-[30px] font-extrabold leading-none">{active.length}</div>
          <div className="text-xs text-[#57534e] mt-2.5">of {D.length} total in system</div>
        </Link>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer">
          <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Yesterday · {ydLabel}</div>
          <div className="text-[30px] font-extrabold text-[#4ade80] leading-none">{fmt(yesterday)}</div>
          <div className="text-xs text-[#57534e] mt-2.5">daily revenue</div>
        </div>
      </div>

      {/* Pipeline */}
      <PipelineChart dailyTotals={dt} total={tRun} />

      {/* Boards + Top 5 */}
      <div className="grid grid-cols-[1fr_380px] gap-5 mt-7">
        <div>
          <div className="flex justify-between items-center mb-4"><span className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider">Board Performance</span><Link href="/boards" className="text-[11px] font-semibold text-[#78716c] hover:text-[#4ade80] transition">View All →</Link></div>
          <div className="grid grid-cols-2 gap-3.5">
            {boards.map(b => (
              <Link key={b.name} href={`/boards?board=${encodeURIComponent(b.name)}`} className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5 transition block">
                <div className="text-[10.5px] font-bold text-[#78716c] uppercase tracking-wider mb-2">{b.name}</div>
                <div className="text-[28px] font-extrabold leading-none" style={{color: BOARD_COLORS[b.name] || "#4ade80"}}>{b.pct}%</div>
                <div className="text-xs text-[#57534e] mt-1.5">{fmt(b.running)} / {fmt(b.goal)}</div>
                <div className="h-[3px] rounded bg-white/[0.06] mt-3.5 overflow-hidden"><div className="h-full rounded" style={{width: Math.min(b.pct,100)+"%", background: BOARD_COLORS[b.name] || "#4ade80"}} /></div>
                <div className="flex justify-between mt-2.5 text-[11px] text-[#57534e]"><span>Creators <b className="text-[#a8a29e]">{b.creators.length}</b></span></div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Top 5 Creators</div>
          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
            {top5.map((c, i) => {
              const mfp = c.mfp ?? 0;
              const col = ["#4ade80","#60a5fa","#facc15","#fb923c","#f87171"][i];
              return (
                <div key={i} onClick={() => setSelected(c)} className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition last:border-0">
                  <span className="text-xs font-bold text-[#57534e] w-5 text-center">{i+1}</span>
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0" style={{background: col}}>{(c.t||c.n).substring(0,2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate">{c.t || c.n}</div><div className="text-[10px] text-[#57534e] uppercase tracking-wider">{c.ag || "N/A"}</div></div>
                  <div className="text-right"><div className="text-sm font-extrabold">{fmt(c.run)}</div><div className="text-[10px] font-semibold" style={{color: mfp >= 0 ? "#4ade80" : "#f87171"}}>↑ {Math.abs(mfp).toFixed(1)}%</div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
