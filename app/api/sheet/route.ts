import { NextRequest, NextResponse } from "next/server";

const SHEETS: Record<string,string> = {
  chatstars: "1kUqGtf_Oc8HNOai1U8ZXey0oKw7Oj36R0RJNdFCSkn8",
  slushy: "1RWIYfuSKC8hb6DvVoDx3cw0gtLNL68uOYcMUpDvg-pM",
};

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "chatstars";
  const sheetName = req.nextUrl.searchParams.get("sheet");
  const gid = req.nextUrl.searchParams.get("gid");
  const sheetId = SHEETS[sid];
  if (!sheetId) return NextResponse.json({ error: "Unknown sheet" }, { status: 400 });

  // Try sheet name first, then gid, then auto-detect current month
  const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const currentMonth = months[new Date().getMonth()];
  const tabName = sheetName || currentMonth;
  
  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`,
    gid ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}` : null,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const csv = await res.text();
        if (csv.length > 100) {
          return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Cache-Control": "public, max-age=300" } });
        }
      }
    } catch {}
  }
  return NextResponse.json({ error: "All fetch attempts failed" }, { status: 502 });
}
