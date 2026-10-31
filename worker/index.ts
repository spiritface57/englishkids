// Cloudflare Worker: serves the built site from ./dist (static assets) and handles POST /api/book.
// Booking requests are saved to KV (if the BOOKINGS binding exists) and sent to Telegram (if secrets are set).
// When neither is configured it returns 503, and the site falls back to sending the request via WhatsApp.

interface Env {
  ASSETS: Fetcher;
  BOOKINGS?: KVNamespace;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

type Booking = {
  parentName?: unknown;
  phone?: unknown;
  summary?: unknown;
  lang?: unknown;
  website?: unknown;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function handleBooking(request: Request, env: Env) {
  let data: Booking;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (str(data.website, 200)) return json({ ok: true });

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
