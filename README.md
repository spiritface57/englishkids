# Miss Leila — English for Kids

Personal website for **Leila Abbasi**, children's English teacher (ages 5+).
Bilingual (فارسی RTL / English), animated, with a booking form and WhatsApp / Instagram contact.

Stack: Vite + React + TypeScript + Tailwind CSS v4 + Motion, hosted on **Cloudflare Pages**
(the booking endpoint is a Pages Function in `functions/api/book.ts`).

## Develop

```bash
npm install
npm run dev          # site only, http://localhost:5173 (booking falls back to WhatsApp)
npm run pages:dev    # site + /api/book via Cloudflare's local runtime
```

## Deploy to Cloudflare Pages

**Option A: Git (recommended).** Cloudflare dashboard → Workers & Pages → Create → Pages → connect this GitHub repo.
Build command `npm run build`, output directory `dist`. Every push to `main` deploys.

**Option B: CLI.**

```bash
npx wrangler login
npm run deploy
```

Then add a custom domain under the Pages project → Custom domains.

## Receiving booking requests

The form always offers "send via WhatsApp". To also receive submissions from the form directly, configure one or both:

- **Telegram notification**: create a bot with @BotFather, get your chat id, then in the Pages project →
  Settings → Variables and secrets add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (as secrets).
- **Storage (KV)**: `npx wrangler kv namespace create BOOKINGS`, then bind it as `BOOKINGS` in the Pages project
  settings (or uncomment the block in `wrangler.toml`). Requests are visible in the dashboard under KV.

If neither is configured, the form tells visitors to send the request via WhatsApp instead.

## Editing content

- All texts (Persian and English): `src/content.ts`
- Phone / WhatsApp / Instagram: `contact` at the top of `src/content.ts`
- Photos: `src/assets/` (cropped from the Instagram poster by `scripts/crop-poster.cjs`)
- Word game: ~2,000 words in `src/data/words/*.json` (en, fa, emoji, example sentence, category)

## Brand kit

`npm run brand` regenerates everything from `scripts/make-brand.mjs`:

| File | Use |
| --- | --- |
| `brand/logo.svg`, `brand/logo.png` | Main logo (light backgrounds) |
| `brand/logo-white.svg`, `brand/logo-white.png` | Logo for dark backgrounds |
| `brand/icon.svg`, `brand/icon-1024.png` | App icon / stickers / print |
| `brand/profile-1080.png` | Instagram & WhatsApp profile picture |
| `public/favicon.*`, `public/icon-*.png`, `public/apple-touch-icon.png` | Website icons |
| `public/og-image.png` | Link preview image when the site is shared |

Colors: green `#009B4D`, yellow `#FFCC00`, ivory `#FAF5E9`, ink `#1F2A37` (from the "Dark Green, Ivory and Yellow" scheme). Fonts: Fredoka (Latin), Vazirmatn (Persian).
