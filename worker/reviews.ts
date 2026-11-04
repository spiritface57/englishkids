// Parents' reviews: submitted from the site, held until the teacher approves them, then shown on the home page.
//
//   POST /api/reviews           a parent submits a review (Turnstile-checked) → stored as pending, teacher gets an email
//   GET  /api/reviews           the published reviews (cached at Cloudflare's edge for a few minutes)
//   GET  /api/reviews/moderate  the page the email's buttons open: shows the review with a confirm button
//                               (for publishing, the translation sits in editable fields so the teacher can fix it)
//   POST /api/reviews/moderate  publishes (with the translation as submitted) or deletes it
//
// The email links carry an HMAC signature (secret REVIEW_SECRET), so only someone with the email can moderate.
// Opening a link only shows a confirm page; the change needs a button press, so mail scanners that open links
// can't publish or delete anything by themselves.
//
// KV (binding REVIEWS):  review:<id>         every review, pending or published
//                        reviews:published   the published ones, newest first, in one key so the site needs one read
//                        review-ip:<hash>    one review per visitor per day (expires after 24 hours)
//
// Each review is also translated (Persian ↔ English, worker/translate.ts) so both sides of the site can show it;
// the email shows the translation too, so the teacher can check it before publishing.

import { sendMail } from './brevo';
import { escapeHtml } from './email';
import { json, str, verifyTurnstile, type Env } from './shared';
import { detectLang, translateReview, type Fields, type Lang } from './translate';

export type Review = {
  id: string;
  name: string;
  child: string;
  rating: number;
  text: string;
  lang: Lang; // the language the review is written in
  translation?: Fields & { lang: Lang };
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

// Publish links stop working after this long; delete links don't expire, since the email is the teacher's only way
// to take a review down later.
const PUBLISH_LINK_DAYS = 30;
// Publish links sent before expiry existed carry no `exp`; they're accepted only for reviews submitted before then.
const NO_EXPIRY_BEFORE = '2026-11-05T00:00:00Z';

async function sign(secret: string, id: string, action: Action, exp = '') {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return bytesToHex(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(exp ? `${id}:${action}:${exp}` : `${id}:${action}`)),
  );
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

// Gives up after `seconds` (the translation then stays missing and is tried again on publishing).
async function addTranslation(env: Env, review: Review, seconds: number): Promise<Review> {
  if (review.translation) return review;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), seconds * 1000));
  const t = await Promise.race([
    translateReview(env.AI, { name: review.name, child: review.child, text: review.text }, review.lang),
    timeout,
  ]);
  return t ? { ...review, translation: { ...t, lang: review.lang === 'fa' ? 'en' : 'fa' } } : review;
}

// Runs after the parent already got their answer: translate, save, then email the teacher.
async function notify(request: Request, env: Env, pending: Review) {
  const kv = env.REVIEWS!;
  // The email must not wait too long: background work ends about 30 seconds after the response.
  const review = await addTranslation(env, pending, 20);
  if (review !== pending) await kv.put(`review:${review.id}`, JSON.stringify(review));
  if (!env.REVIEW_SECRET) return;
  const url = new URL(request.url);
  const origin = url.origin;
  const secret = env.REVIEW_SECRET;
  const link = async (action: Action) => {
    const exp = action === 'publish' ? String(Math.floor(Date.now() / 1000) + PUBLISH_LINK_DAYS * 86400) : '';
    const sig = await sign(secret, review.id, action, exp);
    return `${origin}/api/reviews/moderate?id=${review.id}&action=${action}${exp ? `&exp=${exp}` : ''}&sig=${sig}`;
  };
  if (env.BREVO_API_KEY) {
    await sendMail(env, env.BREVO_API_KEY, reviewEmail(review, await link('publish'), await link('delete')));
  } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Local testing without email: print the links the email would contain.
    console.log(`\n[review ${review.id}]\n  publish: ${await link('publish')}\n  delete:  ${await link('delete')}\n`);
  }
}

async function submit(request: Request, env: Env, ctx: ExecutionContext) {
  if (!env.REVIEWS || !env.REVIEW_SECRET || !env.TURNSTILE_SECRET_KEY) {
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (str(data.website, 200)) return json({ ok: true });

  if (!(await verifyTurnstile(str(data.turnstileToken, 2048), request, env.TURNSTILE_SECRET_KEY))) {
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
    lang: detectLang(text),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await env.REVIEWS.put(`review:${review.id}`, JSON.stringify(review));
  if (ipKey) await env.REVIEWS.put(ipKey, '1', { expirationTtl: 86400 });

  ctx.waitUntil(notify(request, env, review));
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
  const exp = params.get('exp') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id) || (action !== 'publish' && action !== 'delete')) {
    return page('لینک نامعتبر', '<p>این لینک کامل نیست.</p>', 400);
  }
  if (exp && !/^\d{1,12}$/.test(exp)) return page('لینک نامعتبر', '<p>این لینک کامل نیست.</p>', 400);
  if (!sameString(sig, await sign(env.REVIEW_SECRET, id, action, exp))) {
    return page('لینک نامعتبر', '<p>امضای این لینک درست نیست.</p>', 403);
  }
  if (exp && Number(exp) < Date.now() / 1000) {
    return page('لینک منقضی شده', '<p>این لینک انتشار دیگر معتبر نیست.</p>', 410);
  }

  const review = await env.REVIEWS.get<Review>(`review:${id}`, 'json');
  if (!review) return page('پیدا نشد', '<p>این نظر قبلاً حذف شده است.</p>', 404);
  if (action === 'publish' && !exp && review.createdAt >= NO_EXPIRY_BEFORE) {
    return page('لینک نامعتبر', '<p>امضای این لینک درست نیست.</p>', 403);
  }

  if (request.method === 'GET') {
    if (action === 'delete') {
      return page(
        'حذف نظر',
        `${reviewCard(review)}
      <form method="post">${hidden(id, action, exp, sig)}<button style="background:#E5484D">بله، حذف شود</button></form>`,
      );
    }
    // Translate now if it failed on submit, so the teacher always sees (and can fix) what goes on the site.
    let current = review;
    if (!review.translation) {
      current = await addTranslation(env, review, 20);
      if (current !== review) await env.REVIEWS.put(`review:${id}`, JSON.stringify(current));
    }
    return page('انتشار نظر', `${reviewCard(current, false)}${publishForm(current, id, exp, sig)}`);
  }

  const published = await readPublished(env.REVIEWS);
  const others = published.filter((r) => r.id !== id);
  if (action === 'publish') {
    // The translation is exactly what the teacher saw and edited on the confirm page; empty text means none.
    const tText = clean(params.get('tText'), 1200).replace(/\n{3,}/g, '\n\n');
    const translation: Review['translation'] = tText
      ? {
          lang: review.lang === 'fa' ? 'en' : 'fa',
          name: clean(params.get('tName'), 80).replace(/\s+/g, ' ') || review.name,
          child: clean(params.get('tChild'), 60).replace(/\s+/g, ' '),
          text: tText,
        }
      : undefined;
    const updated: Review = { ...review, translation, status: 'published' };
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

export async function handleReviews(request: Request, env: Env, ctx: ExecutionContext, pathname: string) {
  if (pathname === '/api/reviews') {
    if (request.method === 'GET') return listPublished(request, env);
    if (request.method === 'POST') return submit(request, env, ctx);
  }
  if (pathname === '/api/reviews/moderate' && (request.method === 'GET' || request.method === 'POST')) {
    return moderate(request, env);
  }
  return json({ ok: false }, 405);
}

// ---- HTML for the moderation page and the email (Persian: they are read by the teacher) ----

const font = "font-family:IRANSansX,IRANSans,Vazirmatn,Tahoma,'Segoe UI',Arial,sans-serif;";
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

function reviewCard(r: Review, withTranslation = true) {
  const e = escapeHtml;
  const t = withTranslation ? r.translation : undefined;
  const translation = t
    ? `<div style="border-top:1px dashed #D9D2BF;margin-top:12px;padding-top:10px;">
    <p style="${font}margin:0;color:#6B7280;font-size:12px;">ترجمه‌ی خودکار به ${t.lang === 'en' ? 'انگلیسی' : 'فارسی'} (برای سمت ${t.lang === 'en' ? 'انگلیسی' : 'فارسی'} سایت):</p>
    <p dir="auto" style="${font}margin:8px 0;color:#1F2A37;font-size:15px;line-height:1.8;white-space:pre-wrap;word-break:break-word;">${e(t.text)}</p>
    <p dir="auto" style="${font}margin:0;color:#6B7280;font-size:13px;">— ${e(t.name)}${t.child ? ` · ${e(t.child)}` : ''}</p>
  </div>`
    : '';
  return `<div style="background:#FAF5E9;border-radius:16px;padding:16px 18px;margin:16px 0;text-align:right;">
    <div style="color:#F5A524;font-size:22px;letter-spacing:2px;">${stars(r.rating)}</div>
    <p dir="auto" style="${font}margin:10px 0;color:#1F2A37;font-size:16px;line-height:1.9;white-space:pre-wrap;word-break:break-word;">${e(r.text)}</p>
    <p dir="auto" style="${font}margin:0;color:#6B7280;font-size:14px;">— ${e(r.name)}${r.child ? ` · ${e(r.child)}` : ''}</p>${translation}
  </div>`;
}

const hidden = (id: string, action: Action, exp: string, sig: string) =>
  `<input type="hidden" name="id" value="${escapeHtml(id)}"><input type="hidden" name="action" value="${action}">` +
  (exp ? `<input type="hidden" name="exp" value="${escapeHtml(exp)}">` : '') +
  `<input type="hidden" name="sig" value="${escapeHtml(sig)}">`;

// The confirm page for publishing: the AI translation in editable fields, so the teacher can correct it first.
function publishForm(r: Review, id: string, exp: string, sig: string) {
  const e = escapeHtml;
  const t = r.translation;
  const to = r.lang === 'fa' ? 'en' : 'fa';
  const toName = to === 'en' ? 'انگلیسی' : 'فارسی';
  const dir = to === 'en' ? 'ltr' : 'rtl';
  const published = r.status === 'published';
  return `<form method="post">${hidden(id, 'publish', exp, sig)}
    <h2>ترجمه برای سمت ${toName} سایت</h2>
    <p class="hint">${t ? 'ترجمه‌ی خودکار است؛ اگر لازم است اصلاحش کنید.' : 'ترجمه‌ی خودکار انجام نشد؛ می‌توانید خودتان بنویسید.'} اگر متن ترجمه خالی بماند، نظر فقط به زبان اصلی نمایش داده می‌شود.</p>
    <label>نام<input name="tName" dir="${dir}" maxlength="80" value="${e(t?.name ?? '')}"></label>
    <label>نام و سن فرزند<input name="tChild" dir="${dir}" maxlength="60" value="${e(t?.child ?? '')}"></label>
    <label>متن نظر<textarea name="tText" dir="${dir}" maxlength="1200" rows="7">${e(t?.text ?? '')}</textarea></label>
    ${published ? '<p class="hint">این نظر همین حالا در سایت منتشر شده است؛ با دکمه‌ی زیر ترجمه‌اش به‌روز می‌شود.</p>' : ''}
    <button style="background:#009B4D">${published ? 'ذخیره‌ی ترجمه' : 'بله، در سایت منتشر شود'}</button>
  </form>`;
}

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} | میس لیلا</title>
<style>body{${font}margin:0;background:#FAF5E9;color:#1F2A37}main{max-width:520px;margin:40px auto;background:#fff;border-radius:20px;padding:24px 26px;box-shadow:0 4px 18px rgba(31,42,55,.08)}
h1{font-size:22px;margin:0 0 8px}p{line-height:1.9}button{${font}color:#fff;border:0;border-radius:999px;padding:12px 26px;font-size:16px;font-weight:bold;cursor:pointer}a{color:#009B4D;font-weight:bold}
h2{font-size:17px;margin:20px 0 4px}.hint{color:#6B7280;font-size:13px;margin:0 0 12px}label{display:block;font-size:14px;font-weight:bold;margin:0 0 12px;color:#374151}
input,textarea{${font}box-sizing:border-box;display:block;width:100%;margin-top:6px;border:2px solid #E5E0D2;border-radius:12px;padding:10px 12px;font-size:15px;line-height:1.8;color:#1F2A37;background:#FFFDF8}textarea{resize:vertical}input:focus,textarea:focus{outline:none;border-color:#009B4D}</style>
</head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'no-store',
        // Worker responses don't get public/_headers. No scripts, no framing, and the signed URL is never sent on.
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
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
      ...(r.translation ? ['', `ترجمه: ${r.translation.text}`] : []),
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
        <p style="${font}margin:0 0 10px;color:#6B7280;font-size:14px;line-height:1.9;">تا وقتی «انتشار» را نزنید، این نظر در سایت دیده نمی‌شود. در صفحه‌ی انتشار می‌توانید ترجمه را پیش از انتشار ویرایش کنید، و بعد از انتشار هم با دکمه‌ی «حذف» آن را بردارید.</p>
        ${button(publishUrl, '✅ انتشار در سایت', '#009B4D')}
        ${button(deleteUrl, '✕ حذف', '#E5484D')}
      </td></tr>
      <tr><td style="padding:20px 28px 24px;text-align:right;">
        <p style="${font}margin:0;color:#6B7280;font-size:12px;">ارسال‌شده از فرم نظرات englishkids.ir · زبان نظر: ${r.lang === 'en' ? 'انگلیسی' : 'فارسی'}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  };
}
