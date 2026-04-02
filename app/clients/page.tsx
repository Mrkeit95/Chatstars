"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, fmt, pct, colorFor } from "@/lib/data";
import CreatorPanel from "@/components/CreatorPanel";

export default function ClientsPage() {
  const [D, setD] = useState<Creator[]>([]);
  const [selected, setSelected] = useState<Creator|null>(null);
  const [search, setSearch] = useState("");
  const [board, setBoard] = useState("all");
  const [agency, setAgency] = useState("all");

  useEffect(() => { fetchCreators().then(setD); }, []);
  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;

  const boards = [...new Set(D.map(c => c.b).filter(Boolean))].sort();
  const agencies = [...new Set(D.map(c => c.ag).filter(Boolean))].sort();
  const filtered = D.filter(c => {
    if (search && !(c.t||c.n).toLowerCase().includes(search.toLowerCase())) return false;
    if (board !== "all" && c.b !== board) return false;
    if (agency !== "all" && c.ag !== agency) return false;
    return true;
  }).sort((a,b) => b.run - a.run);

  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Clients</h1><p className="text-[13px] text-[#78716c] mt-1">All creators managed by Chatstars</p></div>
      <div className="flex gap-2.5 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px]" />
        <select value={board} onChange={e => setBoard(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"><option value="all">All Boards</option>{boards.map(b => <option key={b}>{b}</option>)}</select>
        <select value={agency} onChange={e => setAgency(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"><option value="all">All Agencies</option>{agencies.map(a => <option key={a}>{a}</option>)}</select>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Creator</th><th className="text-left p-3">Board</th><th className="text-left p-3">Agency</th><th className="text-left p-3">Status</th><th className="text-left p-3">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date().getMonth()]}</th><th className="text-left p-3">Prev</th><th className="text-left p-3">Goal</th><th className="text-left p-3">%</th></tr></thead><tbody>
          {filtered.map((c,i) => { const p = pct(c.run, c.goal); return (
            <tr key={i} onClick={() => setSelected(c)} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer"><td className="p-3 font-semibold">{c.t||c.n}</td><td className="p-3 text-xs">{c.b||"-"}</td><td className="p-3 text-xs text-[#78716c]">{c.ag||"-"}</td><td className="p-3">{c.ac ? <span className="text-[#4ade80]">●</span> : <span className="text-[#57534e]">○</span>}</td><td className="p-3 font-bold text-[#4ade80]">{fmt(c.run)}</td><td className="p-3">{fmt(c.feb)}</td><td className="p-3">{fmt(c.goal)}</td><td className="p-3 font-bold" style={{color: colorFor(p)}}>{p}%</td></tr>
          );})}
        </tbody></table>
      </div>
      <CreatorPanel creator={selected} onClose={() => setSelected(null)} />
    </>
  );
}
