"use client";
import { Creator } from "@/lib/types";
import { fmt, fmtFull, pct, colorFor } from "@/lib/data";

export default function CreatorPanel({ creator, onClose }: { creator: Creator|null; onClose: () => void }) {
  if (!creator) return null;
  const c = creator;
  const dg = c.dg || 0;
  const mx = Math.max(...c.dy, dg, 1);
  const actDays = c.dy.filter(v => v > 0).length;
  const avg = actDays > 0 ? c.run / actDays : 0;
  const ptg = c.ptg !== null ? c.ptg : pct(c.run, c.goal);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 w-[680px] max-w-full h-screen bg-[#161311] border-l border-white/[0.06] z-[101] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#161311] px-7 py-5 border-b border-white/[0.06] flex justify-between items-center">
          <h3 className="text-lg font-extrabold">{c.t || c.n}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg border border-white/[0.06] flex items-center justify-center text-[#78716c] hover:text-white transition text-lg">✕</button>
        </div>
        <div className="p-7">
          <p className="text-xs text-[#78716c] mb-5">{c.ag || "N/A"} · {c.b || "Unassigned"} · <span style={{color: c.ac ? "#4ade80" : "#f87171"}}>{c.ac ? "Active" : "Inactive"}</span></p>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[["March Running", fmt(c.run), "#4ade80"], ["Goal", fmt(c.goal), ""], ["% to Goal", ptg + "%", colorFor(ptg)],
              ["February", fmt(c.feb), ""], ["January", fmt(c.jan), ""], ["December", fmt(c.dec), ""],
              ["Projection", fmt(c.proj), ""], ["Avg/Day", fmtFull(avg), ""], ["Tips & Msgs", fmt(c.tip), ""]
            ].map(([label, val, color], i) => (
              <div key={i} className="p-3.5 rounded-lg bg-[#1a1714] border border-white/[0.06]">
                <div className="text-[9px] text-[#57534e] uppercase tracking-wider font-semibold mb-1">{label}</div>
                <div className="text-base font-extrabold" style={color ? {color} : {}}>{val}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-2">Daily Revenue — March 2026</div>
          <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5 mb-5">
            <div className="flex items-end gap-[3px] h-[140px] relative">
              {dg > 0 && <div className="absolute left-0 right-0 border-t border-dashed border-[#facc15]/40" style={{bottom: (dg/mx*120+20) + "px"}}><span className="absolute right-0 -top-3 text-[8px] text-[#facc15] font-bold">Goal {fmt(dg)}/d</span></div>}
              {c.dy.map((v, i) => (
                <div key={i} className="flex-1 group relative" style={{height: v > 0 ? Math.max(v/mx*120, 3) : 2, background: v === 0 ? "rgba(255,255,255,0.03)" : v >= dg && dg > 0 ? "#4ade80" : "#f87171", borderRadius: "3px 3px 0 0"}}>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#161311] border border-white/[0.06] rounded-md px-2 py-1 text-[9px] font-bold whitespace-nowrap z-10">Day {i+1}: {fmtFull(v)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-[3px] mt-1">{Array.from({length:31},(_,i)=><span key={i} className="flex-1 text-[7px] text-[#57534e] text-center">{i+1}</span>)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
