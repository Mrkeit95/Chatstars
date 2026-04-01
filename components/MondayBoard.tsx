"use client";
import { useState, useEffect } from "react";
import { getBoardItems, parseItem } from "@/lib/monday";

interface Props {
  boardId: string;
  title: string;
  description: string;
  accentColor?: string;
}

export default function MondayBoard({ boardId, title, description, accentColor = "#4ade80" }: Props) {
  const [board, setBoard] = useState<any>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getBoardItems(boardId);
      if (data) {
        setBoard(data);
        const parsed = (data.items_page?.items || []).map(parseItem);
        setItems(parsed);
      } else {
        setError("Could not load board. Check MONDAY_API_TOKEN in Vercel env vars.");
      }
      setLoading(false);
    }
    if (boardId) load();
  }, [boardId]);

  const groups = [...new Set(items.map(i => i.group))].filter(Boolean).sort();
  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (groupFilter !== "all" && i.group !== groupFilter) return false;
    return true;
  });

  // Get column headers from first item
  const columns = items.length > 0 ? Object.keys(items[0]).filter(k => !["id","name","group"].includes(k)).slice(0, 6) : [];

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>
        <p className="text-[13px] text-[#78716c] mt-1">{description}</p>
      </div>

      {loading ? (
        <div className="text-[#78716c] text-center py-20">
          <div className="inline-block w-5 h-5 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin mb-3" />
          <div className="text-sm">Loading from Monday.com...</div>
        </div>
      ) : error ? (
        <div className="p-6 bg-[#1a1714] border border-[#f87171]/20 rounded-xl">
          <div className="text-[#f87171] font-bold text-sm mb-2">Connection Error</div>
          <div className="text-xs text-[#78716c]">{error}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]">
              <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Total Items</div>
              <div className="text-[28px] font-extrabold" style={{color: accentColor}}>{items.length}</div>
            </div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]">
              <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Groups</div>
              <div className="text-[28px] font-extrabold">{groups.length}</div>
            </div>
            <div className="p-5 rounded-xl bg-[#1a1714] border border-white/[0.06]">
              <div className="text-[10.5px] font-semibold text-[#78716c] uppercase tracking-wider mb-2">Board</div>
              <div className="text-sm font-bold truncate">{board?.name || title}</div>
            </div>
          </div>

          <div className="flex gap-2.5 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px]" />
            {groups.length > 1 && (
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
                <option value="all">All Groups</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
          </div>

          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Group</th>
                {columns.map(c => <th key={c} className="text-left p-3 font-semibold whitespace-nowrap">{c}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3 text-xs" style={{color: accentColor}}>{item.group}</td>
                    {columns.map(c => <td key={c} className="p-3 text-xs text-[#a8a29e] max-w-[200px] truncate">{item[c] || "—"}</td>)}
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={columns.length + 2} className="p-8 text-center text-[#57534e]">No items found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
