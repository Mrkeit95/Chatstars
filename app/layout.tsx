"use client";
import "./globals.css";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import AIChat from "@/components/AIChat";
import { ADMINS, PASS } from "@/lib/types";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string|null>(null);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("cs_user");
    if (saved && ADMINS.includes(saved)) setUser(saved);
  }, []);

  function login(name: string, pass: string): string|null {
    if (!name) return "Select your name";
    if (pass !== PASS) return "Wrong password";
    setUser(name);
    sessionStorage.setItem("cs_user", name);
    return null;
  }

  function logout() { setUser(null); sessionStorage.removeItem("cs_user"); }

  if (!user) return (
    <html lang="en"><body>
      <LoginScreen onLogin={login} />
    </body></html>
  );

  return (
    <html lang="en"><body>
      <div className="flex min-h-screen">
        <Sidebar user={user} onLogout={logout} onAI={() => setShowAI(!showAI)} />
        <main className="flex-1 ml-[240px] min-h-screen">
          <div className="sticky top-0 z-30 bg-[#0c0a09]/85 backdrop-blur-xl border-b border-white/[0.06] px-8 h-14 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#57534e] uppercase tracking-[0.12em]">CHATSTARS</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#57534e]">{new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
              <button onClick={() => setShowAI(!showAI)} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#78716c] hover:bg-white/5 hover:text-white transition-all" title="AI Assistant">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="10" y1="22" x2="14" y2="22"/></svg>
              </button>
            </div>
          </div>
          <div className="p-8">{children}</div>
        </main>
        {showAI && <AIChat onClose={() => setShowAI(false)} />}
      </div>
    </body></html>
  );
}

function LoginScreen({ onLogin }: { onLogin: (n:string,p:string) => string|null }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const handleLogin = () => { const e = onLogin(name, pass); if (e) setErr(e); };
  return (
    <div className="fixed inset-0 bg-[#0c0a09] flex items-center justify-center z-[999]">
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-2xl p-11 w-[400px] max-w-[92vw]">
        <h1 className="text-[13px] font-bold tracking-[0.15em] uppercase text-[#4ade80] text-center mb-1">★ Chatstars</h1>
        <h2 className="text-[22px] font-extrabold text-center mb-6">Agency OS</h2>
        <label className="block text-[11px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Account</label>
        <select value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-lg bg-[#0c0a09] border border-white/[0.06] text-white text-sm mb-3.5 outline-none focus:border-[#4ade80]/40">
          <option value="">Select your name...</option>
          {ADMINS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <label className="block text-[11px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">Password</label>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder="Enter password" className="w-full p-3 rounded-lg bg-[#0c0a09] border border-white/[0.06] text-white text-sm mb-3.5 outline-none focus:border-[#4ade80]/40" />
        <button onClick={handleLogin} className="w-full p-3 rounded-lg bg-[#4ade80] text-[#0a0a0a] text-sm font-bold hover:brightness-110 transition">Sign In →</button>
        {err && <p className="text-[#f87171] text-xs text-center mt-2.5">{err}</p>}
      </div>
    </div>
  );
}
