// Google Sheets CSV proxy — Vercel Edge Function
// Supports multiple whitelisted sheets via ?sid= parameter

const SHEETS = {
  chatstars: '1kUqGtf_Oc8HNOai1U8ZXey0oKw7Oj36R0RJNdFCSkn8',
  slushy:    '1RWIYfuSKC8hb6DvVoDx3cw0gtLNL68uOYcMUpDvg-pM',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url);
  const sid = url.searchParams.get('sid') || 'chatstars';
  const sheetId = SHEETS[sid];

  if (!sheetId) {
    return new Response(JSON.stringify({ error: 'Unknown sheet id: ' + sid }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Support both gid (numeric tab id) and sheet (tab name) params
  const gid = url.searchParams.get('gid');
  const sheetName = url.searchParams.get('sheet');

  let target;
  if (sheetName) {
    target = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  } else {
    target = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid || '0'}`;
  }

  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Sheet fetch failed', status: res.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const csv = await res.text();
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export const config = { runtime: 'edge' };
