// Cloudflare Worker: serves the built site from ./dist (static assets), handles POST /api/book and /api/reviews*.
// Booking requests are checked with Cloudflare Turnstile (if TURNSTILE_SECRET_KEY is set), then emailed via Brevo,
// saved to KV and/or sent to Telegram, whichever is configured.
// When none is configured it returns 503, and the site falls back to sending the request via WhatsApp.

import { bookingHtml, bookingSubject, bookingText, type BookingEmail } from './email';
import { sendMail } from './brevo';
import { handleReviews } from './reviews';
import { json, str, underDailyLimit, verifyTurnstile, type Env } from './shared';

const BOOKINGS_PER_DAY = 3; // per visitor

type Booking = {
  parentName?: unknown;
  phone?: unknown;
  summary?: unknown;
  details?: unknown;
  notes?: unknown;
  lang?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
};

// [label, value] pairs from the form; anything malformed or empty is dropped.
const pairs = (v: unknown): [string, string][] =>
  Array.isArray(v)
    ? v
        .slice(0, 12)
        .filter((p): p is [string, string] => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string')
        .map(([k, val]): [string, string] => [str(k, 60), str(val, 300)])
        .filter(([k, val]) => k && val)
    : [];

async function handleBooking(request: Request, env: Env) {
  let data: Booking;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (str(data.website, 200)) return json({ ok: true });

  // Without the Turnstile secret the form would be open to bots, so refuse (the site then offers WhatsApp).
  if (!env.TURNSTILE_SECRET_KEY) return json({ ok: false, error: 'not_configured' }, 503);
  if (!(await verifyTurnstile(str(data.turnstileToken, 2048), request, env.TURNSTILE_SECRET_KEY))) {
    return json({ ok: false, error: 'captcha' }, 403);
  }

  const parentName = str(data.parentName, 100);
  const phone = str(data.phone, 20);
  const summary = str(data.summary, 2000);
  if (!parentName || !/^\+?\d{8,15}$/.test(phone)) return json({ ok: false, error: 'invalid_fields' }, 400);

  // Stops one visitor flooding the inbox, Telegram and the Brevo quota.
  const limitKv = env.BOOKINGS ?? env.REVIEWS;
  if (limitKv && !(await underDailyLimit(limitKv, 'book-ip', request, BOOKINGS_PER_DAY))) {
    return json({ ok: false, error: 'rate_limited' }, 429);
  }

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
    const booking: BookingEmail = {
      parentName,
      phone,
      details: pairs(data.details),
      notes: str(data.notes, 2000),
      createdAt: new Date(record.createdAt),
      lang: record.lang,
      country: record.country,
    };
    delivered =
      (await sendMail(env, env.BREVO_API_KEY, {
        subject: bookingSubject(booking),
        text: bookingText(booking),
        html: bookingHtml(booking),
      })) || delivered;
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
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/book') {
      return request.method === 'POST' ? handleBooking(request, env) : json({ ok: false }, 405);
    }
    if (pathname.startsWith('/api/reviews')) return handleReviews(request, env, ctx, pathname);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
