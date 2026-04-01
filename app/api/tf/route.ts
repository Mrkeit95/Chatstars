import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/tf\/?/, "");
  const target = `https://api.typeform.com/${path}${url.search}`;
  const TF = process.env.TYPEFORM_TOKEN;
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (TF) headers["Authorization"] = `Bearer ${TF}`;
  else { const auth = req.headers.get("Authorization"); if (auth) headers["Authorization"] = auth; }
  const res = await fetch(target, { headers });
  const body = await res.text();
  return new NextResponse(body, { status: res.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
