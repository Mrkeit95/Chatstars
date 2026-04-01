"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, getActiveCreators, getAgencies, fmt, fmtFull, pct, colorFor } from "@/lib/data";
import CreatorPanel from "@/components/CreatorPanel";

export default function BillingPage() {
  const [D, setD] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<Creator|null>(null);
  useEffect(() => { fetchCreators().then(setD); }, []);
  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;

  const active = getActiveCreators(D);
  const tR = active.reduce((a,c) => a+c.run, 0);
  const tTip = active.reduce((a,c) => a+c.tip, 0);
  const tSub = active.reduce((a,c) => a+c.ts, 0);
  const tFeb = active.reduce((a,c) => a+c.feb, 0);
  const tJan = active.reduce((a,c) => a+c.jan, 0);
  const tDec = active.reduce((a,c) => a+c.dec, 0);
  const agencies = getAgencies(D);
  const top20 = [...active].sort((a,b) => b.run - a.run).slice(0, 20);

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Billing</h1><p className="text-[13px] text-[#78716c] mt-1">Revenue breakdown & payouts</p></div>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">March Revenue</div><div className="text-[28px] font-extrabold text-[#4ade80] leading-none">{fmtFull(tR)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Tips & Messages</div><div className="text-[28px] font-extrabold text-[#facc15] leading-none">{fmt(tTip)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Subscriptions</div><div className="text-[28px] font-extrabold text-[#60a5fa] leading-none">{fmt(tSub)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Avg per Creator</div><div className="text-[28px] font-extrabold leading-none">{fmt(tR / active.length)}</div></div>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-5 mb-7">
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] text-sm font-bold">Revenue by Agency</div>
          <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Agency</th><th className="text-left p-3">Creators</th><th className="text-left p-3">Revenue</th><th className="text-left p-3">%</th></tr></thead><tbody>
            {agencies.map(a => { const p = pct(a.running, a.goal); return (
              <tr key={a.name} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 font-semibold">{a.name}</td><td className="p-3">{a.count}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(a.running)}</td><td className="p-3 font-bold" style={{color: colorFor(p)}}>{p}%</td></tr>
            );})}
          </tbody></table>
        </div>
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-6">
          <div className="text-sm font-bold mb-5">Monthly Comparison</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["January", tJan, "#22d3ee"], ["February", tFeb, "#60a5fa"], ["March", tR, "#4ade80"]].map(([label, val, color]) => (
              <div key={label as string} className="p-4 bg-[#0c0a09] rounded-lg">
                <div className="text-[9px] text-[#57534e] uppercase font-semibold mb-1.5">{label as string}</div>
                <div className="text-xl font-extrabold" style={{color: color as string}}>{fmt(val as number)}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-[#0c0a09] rounded-lg text-center">
            <div className="text-[9px] text-[#57534e] uppercase font-semibold mb-1.5">December</div>
            <div className="text-xl font-extrabold">{fmt(tDec)}</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Top 20 Earners</div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Creator</th><th className="text-left p-3">Agency</th><th className="text-left p-3">Running</th><th className="text-left p-3">Tips</th><th className="text-left p-3">Subs</th><th className="text-left p-3">Bonus Target</th></tr></thead><tbody>
          {top20.map((c, i) => (
            <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold">{c.t||c.n}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(c.run)}</td><td className="p-3">{fmt(c.tip)}</td><td className="p-3">{fmt(c.ts)}</td><td className="p-3">{fmt(c.bt)}</td></tr>
          ))}
        </tbody></table>
      </div>
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
