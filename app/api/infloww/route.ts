import { NextRequest, NextResponse } from "next/server";

const INFLOWW_BASE = "https://openapi.infloww.com";

export async function GET(req: NextRequest) {
  const apiKey = process.env.INFLOWW_API_KEY;
  const oid = process.env.INFLOWW_OID;
  if (!apiKey || !oid) return NextResponse.json({ error: "INFLOWW_API_KEY or INFLOWW_OID not set" }, { status: 500 });

  const endpoint = req.nextUrl.searchParams.get("endpoint") || "creators";
  const fetchAll = req.nextUrl.searchParams.get("all") === "true";
  const params = new URLSearchParams();
  req.nextUrl.searchParams.forEach((val, key) => { if (key !== "endpoint" && key !== "all") params.set(key, val); });

  // Add defaults
  if (endpoint === "transactions" || endpoint === "refunds") {
    if (!params.has("startTime")) params.set("startTime", String(Date.now() - 30 * 24 * 60 * 60 * 1000));
    if (!params.has("endTime")) params.set("endTime", String(Date.now()));
  }
  if (!params.has("limit")) params.set("limit", "100");

  const headers = { "Accept": "application/json", "Authorization": apiKey, "x-oid": oid };

  try {
    // If fetchAll, paginate through all results
    if (fetchAll) {
      let allItems: any[] = [];
      let cursor: string | null = null;
      let platformCode = "";
      for (let page = 0; page < 20; page++) { // max 20 pages = 2000 items
        const p = new URLSearchParams(params);
        if (cursor) p.set("cursor", cursor);
        const url = `${INFLOWW_BASE}/v1/${endpoint}?${p.toString()}`;
        const res = await fetch(url, { headers });
        if (!res.ok) break;
        const data = await res.json();
        const list = data?.data?.list || [];
        if (!platformCode && data?.data?.platformCode) platformCode = data.data.platformCode;
        allItems = allItems.concat(list);
        cursor = data?.data?.cursor || null;
        if (!cursor || list.length < 100) break; // no more pages
      }
      return NextResponse.json({ data: { list: allItems, platformCode, totalFetched: allItems.length } }, { headers: { "Cache-Control": "public, max-age=300" } });
    }

    // Single page fetch
    const url = `${INFLOWW_BASE}/v1/${endpoint}?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text();
      // Fallback: try without date params
      if (res.status === 400) {
        const fb = new URLSearchParams({ limit: "100" });
        const res2 = await fetch(`${INFLOWW_BASE}/v1/${endpoint}?${fb.toString()}`, { headers });
        if (res2.ok) return NextResponse.json(await res2.json(), { headers: { "Cache-Control": "public, max-age=300" } });
      }
      return NextResponse.json({ error: `Infloww ${res.status}`, details: errText }, { status: res.status });
    }
    return NextResponse.json(await res.json(), { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
