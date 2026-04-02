import { NextRequest, NextResponse } from "next/server";
const INFLOWW_BASE = "https://openapi.infloww.com";
export async function GET(req: NextRequest) {
  const apiKey = process.env.INFLOWW_API_KEY;
  const oid = process.env.INFLOWW_OID;
  if (!apiKey || !oid) return NextResponse.json({ error: "INFLOWW_API_KEY or INFLOWW_OID not set" }, { status: 500 });
  const endpoint = req.nextUrl.searchParams.get("endpoint") || "creators";
  const params = new URLSearchParams();
  req.nextUrl.searchParams.forEach((val, key) => { if (key !== "endpoint") params.set(key, val); });
  const url = `${INFLOWW_BASE}/v1/${endpoint}${params.toString() ? "?" + params.toString() : ""}`;
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json", "Authorization": apiKey, "x-oid": oid } });
    if (!res.ok) { const t = await res.text(); return NextResponse.json({ error: `Infloww ${res.status}: ${t}` }, { status: res.status }); }
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
