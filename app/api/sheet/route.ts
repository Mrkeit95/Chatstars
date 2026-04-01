import { NextRequest, NextResponse } from "next/server";

const SHEETS: Record<string,string> = {
  chatstars: "1kUqGtf_Oc8HNOai1U8ZXey0oKw7Oj36R0RJNdFCSkn8",
  slushy: "1RWIYfuSKC8hb6DvVoDx3cw0gtLNL68uOYcMUpDvg-pM",
};

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "chatstars";
  const sheetName = req.nextUrl.searchParams.get("sheet");
  const gid = req.nextUrl.searchParams.get("gid") || "0";
  const sheetId = SHEETS[sid];
  if (!sheetId) return NextResponse.json({ error: "Unknown sheet" }, { status: 400 });

  const target = sheetName
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
    : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const res = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json({ error: "Sheet fetch failed" }, { status: 502 });
    const csv = await res.text();
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Cache-Control": "public, max-age=300" } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
