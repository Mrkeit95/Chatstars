// Netlify function to send reminder emails via Resend
export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;

  try {
    const body = await req.json();
    const { to, name, formName } = body;

    if (!to) return new Response(JSON.stringify({ error: 'Missing email' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    const firstName = (name || '').split(' ')[0] || 'there';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Chatstars <onboarding@resend.dev>',
        to: [to],
        subject: 'Complete Your Chatstars Application',
        html: `
          <div style="font-family: -apple-system, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: 0.04em;">★ CHATSTARS</span>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>
            <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 16px;">We noticed you started your application${formName ? ' for <strong>' + formName + '</strong>' : ''} but haven't finished it yet.</p>
            <p style="font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 24px;">It only takes a few minutes to complete — and it's the first step toward joining our team and earning from anywhere.</p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="https://candid-palmier-b48613.netlify.app/apply" style="display: inline-block; padding: 14px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">Complete Your Application →</a>
            </div>
            <p style="font-size: 14px; color: #888; line-height: 1.6;">If you've already completed it — great, just ignore this email!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0 16px;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">Chatstars — Building teams that perform.</p>
          </div>
        `
      })
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result }), { status: res.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};


export const config = { runtime: "edge" };
