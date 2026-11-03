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
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Cloudflare Turnstile: checks the token the widget produced in the visitor's browser.
export async function verifyTurnstile(token: string, request: Request, secret: string) {
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
