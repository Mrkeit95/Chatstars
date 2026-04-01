// Typeform API proxy — Vercel Edge Function
// Token injected server-side from env var so it never appears in client code
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/tf\/?/, '');
  const target = `https://api.typeform.com/${path}${url.search}`;

  const TF_TOKEN = process.env.TYPEFORM_TOKEN;

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (TF_TOKEN) {
    headers.set('Authorization', `Bearer ${TF_TOKEN}`);
  } else {
    // Fallback: forward client-sent Authorization header
    const clientAuth = req.headers.get('Authorization');
    if (clientAuth) headers.set('Authorization', clientAuth);
  }

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
