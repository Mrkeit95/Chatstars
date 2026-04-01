// Supabase API proxy — Vercel Edge Function
const SB_URL = process.env.SUPABASE_URL || 'https://lescdotlrpmkumlgizsi.supabase.co/rest/v1';
const SB_KEY = process.env.SUPABASE_KEY;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,apikey,Authorization,Prefer',
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/sb\/?/, '');
  const target = `${SB_URL}/${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.set('apikey', SB_KEY);
  headers.set('Authorization', `Bearer ${SB_KEY}`);

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const respHeaders = new Headers(res.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(res.body, {
    status: res.status,
    headers: respHeaders,
  });
}

export const config = { runtime: 'edge' };
