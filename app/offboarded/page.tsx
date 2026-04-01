"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, fmt, pct } from "@/lib/data";
import CreatorPanel from "@/components/CreatorPanel";

export default function OffboardedPage() {
  const [D, setD] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<Creator|null>(null);
  useEffect(() => { fetchCreators().then(setD); }, []);
  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;

  const off = D.filter(c => !c.ac).sort((a,b) => b.run - a.run);
  const tR = off.reduce((a,c) => a+c.run, 0);
  const tFeb = off.reduce((a,c) => a+c.feb, 0);

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Offboarded Creators</h1><p className="text-[13px] text-[#78716c] mt-1">Creators no longer active on any board</p></div>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Offboarded</div><div className="text-[28px] font-extrabold text-[#f87171] leading-none">{off.length}</div><div className="text-xs text-[#57534e] mt-2">no longer active</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Residual Revenue (Mar)</div><div className="text-[28px] font-extrabold leading-none">{fmt(tR)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">February Revenue</div><div className="text-[28px] font-extrabold leading-none">{fmt(tFeb)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2.5">Last Boards</div><div className="text-[28px] font-extrabold leading-none text-sm mt-2">{[...new Set(off.map(c=>c.b).filter(Boolean))].join(", ") || "Various"}</div></div>
      </div>

      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Creator</th><th className="text-left p-3">Last Board</th><th className="text-left p-3">Agency</th><th className="text-left p-3">Mar (residual)</th><th className="text-left p-3">February</th><th className="text-left p-3">January</th><th className="text-left p-3">December</th></tr></thead><tbody>
          {off.map((c, i) => (
            <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer opacity-80"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold text-[#f87171]">{c.t||c.n}</td><td className="p-3 text-xs">{c.b||"—"}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3 font-semibold">{fmt(c.run)}</td><td className="p-3">{fmt(c.feb)}</td><td className="p-3">{fmt(c.jan)}</td><td className="p-3">{fmt(c.dec)}</td></tr>
          ))}
        </tbody></table>
      </div>
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
