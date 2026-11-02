import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Share2, Volume2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { awardSticker } from '../../progress';
import { canSpeak, speak } from '../wordGame';
import { kidStorage } from '../../profiles';

// One word per local calendar day, the same for everyone (picked from a hash of the date), plus a visit streak
// kept in this browser. "Share" draws a square picture card to send to family and friends.

const KEY = 'wotd-streak';
const SIZE = 1080;

const text = {
  fa: {
    title: 'کلمه‌ی روز',
    listen: 'گوش کن',
    share: 'اشتراک‌گذاری',
    streak: (n: number) => (n > 1 ? `${n.toLocaleString('fa')} روز پشت سر هم` : 'روز اول! فردا هم سر بزن'),
    yesterday: 'کلمه‌ی دیروز:',
    shareText: (w: Word) => `کلمه‌ی امروز: ${w.en} (${w.fa}) — englishkids.ir`,
  },
  en: {
    title: 'Word of the day',
    listen: 'Listen',
    share: 'Share',
    streak: (n: number) => (n > 1 ? `${n} days in a row` : 'Day one! Come back tomorrow'),
    yesterday: 'Yesterday’s word:',
    shareText: (w: Word) => `Today’s word: ${w.en} (${w.fa}) — englishkids.ir`,
  },
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shiftDay = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// FNV-1a: small, stable string hash.
const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};
const pick = (list: Word[], d: Date) => list[hash(dayKey(d)) % list.length];

// Visiting yesterday continues the streak; today keeps it; a longer gap starts again at 1.
function updateStreak(today: Date) {
  let saved: { last?: string; n?: number } = {};
  try {
    saved = JSON.parse(kidStorage.getItem(KEY) ?? '{}');
  } catch {
    // Start fresh.
  }
  const t = dayKey(today);
  const prev = Number(saved.n) || 0;
  const n = saved.last === t ? Math.max(prev, 1) : saved.last === dayKey(shiftDay(today, -1)) ? prev + 1 : 1;
  kidStorage.setItem(KEY, JSON.stringify({ last: t, n }));
  if (n >= 3) awardSticker('wotd-3');
  if (n >= 7) awardSticker('wotd-7');
  return n;
}

// Splits text into at most `max` lines that fit `width`, adding "…" if it had to cut.
function wrap(ctx: CanvasRenderingContext2D, value: string, width: number, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= width || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

async function drawCard(word: Word, lang: 'fa' | 'en') {
  const css = getComputedStyle(document.documentElement);
  const color = (name: string, fallback: string) => css.getPropertyValue(`--color-${name}`).trim() || fallback;
  const leaf = color('leaf-500', '#009B4D');
  const sun = color('sun-500', '#FFCC00');
  const cream = color('cream', '#FAF5E9');
  const ink = color('ink', '#1F2A37');
  const night = color('night', '#1F2A37');
  const surface = color('surface', '#FAF5E9');

  const fa = "'Vazirmatn Variable', 'Vazirmatn', sans-serif";
  const en = "'Fredoka', sans-serif";
  const emojiFont = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  try {
    await Promise.all([document.fonts.load(`700 120px ${en}`), document.fonts.load(`700 60px ${fa}`)]);
  } catch {
    // Fall back to whatever is available.
  }
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Title band.
  ctx.fillStyle = leaf;
  ctx.fillRect(0, 0, SIZE, 170);
  ctx.fillStyle = color('band-ink', '#FAF5E9');
  ctx.direction = lang === 'fa' ? 'rtl' : 'ltr';
  ctx.font = lang === 'fa' ? `800 72px ${fa}` : `700 76px ${en}`;
  ctx.fillText(text[lang].title, SIZE / 2, 88);

  // Card.
  ctx.fillStyle = surface;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(70, 220, SIZE - 140, 700, 60);
  else ctx.rect(70, 220, SIZE - 140, 700);
  ctx.fill();

  ctx.direction = 'ltr';
  ctx.font = `230px ${emojiFont}`;
  ctx.fillText(word.e, SIZE / 2, 390);

  ctx.fillStyle = ink;
  ctx.font = `700 ${word.en.length > 10 ? 104 : 136}px ${en}`;
  ctx.fillText(word.en, SIZE / 2, 600);

  ctx.direction = 'rtl';
  ctx.fillStyle = leaf;
  ctx.font = `700 64px ${fa}`;
  ctx.fillText(word.fa, SIZE / 2, 705);

  ctx.direction = 'ltr';
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 44px ${en}`;
  wrap(ctx, word.s, SIZE - 260, 2).forEach((line, i, all) =>
    ctx.fillText(line, SIZE / 2, 820 + (i - (all.length - 1) / 2) * 56),
  );
  ctx.globalAlpha = 1;

  // Footer band.
  ctx.fillStyle = sun;
  ctx.fillRect(0, SIZE - 110, SIZE, 110);
  ctx.fillStyle = night;
  ctx.font = `700 52px ${en}`;
  ctx.fillText('englishkids.ir', SIZE / 2, SIZE - 55);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export default function WordOfTheDay() {
  const { lang } = useI18n();
  const s = text[lang];
  const [today] = useState(() => new Date());
  const [list, setList] = useState<Word[] | null>(null);
  const [streak, setStreak] = useState(0);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let alive = true;
    import('../../data/words').then(({ words }) => {
      if (!alive) return;
      // Plain code-unit order, so every browser and language setting sorts the same way.
      setList(words.filter((w) => w.e).sort((a, b) => (a.en < b.en ? -1 : a.en > b.en ? 1 : 0)));
    });
    setStreak(updateStreak(today));
    return () => {
      alive = false;
    };
  }, [today]);

  if (!list || list.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-[2rem] border-4 border-surface bg-surface shadow-soft">
        <Loader2 className="size-8 animate-spin text-grape-500" />
      </div>
    );
  }

  const word = pick(list, today);
  const yesterday = pick(list, shiftDay(today, -1));

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await drawCard(word, lang);
      if (!blob) return;
      const name = `word-of-the-day-${word.en.replace(/\W+/g, '-')}.png`;
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: s.title, text: s.shareText(word) });
        } catch {
          // Cancelled by the user.
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-black text-leaf-700">📅 {s.title}</span>
        {streak > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 14 }}
            className="rounded-full bg-sun-100 px-3 py-1 text-sm font-bold text-sun-700"
          >
            🔥 {s.streak(streak)}
          </motion.span>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <motion.button
          onClick={() => speak(word.en)}
          whileHover={{ rotate: -6, scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          aria-label={s.listen}
          className="grid size-32 shrink-0 place-items-center rounded-3xl bg-leaf-50 text-7xl shadow-sm sm:size-36 sm:text-8xl"
        >
          {word.e}
        </motion.button>

        <div className="min-w-0 flex-1 text-center sm:text-start">
          <p dir="ltr" className="font-display text-5xl font-bold break-words text-leaf-700 sm:text-6xl">
            {word.en}
          </p>
          <p dir="rtl" className="mt-1 text-xl font-bold text-ink/80">
            {word.fa}
          </p>
          <p dir="ltr" className="mt-2 font-display text-lg text-ink/60">
            {word.s}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            {canSpeak && (
              <button
                onClick={() => speak(word.en)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun-500 px-5 py-2 font-bold text-night shadow-soft transition hover:-translate-y-0.5"
              >
                <Volume2 className="size-5" />
                {s.listen}
              </button>
            )}
            <button
              onClick={share}
              disabled={sharing}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-grape-500 px-5 py-2 font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {sharing ? <Loader2 className="size-5 animate-spin" /> : <Share2 className="size-5" />}
              {s.share}
            </button>
          </div>
        </div>
      </div>

      {yesterday !== word && (
        <button
          onClick={() => speak(yesterday.en)}
          className="mt-5 flex w-full flex-wrap items-center justify-center gap-2 border-t border-ink/10 pt-4 text-sm text-ink/60 transition hover:text-ink sm:justify-start"
        >
          {s.yesterday}
          <span>{yesterday.e}</span>
          <span dir="ltr" className="font-display font-bold">
            {yesterday.en}
          </span>
          <span dir="rtl">({yesterday.fa})</span>
          <Volume2 className="size-4" />
        </button>
      )}
    </motion.div>
  );
}
