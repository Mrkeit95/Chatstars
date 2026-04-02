import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
export async function OPTIONS() {
  return new Response("", { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
}

async function handle(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/tf\/?/, "");
  const target = `https://api.typeform.com/${path}${url.search}`;
  const TF = process.env.TYPEFORM_TOKEN;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (TF) headers["Authorization"] = `Bearer ${TF}`;
  else { const auth = req.headers.get("Authorization"); if (auth) headers["Authorization"] = auth; }
  try {
    const res = await fetch(target, { method: req.method, headers, body: req.method !== "GET" ? await req.text() : undefined });
    const body = await res.text();
    return new NextResponse(body, { status: res.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
