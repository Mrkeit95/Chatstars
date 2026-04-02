"use client";
import { useState, useEffect } from "react";
import { Creator, BOARD_ORDER } from "@/lib/types";
import { fetchCreators, getActiveCreators, fmt, pct, colorFor } from "@/lib/data";
import CreatorPanel from "@/components/CreatorPanel";
import { useSearchParams } from "next/navigation";

export default function BoardsPage() {
  const [D, setD] = useState<Creator[]>([]);
  const [tab, setTab] = useState("Board 1");
  const [selected, setSelected] = useState<Creator|null>(null);
  const params = useSearchParams();

  useEffect(() => { fetchCreators().then(setD); }, []);
  useEffect(() => { const b = params.get("board"); if (b) setTab(b); }, [params]);

  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;
  const active = getActiveCreators(D);
  const creators = active.filter(c => c.b === tab).sort((a,b) => b.run - a.run);
  const tR = creators.reduce((a,c) => a+c.run, 0);
  const tG = creators.reduce((a,c) => a+c.goal, 0);
  const tp = pct(tR, tG);

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Boards</h1><p className="text-[13px] text-[#78716c] mt-1">Creator boards & performance</p></div>
      <div className="flex gap-0.5 mb-6 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
        {BOARD_ORDER.map(b => <button key={b} onClick={() => setTab(b)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab===b ? "bg-white/[0.08] text-white" : "text-[#78716c] hover:text-white"}`}>{b}</button>)}
      </div>
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Creators</div><div className="text-[28px] font-extrabold">{creators.length}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Running</div><div className="text-[28px] font-extrabold text-[#4ade80]">{fmt(tR)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Goal</div><div className="text-[28px] font-extrabold">{fmt(tG)}</div></div>
        <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]"><div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">% to Goal</div><div className="text-[28px] font-extrabold" style={{color: colorFor(tp)}}>{tp}%</div></div>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Creator</th><th className="text-left p-3">Agency</th><th className="text-left p-3">Running</th><th className="text-left p-3">Goal</th><th className="text-left p-3">%</th></tr></thead><tbody>
          {creators.map((c,i) => { const cp = pct(c.run, c.goal); return (
            <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold">{c.t||c.n}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(c.run)}</td><td className="p-3">{fmt(c.goal)}</td><td className="p-3 font-bold" style={{color: colorFor(cp)}}>{cp}%</td></tr>
          );})}
        </tbody></table>
      </div>
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
