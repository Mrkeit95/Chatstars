"use client";
import { useState, useEffect } from "react";
import { Creator } from "@/lib/types";
import { fetchCreators, generateNotifications } from "@/lib/data";

const COLORS = { success: "#4ade80", warning: "#facc15", danger: "#f87171", info: "#60a5fa" };

export default function NotificationsPage() {
  const [D, setD] = useState<Creator[]>([]);
  useEffect(() => { fetchCreators().then(setD); }, []);
  if (!D.length) return <div className="text-[#78716c] text-center py-20">Loading...</div>;
  const notifs = generateNotifications(D);
  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Notifications</h1><p className="text-[13px] text-[#78716c] mt-1">Auto-generated alerts based on live data</p></div>
      <div className="space-y-2.5">
        {notifs.map((n, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-[#1a1714] border border-white/[0.06] rounded-xl">
            <div className="w-2 h-2 rounded-full shrink-0" style={{background: COLORS[n.type]}} />
            <div className="flex-1 text-[13px] font-medium">{n.text}</div>
            <div className="text-[11px] text-[#57534e]">{n.time}</div>
          </div>
        ))}
      </div>
    </>
  );
}
