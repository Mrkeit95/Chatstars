"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ICON = {
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  trend: "M23 6l-9.5 9.5-5-5L1 18",
  board: "M3 3h18v18H3V3zm0 6h18M9 21V9",
  users: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
  card: "M1 4h22v16H1V4zm0 6h22",
  userX: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM18 8l5 5m0-5l-5 5",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  cal: "M3 4h18v18H3V4zm13-2v4M8 2v4M3 10h18",
  check: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6z",
  msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  brief: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01z",
  target: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  people: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  clip: "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z",
  bar: "M18 20V10M12 20V4M6 20v-6",
  ai: "M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z",
};

const NAV = [
  { group: "Chatstars", items: [
    { href: "/", label: "Dashboard", icon: "grid" },
    { href: "/revenue", label: "Revenue Tracker", icon: "trend" },
    { href: "/boards", label: "Boards", icon: "board" },
    { href: "/clients", label: "Clients", icon: "users" },
    { href: "/billing", label: "Billing", icon: "card" },
    { href: "/offboarded", label: "Offboarded", icon: "userX" },
  ]},
  { group: "Management", items: [
    { href: "/team/general-manager", label: "General Manager", icon: "star" },
    { href: "/team/account-executive", label: "Account Executive", icon: "brief" },
    { href: "/team/chat-manager", label: "Chat Manager", icon: "msg" },
    { href: "/team/hocm", label: "HOCM", icon: "target" },
    { href: "/team/training-manager", label: "Training Manager", icon: "book" },
    { href: "/team/hiring-manager", label: "Hiring Manager", icon: "people" },
    { href: "/team/content-manager", label: "Content Manager", icon: "clip" },
    { href: "/team/queue-manager", label: "Queue Manager", icon: "bar" },
  ]},
  { group: "Chatter", items: [
    { href: "/chatter/schedule", label: "Schedule", icon: "cal" },
    { href: "/chatter/meetings", label: "Meetings", icon: "msg" },
    { href: "/chatter/rap-sheets", label: "Rap Sheets", icon: "clip" },
    { href: "/chatter/feedback", label: "Feedback", icon: "msg" },
    { href: "/chatter/handbook", label: "Handbook", icon: "book" },
  ]},
  { group: "Tools", items: [
    { href: "/notifications", label: "Notifications", icon: "bell", badge: true },
    { href: "/calendar", label: "Calendar", icon: "cal" },
    { href: "/tasks", label: "Tasks", icon: "check" },
    { href: "/settings", label: "Settings", icon: "gear" },
  ]},
];

function I({ d }: { d: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d={d}/></svg>;
}

export default function Sidebar({ user, onLogout, onAI }: { user: string; onLogout: () => void; onAI: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (g: string) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <aside className="w-[240px] min-h-screen bg-[#161311] border-r border-white/[0.06] fixed top-0 left-0 z-50 flex flex-col">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#4ade80"/></svg>
        <span className="text-[15px] font-extrabold tracking-[0.06em] uppercase">Chatstars</span>
      </div>
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV.map(g => (
          <div key={g.group}>
            <button onClick={() => toggle(g.group)} className="w-full text-left text-[9px] font-bold text-[#57534e] uppercase tracking-[0.12em] px-3 pt-4 pb-1.5 flex items-center justify-between hover:text-[#78716c] transition">
              {g.group}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${collapsed[g.group] ? "-rotate-90" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {!collapsed[g.group] && g.items.map(item => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium mb-px transition-all relative ${active ? "bg-[#4ade80]/10 text-[#4ade80] font-semibold" : "text-[#78716c] hover:bg-white/[0.04] hover:text-white"}`}>
                  <I d={(ICON as any)[item.icon] || ICON.grid} />
                  {item.label}
                  {(item as any).badge && <span className="absolute right-2.5 bg-[#f87171] text-white text-[9px] font-bold rounded-full px-1.5 min-w-[18px] text-center">3</span>}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="px-3 pt-4 pb-1.5"><button onClick={onAI} className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium text-[#78716c] hover:bg-white/[0.04] hover:text-white transition"><I d={ICON.ai} />AI Assistant</button></div>
      </nav>
      <div className="px-3 py-3 border-t border-white/[0.06] flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0">{user[0]}</div>
        <div className="flex-1 min-w-0"><div className="text-[12px] font-semibold truncate">{user}</div><div className="text-[9px] text-[#57534e] uppercase tracking-wider">Admin</div></div>
        <button onClick={onLogout} className="text-[#57534e] hover:text-[#f87171] p-1 rounded transition" title="Log out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
}
