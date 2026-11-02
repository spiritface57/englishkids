import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Lock, Printer } from 'lucide-react';
import { useI18n } from '../../i18n';
import { features, type Feature } from '../../features';
import { stickers, useStickers, type StickerId } from '../../progress';
import { updateProfile, useProfiles } from '../../profiles';
import iconSvg from '../../assets/brand/icon.svg?raw';

// Sticker book (collected across the site's games) and a certificate the child unlocks with enough stickers.
// The certificate is drawn on a canvas, so it can be downloaded as a picture or printed. Everything stays in this browser.

// Stickers of switched-off features are hidden, so every shown sticker can be earned.
const featureOf: Partial<Record<StickerId, Feature>> = {
  'level-test': 'levelTest',
  'speak-first': 'speak',
  'speak-star': 'speak',
  'sentence-5': 'sentenceBuilder',
  'story-read': 'stories',
  'memory-win': 'memory',
  'wordsearch-win': 'wordSearch',
  'hangman-win': 'hangman',
  'wotd-3': 'wordOfTheDay',
  'wotd-7': 'wordOfTheDay',
  seasonal: 'seasonal',
  worksheet: 'worksheets',
};

const hints: Record<StickerId, { fa: string; en: string }> = {
  'cards-round': { fa: 'همه‌ی ۸ کارت کلمه را برگردان', en: 'Flip all 8 word cards' },
  'quiz-first': { fa: 'یک آزمون را تمام کن', en: 'Finish a quiz' },
  'quiz-perfect': { fa: 'در آزمون ۱۰ از ۱۰ بگیر', en: 'Score 10 out of 10 in a quiz' },
  'quiz-hard': { fa: 'در سطح سخت ۷ جواب درست بده', en: 'Get 7 right on the hard level' },
  'level-test': { fa: 'آزمون تعیین سطح را تمام کن', en: 'Finish the level test' },
  'speak-first': { fa: 'یک کلمه را درست بگو', en: 'Say a word perfectly' },
  'speak-star': { fa: '۱۰ کلمه را درست بگو', en: 'Say 10 words perfectly' },
  'sentence-5': { fa: '۵ جمله‌ی درست بساز', en: 'Build 5 correct sentences' },
  'story-read': { fa: 'یک قصه را تا آخر بخوان', en: 'Read a story to the end' },
  'memory-win': { fa: 'بازی حافظه را ببر', en: 'Win the memory game' },
  'wordsearch-win': { fa: 'همه‌ی کلمه‌های پنهان را پیدا کن', en: 'Find all the hidden words' },
  'hangman-win': { fa: 'بادکنک‌ها را نجات بده', en: 'Save the balloons' },
  'wotd-3': { fa: '۳ روز پشت سر هم به کلمه‌ی روز سر بزن', en: 'Visit the word of the day 3 days in a row' },
  'wotd-7': { fa: '۷ روز پشت سر هم به کلمه‌ی روز سر بزن', en: 'Visit the word of the day 7 days in a row' },
  seasonal: { fa: 'آزمون کلمه‌های جشن را تمام کن', en: 'Finish a festival quiz' },
  worksheet: { fa: 'یک کاربرگ چاپ کن', en: 'Print a worksheet' },
};

const text = {
  fa: {
    collected: (n: number, total: number) => `${n.toLocaleString('fa')} برچسب از ${total.toLocaleString('fa')}`,
    certTitle: 'گواهی‌نامه',
    certLocked: (n: number) => `با ${n.toLocaleString('fa')} برچسب دیگر گواهی‌نامه‌ات باز می‌شود!`,
    nameLabel: 'اسم کودک (به انگلیسی)',
    namePlaceholder: 'Sara',
    download: 'دانلود تصویر',
    print: 'چاپ',
    privacy: 'اسم فقط روی همین دستگاه ذخیره می‌شود و جایی فرستاده نمی‌شود.',
    tiers: ['برنزی', 'نقره‌ای', 'طلایی'],
  },
  en: {
    collected: (n: number, total: number) => `${n} of ${total} stickers`,
    certTitle: 'Certificate',
    certLocked: (n: number) => `${n} more stickers to unlock your certificate!`,
    nameLabel: "Child's name",
    namePlaceholder: 'Sara',
    download: 'Download picture',
    print: 'Print',
    privacy: 'The name is saved only on this device and is never sent anywhere.',
    tiers: ['Bronze', 'Silver', 'Gold'],
  },
};

const tierColors = ['#C97B3C', '#8E9BA8', '#E0A800'];

// Draws the certificate (A4 landscape proportions) and returns it as a PNG blob.
async function drawCertificate(name: string, tier: number, owned: string[]) {
  await document.fonts.ready;
  const w = 1754;
  const h = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Printed paper is light, so the certificate uses the light brand colours even in dark mode.
  const green = '#009B4D';
  const yellow = '#FFCC00';
  const ink = '#1F2A37';
  const medal = tierColors[tier];

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 28;
  ctx.strokeStyle = green;
  ctx.strokeRect(40, 40, w - 80, h - 80);
  ctx.lineWidth = 6;
  ctx.strokeStyle = yellow;
  ctx.strokeRect(84, 84, w - 168, h - 168);

  const icon = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(new Blob([iconSvg], { type: 'image/svg+xml' }));
  });
  ctx.drawImage(icon, w / 2 - 80, 130, 160, 160);

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = "700 92px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText('Certificate of English Fun', w / 2, 400);
  ctx.font = "600 44px 'Vazirmatn Variable', Vazirmatn, Tahoma, sans-serif";
  ctx.fillStyle = green;
  ctx.fillText('گواهی‌نامه‌ی شادیِ یادگیری انگلیسی', w / 2, 470);

  ctx.fillStyle = ink;
  ctx.font = "500 40px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText('This certificate is proudly given to', w / 2, 570);
  ctx.font = "700 120px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillStyle = green;
  ctx.fillText(name || '________________', w / 2, 710);
  ctx.strokeStyle = yellow;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 420, 740);
  ctx.lineTo(w / 2 + 420, 740);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = "500 40px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText(`for collecting ${owned.length} stickers while learning English!`, w / 2, 820);
  ctx.font = "48px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
  const row = stickers.filter((s) => owned.includes(s.id)).map((s) => s.emoji);
  ctx.fillText(row.slice(0, 16).join(' '), w / 2, 905);

  // Medal
  ctx.fillStyle = medal;
  ctx.beginPath();
  ctx.arc(300, h - 290, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = "700 34px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText(['Bronze', 'Silver', 'Gold'][tier], 300, h - 280);

  // Date and signature
  ctx.fillStyle = ink;
  ctx.font = "500 34px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    w / 2,
    h - 230,
  );
  ctx.font = "italic 600 56px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillStyle = green;
  ctx.fillText('Miss Leila', w - 330, h - 290);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 500, h - 265);
  ctx.lineTo(w - 160, h - 265);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = "500 28px Fredoka, 'Segoe UI', sans-serif";
  ctx.fillText('English for Kids · englishkids.ir', w - 330, h - 220);

  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
}

export default function StickerBook() {
  const { lang } = useI18n();
  const s = text[lang];
  const owned = useStickers();
  // The certificate name is the child's profile name (see ProfileBar).
  const { current } = useProfiles();
  const name = current.name;
  const [busy, setBusy] = useState(false);

  const shown = stickers.filter((st) => {
    const f = featureOf[st.id];
    return !f || features[f];
  });
  const have = shown.filter((st) => owned.includes(st.id));
  // Bronze at 5 stickers, silver at 10, gold when all shown stickers are collected.
  const thresholds = [5, Math.min(10, shown.length), shown.length];
  const tier = thresholds.filter((n) => have.length >= n).length - 1;
  const nextNeeded = thresholds[0] - have.length;

  const saveName = (v: string) => updateProfile(current.id, { name: v });

  const make = async (mode: 'download' | 'print') => {
    setBusy(true);
    try {
      const blob = await drawCertificate(
        name.trim(),
        tier,
        have.map((h) => h.id),
      );
      const url = URL.createObjectURL(blob);
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${name.trim() || 'englishkids'}.png`;
        a.click();
      } else {
        const frame = document.createElement('iframe');
        frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0';
        frame.srcdoc = `<!doctype html><html><head><style>@page{size:A4 landscape;margin:0}html,body{margin:0}img{width:100%;height:100vh;object-fit:contain}</style></head><body><img src="${url}"></body></html>`;
        frame.onload = () => {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          setTimeout(() => frame.remove(), 60_000);
        };
        document.body.appendChild(frame);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="font-bold text-ink/70">{s.collected(have.length, shown.length)}</p>
        <div className="mx-auto mt-2 h-3 max-w-md overflow-hidden rounded-full bg-surface shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
            initial={{ width: 0 }}
            animate={{ width: `${(have.length / shown.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {shown.map((st, i) => {
          const got = owned.includes(st.id);
          return (
            <motion.li
              key={st.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex flex-col items-center gap-1 rounded-2xl border-4 border-surface p-3 text-center shadow-soft ${
                got ? 'bg-sun-100' : 'bg-surface'
              }`}
            >
              <span className={`text-4xl ${got ? '' : 'opacity-25 grayscale'}`}>{st.emoji}</span>
              <span className="text-sm font-black">{st[lang]}</span>
              {!got && (
                <span className="flex items-start gap-1 text-xs text-ink/50">
                  <Lock className="mt-0.5 size-3 shrink-0" />
                  {hints[st.id][lang]}
                </span>
              )}
            </motion.li>
          );
        })}
      </ul>

      <div className="rounded-3xl border-4 border-surface bg-surface p-5 shadow-soft">
        <h4 className="text-lg font-black">
          🎓 {s.certTitle}
          {tier >= 0 && <span className="ms-2 text-sm font-bold text-grape-600">({s.tiers[tier]})</span>}
        </h4>
        {tier < 0 ? (
          <p className="mt-2 text-ink/70">{s.certLocked(nextNeeded)}</p>
        ) : (
          <>
            <label className="mt-3 block text-sm font-bold text-ink/70">
              {s.nameLabel}
              <input
                dir="ltr"
                value={name}
                onChange={(e) => saveName(e.target.value.slice(0, 30))}
                placeholder={s.namePlaceholder}
                className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-4 py-3 font-display text-lg outline-none focus:border-grape-500"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => make('download')}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-grape-500 px-5 py-2.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Download className="size-4" />
                {s.download}
              </button>
              <button
                onClick={() => make('print')}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-5 py-2.5 font-bold transition hover:border-grape-500 disabled:opacity-60"
              >
                <Printer className="size-4" />
                {s.print}
              </button>
            </div>
            <p className="mt-3 text-xs text-ink/50">{s.privacy}</p>
          </>
        )}
      </div>
    </div>
  );
}
