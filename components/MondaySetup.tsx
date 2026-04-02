"use client";
import { useState, useEffect } from "react";
import { getBoards } from "@/lib/monday";

export default function MondaySetup() {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getBoards().then(b => { setBoards(b || []); setLoading(false); }); }, []);

  return (
    <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-6">
      <h3 className="text-sm font-bold mb-2">Monday.com Boards</h3>
      <p className="text-xs text-[#78716c] mb-4">Your connected boards. Use these IDs to configure each page.</p>
      {loading ? <div className="text-xs text-[#57534e]">Loading boards...</div> : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {boards.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 p-3 bg-[#0c0a09] rounded-lg">
              <span className="text-xs font-mono text-[#4ade80] min-w-[80px]">{b.id}</span>
              <span className="text-xs font-semibold flex-1">{b.name}</span>
              <span className="text-[10px] text-[#57534e]">{b.items_count} items</span>
            </div>
          ))}
          {boards.length === 0 && <div className="text-xs text-[#f87171]">No boards found. Check your MONDAY_API_TOKEN.</div>}
        </div>
      )}
    </div>
  );
}
