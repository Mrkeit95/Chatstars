"use client";
import MondaySetup from "@/components/MondaySetup";

export default function SettingsPage() {
  return (
    <>
      <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Settings</h1><p className="text-[13px] text-[#78716c] mt-1">Dashboard configuration</p></div>
      <div className="space-y-5">
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-6">
          <h3 className="text-sm font-bold mb-4">Environment Variables</h3>
          <p className="text-xs text-[#78716c] mb-4">Configured in Vercel → Settings → Environment Variables</p>
          <div className="space-y-2">
            {["ANTHROPIC_API_KEY", "MONDAY_API_TOKEN", "TYPEFORM_TOKEN", "SUPABASE_KEY"].map(key => (
              <div key={key} className="flex items-center gap-3 p-3 bg-[#0c0a09] rounded-lg">
                <span className="text-xs font-mono text-[#78716c]">{key}</span>
                <span className="ml-auto text-[10px] font-semibold text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded">Required</span>
              </div>
            ))}
          </div>
        </div>
        <MondaySetup />
      </div>
    </>
  );
}
