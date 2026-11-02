# Miss Leila — English for Kids

Personal website for **Leila Abbasi**, children's English teacher (ages 5+).
Bilingual (فارسی RTL / English), animated, with a booking form and WhatsApp / Instagram contact.

Stack: Vite + React + TypeScript + Tailwind CSS v4 + Motion, hosted on **Cloudflare Workers**
(static assets from `dist/`, plus the booking endpoint `POST /api/book` in `worker/index.ts`).

## Develop

```bash
npm install
npm run dev              # site only, http://localhost:5173 (booking falls back to WhatsApp)
npm run preview:worker   # built site + /api/book in Cloudflare's local runtime, http://localhost:8787
```

## Deploy to Cloudflare Workers

**Option A: Git (recommended).** Cloudflare dashboard → Workers & Pages → Create → Import a repository → this GitHub repo.
Build command `npm run build`, deploy command `npx wrangler deploy`. Every push to `main` deploys.

**Option B: CLI.**

```bash
npx wrangler login
npm run deploy
```

Then add a custom domain under the Worker → Settings → Domains & Routes.

## Receiving booking requests

The form always offers "send via WhatsApp". To also receive submissions from the form directly, configure any of these:

- **Email (Brevo)**: in Brevo → SMTP & API → API keys, create an API key, then add it to the Worker as the secret
  `BREVO_API_KEY`. Requests are emailed from `EMAIL_FROM` to `EMAIL_TO` (set in `wrangler.toml`). The sender domain must be
  authenticated in Brevo. If Brevo rejects calls with "unrecognised IP", turn off IP blocking under Brevo → Security →
  Authorised IPs (Workers don't have fixed IPs).

- **Telegram notification**: create a bot with @BotFather, get your chat id, then in the Worker →
  Settings → Variables and secrets add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (as secrets).
- **Storage (KV)**: `npx wrangler kv namespace create BOOKINGS`, then uncomment the `[[kv_namespaces]]` block in
  `wrangler.toml` with the printed id and push. Requests are visible in the dashboard under KV.

If none is configured, the form tells visitors to send the request via WhatsApp instead.

### Bot protection (Cloudflare Turnstile)

Cloudflare dashboard → Turnstile → Add widget, hostnames `englishkids.ir` and `www.englishkids.ir`, mode "Managed".
Put the **site key** in `turnstileSiteKey` in `src/content.ts`, and add the **secret key** to the Worker as the secret
`TURNSTILE_SECRET_KEY`. Set both or neither: with only the secret set, every form submission is rejected.

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
| `src/assets/brand/logo-themed.svg` | Logo shown on the site; its colours are CSS variables (`--logo-*` in `src/index.css`), so it follows the palette and light/dark mode |

Logo mark: "Nib Quotes", a quotation mark drawn as two pen nibs above a smile.
Colors: green `#009B4D`, yellow `#FFCC00`, ivory `#FAF5E9`, ink `#1F2A37` (from the "Dark Green, Ivory and Yellow" scheme). Fonts: Fredoka (Latin), Vazirmatn (Persian).

## Optional features

`src/features.ts` switches each extra feature on or off: level test, parents' corner and worksheets, and the learning
playground activities (speaking practice, word of the day, sentence builder, read-along stories, memory, word search,
save the balloons, festival words, sticker book & certificate). Switched-off features are not shown and their code is
never downloaded. Children's progress (stickers, best scores, streaks) is kept only in their browser's localStorage.

## Trying other colour palettes

`npm run dev` shows a 🎨 button (bottom corner) that applies one of ~60 trial palettes (`src/palettes.ts`) to the whole
site, in light and dark mode. It is hidden on the published site; add `?palettes` to the URL to show it there.
To adopt a palette permanently, copy its colours into the tokens in `src/index.css` and `scripts/make-brand.mjs`.
