"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user" | "assistant"; content: string; }

const QUICK_PROMPTS = [
  { label: "📊 Monthly overview", text: "Give me a full overview of how we're performing this month — revenue, boards, top creators, concerns" },
  { label: "🔍 Find a creator", text: "Where is " },
  { label: "⚠️ Who needs attention?", text: "Which creators are struggling and need immediate attention? Give me names, numbers, and what to do" },
  { label: "📋 Board comparison", text: "Compare all boards — revenue, % to goal, creator count. Which is strongest and weakest?" },
  { label: "✍️ Write mass message", text: "Write me a PPV promo mass message for a new exclusive video drop" },
  { label: "💬 Chat script", text: "Write me a chat script for upselling a custom video to a subscriber who just tipped $20" },
  { label: "📈 Revenue projection", text: "Based on our current pace, what will our end-of-month revenue be? Will we hit goal?" },
  { label: "🏢 Agency breakdown", text: "Break down revenue by agency — who's performing best and who's underperforming?" },
];

export default function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hey! I'm your Chatstars AI — I have access to **all your live data**: revenue, creators, boards, agencies, Monday.com, everything.\n\nI can:\n• Find any creator/page and tell you their board, revenue, status\n• Analyze performance and flag issues\n• Write mass messages, chat scripts, captions\n• Compare boards, agencies, or individual creators\n• Project revenue and suggest strategy\n\nWhat do you need?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-14) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  function handleQuickPrompt(p: typeof QUICK_PROMPTS[0]) {
    if (p.text.endsWith(" ")) {
      // This is a "fill in" prompt like "Where is "
      setInput(p.text);
      inputRef.current?.focus();
    } else {
      send(p.text);
    }
  }

  function formatContent(content: string) {
    return content.split("\n").map((line) => {
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
      line = line.replace(/\$(\d[\d,]*\.?\d*)/g, '<span class="text-[#4ade80] font-bold">$$$1</span>');
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        return `<div class="flex gap-2 ml-1 my-0.5"><span class="text-[#4ade80] shrink-0">•</span><span>${line.substring(2)}</span></div>`;
      }
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return `<div class="flex gap-2 ml-1 my-0.5"><span class="text-[#4ade80] shrink-0 font-bold text-xs">${num}.</span><span>${line.substring(line.indexOf(" ") + 1)}</span></div>`;
      }
      if (line.trim() === "") return '<div class="h-2"></div>';
      return `<p class="my-0.5">${line}</p>`;
    }).join("");
  }

  return (
    <div className="fixed top-0 right-0 w-[440px] max-w-full h-screen bg-[#131110] border-l border-white/[0.06] z-[101] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4ade80]/20 to-[#22d3ee]/20 border border-[#4ade80]/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-bold">Chatstars AI</div>
            <div className="flex items-center gap-1.5 text-[9px] text-[#57534e]"><div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse-slow" />Live data · Revenue · Monday.com</div>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-[#57534e] hover:text-white transition text-sm">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <div className="w-6 h-6 rounded-md bg-[#4ade80]/10 flex items-center justify-center mr-2 mt-1 shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg></div>}
            <div className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${m.role === "user" ? "bg-white/[0.08] text-white rounded-br-sm" : "bg-white/[0.03] text-[#d6d3d1] rounded-bl-sm"}`}>
              {m.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: formatContent(m.content) }} className="space-y-0.5" />
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-md bg-[#4ade80]/10 flex items-center justify-center mr-2 mt-1 shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg></div>
            <div className="bg-white/[0.03] rounded-xl rounded-bl-sm px-3.5 py-3 flex items-center gap-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-[#57534e]">Pulling live data...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-[9px] text-[#57534e] uppercase tracking-wider font-semibold mb-2">Quick Actions</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map(p => (
              <button key={p.label} onClick={() => handleQuickPrompt(p)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-[#78716c] hover:text-white hover:bg-white/[0.08] transition border border-transparent hover:border-white/[0.06]">{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3.5 border-t border-white/[0.06] shrink-0">
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask anything about the business..." className="flex-1 bg-[#0c0a09] border border-white/[0.06] rounded-lg px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-[#4ade80]/30 placeholder:text-[#3a3733]" />
          <button onClick={() => send()} disabled={loading} className="w-10 h-10 rounded-lg bg-[#4ade80] text-[#0a0a0a] flex items-center justify-center hover:brightness-110 transition disabled:opacity-50 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
