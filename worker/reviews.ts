// Parents' reviews: submitted from the site, held until the teacher approves them, then shown on the home page.
//
//   POST /api/reviews           a parent submits a review (Turnstile-checked) → stored as pending, teacher gets an email
//   GET  /api/reviews           the published reviews (cached at Cloudflare's edge for a few minutes)
//   GET  /api/reviews/moderate  the page the email's buttons open: shows the review with a confirm button
//   POST /api/reviews/moderate  publishes or deletes it
//
// The email links carry an HMAC signature (secret REVIEW_SECRET), so only someone with the email can moderate.
// Opening a link only shows a confirm page; the change needs a button press, so mail scanners that open links
// can't publish or delete anything by themselves.
//
// KV (binding REVIEWS):  review:<id>         every review, pending or published
//                        reviews:published   the published ones, newest first, in one key so the site needs one read
//                        review-ip:<hash>    one review per visitor per day (expires after 24 hours)

import { sendMail } from './brevo';
import { escapeHtml } from './email';
import { json, str, verifyTurnstile, type Env } from './shared';

export type Review = {
  id: string;
  name: string;
  child: string;
  rating: number;
  text: string;
  lang: string;
  createdAt: string;
  status: 'pending' | 'published';
};

type PublicReview = Omit<Review, 'status'>;
type Action = 'publish' | 'delete';

const PUBLISHED = 'reviews:published';
const MAX_PUBLISHED = 200;

const toPublic = ({ status: _status, ...r }: Review): PublicReview => r;
// Line breaks are kept; other control characters are dropped.
const clean = (v: unknown, max: number) => str(v, max).replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '');

const bytesToHex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function sign(secret: string, id: string, action: Action) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}:${action}`)));
}

// Constant-time comparison, so the signature can't be guessed byte by byte.
const sameString = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const cacheKey = (request: Request) => new Request(new URL('/api/reviews', request.url).toString());

async function readPublished(kv: KVNamespace) {
  return (await kv.get<PublicReview[]>(PUBLISHED, 'json')) ?? [];
}

async function listPublished(request: Request, env: Env) {
  const key = cacheKey(request);
  const cached = await caches.default.match(key);
  if (cached) return cached;
  const reviews = env.REVIEWS ? await readPublished(env.REVIEWS) : [];
  const res = new Response(JSON.stringify({ reviews }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
  });
  await caches.default.put(key, res.clone());
  return res;
}

async function submit(request: Request, env: Env) {
  if (!env.REVIEWS || !env.REVIEW_SECRET) return json({ ok: false, error: 'not_configured' }, 503);

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (str(data.website, 200)) return json({ ok: true });

  if (
    env.TURNSTILE_SECRET_KEY &&
    !(await verifyTurnstile(str(data.turnstileToken, 2048), request, env.TURNSTILE_SECRET_KEY))
  ) {
    return json({ ok: false, error: 'captcha' }, 403);
  }

  const name = clean(data.name, 60).replace(/\s+/g, ' ');
  const child = clean(data.child, 40).replace(/\s+/g, ' ');
  const text = clean(data.text, 600).replace(/\n{3,}/g, '\n\n');
  const rating = Number(data.rating);
  if (
    name.length < 2 ||
    text.length < 10 ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    data.consent !== true
  ) {
    return json({ ok: false, error: 'invalid_fields' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ipKey = ip
    ? `review-ip:${bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))}`
    : '';
  if (ipKey && (await env.REVIEWS.get(ipKey))) return json({ ok: false, error: 'rate_limited' }, 429);

  const review: Review = {
    id: crypto.randomUUID(),
    name,
    child,
    rating,
    text,
    lang: str(data.lang, 5) === 'en' ? 'en' : 'fa',
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await env.REVIEWS.put(`review:${review.id}`, JSON.stringify(review));
  if (ipKey) await env.REVIEWS.put(ipKey, '1', { expirationTtl: 86400 });

  if (env.BREVO_API_KEY) {
    const origin = new URL(request.url).origin;
    const secret = env.REVIEW_SECRET;
    const link = async (action: Action) =>
      `${origin}/api/reviews/moderate?id=${review.id}&action=${action}&sig=${await sign(secret, review.id, action)}`;
    await sendMail(env, env.BREVO_API_KEY, reviewEmail(review, await link('publish'), await link('delete')));
  }
  return json({ ok: true });
}

async function moderate(request: Request, env: Env) {
  if (!env.REVIEWS || !env.REVIEW_SECRET)
    return page('تنظیم نشده', '<p>فضای ذخیره یا کلید امضا تنظیم نشده است.</p>', 503);

  const params =
    request.method === 'POST' ? new URLSearchParams(await request.text()) : new URL(request.url).searchParams;
  const id = params.get('id') ?? '';
  const action = params.get('action');
  const sig = params.get('sig') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id) || (action !== 'publish' && action !== 'delete')) {
    return page('لینک نامعتبر', '<p>این لینک کامل نیست.</p>', 400);
  }
  if (!sameString(sig, await sign(env.REVIEW_SECRET, id, action))) {
    return page('لینک نامعتبر', '<p>امضای این لینک درست نیست.</p>', 403);
  }

  const review = await env.REVIEWS.get<Review>(`review:${id}`, 'json');
  if (!review) return page('پیدا نشد', '<p>این نظر قبلاً حذف شده است.</p>', 404);

  if (request.method === 'GET') {
    const label = action === 'publish' ? 'بله، در سایت منتشر شود' : 'بله، حذف شود';
    const color = action === 'publish' ? '#009B4D' : '#E5484D';
    const already = action === 'publish' && review.status === 'published';
    return page(
      action === 'publish' ? 'انتشار نظر' : 'حذف نظر',
      `${reviewCard(review)}
      ${
        already
          ? '<p>این نظر همین حالا در سایت منتشر شده است.</p>'
          : `<form method="post">
        <input type="hidden" name="id" value="${id}"><input type="hidden" name="action" value="${action}"><input type="hidden" name="sig" value="${sig}">
        <button style="background:${color}">${label}</button>
      </form>`
      }`,
    );
  }

  const published = await readPublished(env.REVIEWS);
  const others = published.filter((r) => r.id !== id);
  if (action === 'publish') {
    const updated: Review = { ...review, status: 'published' };
    await env.REVIEWS.put(`review:${id}`, JSON.stringify(updated));
    const list = [toPublic(updated), ...others]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_PUBLISHED);
    await env.REVIEWS.put(PUBLISHED, JSON.stringify(list));
  } else {
    await env.REVIEWS.delete(`review:${id}`);
    if (others.length !== published.length) await env.REVIEWS.put(PUBLISHED, JSON.stringify(others));
  }
  await caches.default.delete(cacheKey(request));

  const origin = new URL(request.url).origin;
  return page(
    action === 'publish' ? 'منتشر شد ✅' : 'حذف شد',
    action === 'publish'
      ? `<p>نظر در سایت منتشر شد و تا چند دقیقه‌ی دیگر برای همه دیده می‌شود.</p><p><a href="${origin}/#reviews">دیدن در سایت</a></p>`
      : '<p>نظر حذف شد.</p>',
  );
}

export async function handleReviews(request: Request, env: Env, pathname: string) {
  if (pathname === '/api/reviews') {
    if (request.method === 'GET') return listPublished(request, env);
    if (request.method === 'POST') return submit(request, env);
  }
  if (pathname === '/api/reviews/moderate' && (request.method === 'GET' || request.method === 'POST')) {
    return moderate(request, env);
  }
  return json({ ok: false }, 405);
}

// ---- HTML for the moderation page and the email (Persian: they are read by the teacher) ----

const font = "font-family:IRANSansX,IRANSans,Vazirmatn,Tahoma,'Segoe UI',Arial,sans-serif;";
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function reviewCard(r: Review) {
  const e = escapeHtml;
  return `<div style="background:#FAF5E9;border-radius:16px;padding:16px 18px;margin:16px 0;text-align:right;">
    <div style="color:#F5A524;font-size:22px;letter-spacing:2px;">${stars(r.rating)}</div>
    <p dir="auto" style="${font}margin:10px 0;color:#1F2A37;font-size:16px;line-height:1.9;white-space:pre-wrap;word-break:break-word;">${e(r.text)}</p>
    <p dir="auto" style="${font}margin:0;color:#6B7280;font-size:14px;">— ${e(r.name)}${r.child ? ` · ${e(r.child)}` : ''}</p>
  </div>`;
}

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} | میس لیلا</title>
<style>body{${font}margin:0;background:#FAF5E9;color:#1F2A37}main{max-width:520px;margin:40px auto;background:#fff;border-radius:20px;padding:24px 26px;box-shadow:0 4px 18px rgba(31,42,55,.08)}
h1{font-size:22px;margin:0 0 8px}p{line-height:1.9}button{${font}color:#fff;border:0;border-radius:999px;padding:12px 26px;font-size:16px;font-weight:bold;cursor:pointer}a{color:#009B4D;font-weight:bold}</style>
</head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
    },
  );
}

function reviewEmail(r: Review, publishUrl: string, deleteUrl: string) {
  const e = escapeHtml;
  const button = (href: string, label: string, bg: string) =>
    `<a href="${e(href)}" style="${font}display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 26px;border-radius:999px;margin:4px;">${label}</a>`;
  const subject = `نظر جدید (${stars(r.rating)}) از ${r.name}`;
  return {
    subject,
    text: [
      'نظر جدید برای سایت englishkids.ir',
      '',
      `امتیاز: ${r.rating} از ۵`,
      `نام: ${r.name}${r.child ? ` (${r.child})` : ''}`,
      '',
      r.text,
      '',
      `انتشار در سایت: ${publishUrl}`,
      `حذف: ${deleteUrl}`,
    ].join('\n'),
    html: `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${e(subject)}</title></head>
<body style="margin:0;padding:0;background:#FAF5E9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5E9;padding:24px 12px;" dir="rtl"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;" dir="rtl">
      <tr><td style="background:#009B4D;padding:24px 28px;text-align:right;">
        <p style="${font}margin:0;color:#FFCC00;font-size:13px;font-weight:bold;">میس لیلا · آموزش زبان انگلیسی کودکان</p>
        <h1 style="${font}margin:6px 0 0;color:#ffffff;font-size:22px;">یک نظر جدید منتظر تأیید شماست</h1>
      </td></tr>
      <tr><td style="padding:8px 28px;">${reviewCard(r)}</td></tr>
      <tr><td style="padding:0 28px 8px;text-align:right;">
        <p style="${font}margin:0 0 10px;color:#6B7280;font-size:14px;line-height:1.9;">تا وقتی «انتشار» را نزنید، این نظر در سایت دیده نمی‌شود. بعد از انتشار هم با دکمه‌ی «حذف» می‌توانید آن را بردارید.</p>
        ${button(publishUrl, '✅ انتشار در سایت', '#009B4D')}
        ${button(deleteUrl, '✕ حذف', '#E5484D')}
      </td></tr>
      <tr><td style="padding:20px 28px 24px;text-align:right;">
        <p style="${font}margin:0;color:#6B7280;font-size:12px;">ارسال‌شده از فرم نظرات englishkids.ir · زبان سایت: ${r.lang === 'en' ? 'انگلیسی' : 'فارسی'}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}
