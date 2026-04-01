import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return NextResponse.json({ reply: "AI not configured. Add ANTHROPIC_API_KEY to Vercel env vars." });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are an AI assistant for Chatstars, a creator management agency. Help with revenue analysis, creator performance, strategy, and operations. Be concise and actionable.",
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || "No response";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: "AI error: " + e.message });
  }
}
