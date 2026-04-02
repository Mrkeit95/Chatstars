import { NextRequest, NextResponse } from "next/server";

const MONDAY_URL = "https://api.monday.com/v2";

export async function POST(req: NextRequest) {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) return NextResponse.json({ error: "MONDAY_API_TOKEN not set" }, { status: 500 });

  try {
    const { query, variables } = await req.json();
    const res = await fetch(MONDAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": token, "API-Version": "2024-10" },
      body: JSON.stringify({ query, variables }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
