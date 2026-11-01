// Cloudflare Worker: serves the built site from ./dist (static assets) and handles POST /api/book.
// Booking requests are checked with Cloudflare Turnstile (if TURNSTILE_SECRET_KEY is set), then emailed via Brevo,
// saved to KV and/or sent to Telegram, whichever is configured.
// When none is configured it returns 503, and the site falls back to sending the request via WhatsApp.

interface Env {
  ASSETS: Fetcher;
  BOOKINGS?: KVNamespace;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TURNSTILE_SECRET_KEY?: string;
  BREVO_API_KEY?: string;
  EMAIL_TO?: string;
  EMAIL_FROM?: string;
}

type Booking = {
  parentName?: unknown;
  phone?: unknown;
  summary?: unknown;
  lang?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function verifyTurnstile(token: string, request: Request, secret: string) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const outcome = await res.json<{ success: boolean }>();
  return outcome.success;
}

async function sendEmail(env: Env, apiKey: string, subject: string, text: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Miss Leila website', email: env.EMAIL_FROM || 'noreply@englishkids.ir' },
      to: [{ email: env.EMAIL_TO || 'admin@englishkids.ir' }],
      subject,
      textContent: text,
      htmlContent: `<div dir="auto" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.8;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    }),
  });
  if (!res.ok) console.error('Brevo error', res.status, await res.text());
  return res.ok;
}

async function handleBooking(request: Request, env: Env) {
  let data: Booking;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (str(data.website, 200)) return json({ ok: true });

  if (env.TURNSTILE_SECRET_KEY && !(await verifyTurnstile(str(data.turnstileToken, 2048), request, env.TURNSTILE_SECRET_KEY))) {
    return json({ ok: false, error: 'captcha' }, 403);
  }

  const parentName = str(data.parentName, 100);
  const phone = str(data.phone, 20);
  const summary = str(data.summary, 2000);
  if (!parentName || !/^\+?\d{8,15}$/.test(phone)) return json({ ok: false, error: 'invalid_fields' }, 400);

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lang: str(data.lang, 5),
    parentName,
    phone,
    summary,
    country: request.headers.get('cf-ipcountry') ?? '',
  };

  let delivered = false;

  if (env.BOOKINGS) {
    await env.BOOKINGS.put(`booking:${record.createdAt}:${record.id}`, JSON.stringify(record));
    delivered = true;
  }

  if (env.BREVO_API_KEY) {
    const text = `New booking request\n${record.createdAt}\n\n${summary}`;
    delivered = (await sendEmail(env, env.BREVO_API_KEY, `New booking request: ${parentName}`, text)) || delivered;
  }

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const text = `📚 New booking request\n🕒 ${record.createdAt}\n\n${summary}`;
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });
    delivered ||= res.ok;
  }

  return delivered ? json({ ok: true }) : json({ ok: false, error: 'not_configured' }, 503);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/book') {
      return request.method === 'POST' ? handleBooking(request, env) : json({ ok: false }, 405);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
