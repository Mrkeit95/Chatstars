import { NextRequest, NextResponse } from "next/server";

const INFLOWW_BASE = "https://openapi.infloww.com";

export async function GET(req: NextRequest) {
  const apiKey = process.env.INFLOWW_API_KEY;
  const oid = process.env.INFLOWW_OID;
  if (!apiKey || !oid) return NextResponse.json({ error: "INFLOWW_API_KEY or INFLOWW_OID not set" }, { status: 500 });

  const endpoint = req.nextUrl.searchParams.get("endpoint") || "creators";
  const action = req.nextUrl.searchParams.get("action"); // "all_transactions" = fetch txns for all creators
  const headers = { "Accept": "application/json", "Authorization": apiKey, "x-oid": oid };

  // ─── SPECIAL ACTION: fetch transactions for ALL creators at once ───
  if (action === "all_transactions") {
    try {
      // Step 1: Get all creators
      const cRes = await fetch(`${INFLOWW_BASE}/v1/creators?limit=100`, { headers });
      if (!cRes.ok) return NextResponse.json({ error: "Failed to fetch creators" }, { status: 502 });
      const cData = await cRes.json();
      const creators = cData?.data?.list || [];
      
      // Step 2: Fetch transactions for each creator (batch, respect rate limits)
      const allTxns: any[] = [];
      const allRefunds: any[] = [];
      const allLinks: any[] = [];
      const startTime = req.nextUrl.searchParams.get("startTime") || String(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endTime = req.nextUrl.searchParams.get("endTime") || String(Date.now());
      
      // Process 5 creators at a time (respect 5 QPS limit)
      for (let i = 0; i < creators.length; i += 5) {
        const batch = creators.slice(i, i + 5);
        const results = await Promise.all(batch.map(async (c: any) => {
          const cid = c.id;
          const [txRes, refRes, linkRes] = await Promise.all([
            fetch(`${INFLOWW_BASE}/v1/transactions?creatorId=${cid}&limit=100&startTime=${startTime}&endTime=${endTime}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${INFLOWW_BASE}/v1/refunds?creatorId=${cid}&limit=100`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(`${INFLOWW_BASE}/v1/links?creatorId=${cid}&limit=100`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          ]);
          return {
            creator: c,
            transactions: (txRes?.data?.list || []).map((t: any) => ({ ...t, creatorId: cid, creatorName: c.name || c.userName })),
            refunds: (refRes?.data?.list || []).map((r: any) => ({ ...r, creatorId: cid, creatorName: c.name || c.userName })),
            links: (linkRes?.data?.list || []).map((l: any) => ({ ...l, creatorId: cid, creatorName: c.name || c.userName })),
          };
        }));
        results.forEach(r => {
          allTxns.push(...r.transactions);
          allRefunds.push(...r.refunds);
          allLinks.push(...r.links);
        });
      }

      return NextResponse.json({
        data: {
          creators,
          transactions: allTxns,
          refunds: allRefunds,
          links: allLinks,
          fetchedAt: Date.now(),
        }
      }, { headers: { "Cache-Control": "public, max-age=300" } });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ─── STANDARD single-endpoint fetch ───
  const params = new URLSearchParams();
  req.nextUrl.searchParams.forEach((val, key) => { if (key !== "endpoint" && key !== "action") params.set(key, val); });
  if (!params.has("limit")) params.set("limit", "100");

  const url = `${INFLOWW_BASE}/v1/${endpoint}?${params.toString()}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Infloww ${res.status}`, details: errText }, { status: res.status });
    }
    return NextResponse.json(await res.json(), { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
