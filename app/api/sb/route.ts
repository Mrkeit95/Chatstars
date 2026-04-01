import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
export async function PATCH(req: NextRequest) { return handle(req); }
export async function DELETE(req: NextRequest) { return handle(req); }

async function handle(req: NextRequest) {
  const SB_URL = process.env.SUPABASE_URL || "https://lescdotlrpmkumlgizsi.supabase.co/rest/v1";
  const SB_KEY = process.env.SUPABASE_KEY || "";
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/sb\/?/, "");
  const target = `${SB_URL}/${path}${url.search}`;
  const headers: Record<string,string> = { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  const prefer = req.headers.get("Prefer"); if (prefer) headers["Prefer"] = prefer;
  const res = await fetch(target, { method: req.method, headers, body: req.method !== "GET" ? await req.text() : undefined });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
