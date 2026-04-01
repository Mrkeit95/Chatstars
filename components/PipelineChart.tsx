"use client";
import { useState } from "react";
import { fmt } from "@/lib/data";

export default function PipelineChart({ dailyTotals, total }: { dailyTotals: number[]; total: number }) {
  const [hover, setHover] = useState<number|null>(null);
  const maxDT = Math.max(...dailyTotals.filter(v => v > 0));
  const W = 960, H = 220, PL = 60, PR = 20, PT = 20, PB = 35;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  const points = dailyTotals.map((v, i) => {
    if (v === 0) return null;
    return { x: PL + (i / 30) * plotW, y: PT + plotH - plotH * (v / maxDT), v, d: i + 1 };
  }).filter(Boolean) as { x: number; y: number; v: number; d: number }[];

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-6 relative">
      <div className="flex justify-between items-start mb-5">
        <span className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider">Revenue Pipeline</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold">{fmt(total)}</span>
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-slow" />
          <span className="text-[10px] font-semibold text-[#78716c] uppercase tracking-wider">Live</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0,1,2,3,4].map(i => {
          const y = PT + plotH - plotH * (i / 4);
          const val = maxDT * (i / 4);
          return <g key={i}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(255,255,255,0.04)" /><text x={PL-8} y={y+4} textAnchor="end" fill="#57534e" fontSize="10" fontFamily="Inter">${(val/1000).toFixed(0)}K</text></g>;
        })}
        <polyline fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinejoin="round" points={polyline} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(p.d)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={hover === p.d ? 7 : 4.5} fill={hover === p.d ? "#4ade80" : "#4ade80"} stroke="#0c0a09" strokeWidth="2.5" className="transition-all" />
            {hover === p.d && (
              <g>
                <rect x={p.x-45} y={p.y-38} width="90" height="28" rx="6" fill="#1a1714" stroke="rgba(255,255,255,0.1)" />
                <text x={p.x} y={p.y-20} textAnchor="middle" fill="#f5f5f4" fontSize="11" fontFamily="Inter" fontWeight="700">{p.d} · {fmt(p.v)}</text>
              </g>
            )}
          </g>
        ))}
        {Array.from({length: 31}, (_, i) => {
          const x = PL + (i / 30) * plotW;
          return i % 3 === 0 || i === 30 ? <text key={i} x={x} y={H-8} textAnchor="middle" fill="#57534e" fontSize="10" fontFamily="Inter">{i+1}</text> : null;
        })}
      </svg>
    </div>
  );
}
