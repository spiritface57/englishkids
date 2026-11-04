// Pieces shared by the booking and reviews handlers.

export interface Env {
  ASSETS: Fetcher;
  BOOKINGS?: KVNamespace;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TURNSTILE_SECRET_KEY?: string;
  BREVO_API_KEY?: string;
  EMAIL_TO?: string;
  EMAIL_FROM?: string;
  REVIEWS?: KVNamespace;
  REVIEW_SECRET?: string;
  AI?: Ai;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' },
  });

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Cloudflare Turnstile: checks the token the widget produced in the visitor's browser.
export async function verifyTurnstile(token: string, request: Request, secret: string) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) body.append('remoteip', ip);
  // Any failure talking to Cloudflare counts as "not verified" rather than crashing the request.
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    if (!res.ok) return false;
    const outcome = await res.json<{ success?: boolean }>();
    return outcome.success === true;
  } catch (err) {
    console.error('turnstile verify failed', err);
    return false;
  }
}

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

// Counts requests per visitor (hashed IP, never stored in the clear) in KV for a day. Returns false once `max`
// is reached. KV isn't atomic, so a burst can slip a request or two past the limit; Turnstile covers that.
export async function underDailyLimit(kv: KVNamespace, prefix: string, request: Request, max: number) {
  const ip = request.headers.get('cf-connecting-ip');
  if (!ip) return true;
  const key = `${prefix}:${hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))}`;
  const used = Number(await kv.get(key)) || 0;
  if (used >= max) return false;
  await kv.put(key, String(used + 1), { expirationTtl: 86400 });
  return true;
}
