"use client";
import { useState } from "react";

const EVENTS = [
  { day: 1, text: "Month Start", color: "#4ade80" },
  { day: 5, text: "Board Review", color: "#60a5fa" },
  { day: 10, text: "Payroll", color: "#facc15" },
  { day: 15, text: "Mid-Month Review", color: "#fb923c" },
  { day: 20, text: "Goal Check-in", color: "#22d3ee" },
  { day: 25, text: "Payroll", color: "#facc15" },
  { day: 28, text: "Month-End Prep", color: "#a78bfa" },
];

export default function CalendarPage() {
  const [date, setDate] = useState(new Date(2026, 2, 1));
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const startDay = first.getDay();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();

  const prevDays = Array.from({ length: startDay }, (_, i) => ({ day: new Date(y, m, -startDay + i + 1).getDate(), other: true }));
  const monthDays = Array.from({ length: last.getDate() }, (_, i) => ({ day: i + 1, other: false, isToday: i + 1 === today.getDate() && m === today.getMonth() && y === today.getFullYear() }));
  const remaining = (7 - (startDay + last.getDate()) % 7) % 7;
  const nextDays = Array.from({ length: remaining }, (_, i) => ({ day: i + 1, other: true }));
  const allDays = [...prevDays, ...monthDays, ...nextDays];

  return (
    <>
      <div className="flex justify-between items-start mb-7">
        <div><h1 className="text-[26px] font-extrabold tracking-tight">{months[m]} {y}</h1><p className="text-[13px] text-[#78716c] mt-1">Events & schedule</p></div>
        <div className="flex gap-2">
          <button onClick={() => setDate(new Date(y, m - 1, 1))} className="px-4 py-2 rounded-lg bg-[#1a1714] border border-white/[0.06] text-xs font-semibold text-[#78716c] hover:text-white transition">← Prev</button>
          <button onClick={() => setDate(new Date(y, m + 1, 1))} className="px-4 py-2 rounded-lg bg-[#1a1714] border border-white/[0.06] text-xs font-semibold text-[#78716c] hover:text-white transition">Next →</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
        {days.map(d => <div key={d} className="bg-[#1a1714] p-3 text-center text-[10px] font-bold text-[#57534e] uppercase tracking-wider">{d}</div>)}
        {allDays.map((d, i) => {
          const events = !d.other ? EVENTS.filter(e => e.day === d.day) : [];
          return (
            <div key={i} className={`bg-[#1a1714] p-2.5 min-h-[90px] text-xs transition hover:bg-white/[0.02] ${d.other ? "opacity-25" : ""}`}>
              <div className={`font-bold mb-1 ${(d as any).isToday ? "text-[#4ade80]" : ""}`}>{d.day}</div>
              {events.map((e, j) => <div key={j} className="text-[9px] px-1.5 py-0.5 rounded mt-1 font-semibold truncate" style={{background: e.color + "20", color: e.color}}>{e.text}</div>)}
            </div>
          );
        })}
      </div>
    </>
  );
}
