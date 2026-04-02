"use client";
import { useState, useEffect } from "react";
import { getBoards } from "@/lib/monday";
import MondayBoard from "@/components/MondayBoard";

export default function Page() {
  const [boardId, setBoardId] = useState("");
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoards().then(b => {
      const all = b || [];
      setBoards(all);
      const match = all.find((board: any) => board.name.toLowerCase().includes("handbook"));
      if (match) setBoardId(match.id);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-[#78716c] text-center py-20">Connecting to Monday.com...</div>;

  if (!boardId) return (
    <div>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Employee Handbook</h1><p className="text-[13px] text-[#78716c] mt-1">Policies, guidelines, and resources</p></div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-6">
        <p className="text-sm text-[#78716c] mb-4">Select the Monday.com board:</p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {boards.map((b: any) => (
            <button key={b.id} onClick={() => setBoardId(b.id)} className="w-full flex items-center gap-3 p-3 bg-[#0c0a09] rounded-lg hover:bg-white/[0.04] transition text-left">
              <span className="text-xs font-mono text-[#4ade80]">{b.id}</span>
              <span className="text-xs font-semibold flex-1">{b.name}</span>
              <span className="text-[10px] text-[#57534e]">{b.items_count} items</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return <MondayBoard boardId={boardId} title="Employee Handbook" description="Policies, guidelines, and resources" />;
}
