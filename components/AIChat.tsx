"use client";
import { useState, useRef, useEffect } from "react";

interface Message { role: "user"|"assistant"; content: string; }

export default function AIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hi! I'm your Chatstars AI assistant. Ask me anything about your creators, revenue, boards, or strategy." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-10) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed top-0 right-0 w-[400px] max-w-full h-screen bg-[#161311] border-l border-white/[0.06] z-[101] flex flex-col shadow-2xl">
      <div className="px-5 py-4 border-b border-white/[0.06] flex justify-between items-center">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse-slow" /><span className="text-sm font-bold">AI Assistant</span></div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center text-[#78716c] hover:text-white transition text-lg">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${m.role === "user" ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-white/[0.04] text-[#a8a29e]"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white/[0.04] rounded-xl px-4 py-2.5 text-[13px] text-[#57534e]">Thinking...</div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask about revenue, creators, strategy..." className="flex-1 bg-[#0c0a09] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#4ade80]/40 placeholder:text-[#57534e]" />
          <button onClick={send} disabled={loading} className="px-4 py-2.5 rounded-lg bg-[#4ade80] text-[#0a0a0a] text-sm font-bold hover:brightness-110 transition disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  );
}
