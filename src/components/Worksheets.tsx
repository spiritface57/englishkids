import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Link, Loader2, PenLine, Printer, Shuffle, TextCursorInput } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Word } from '../data/words';
import { awardSticker } from '../progress';
import iconSvg from '../assets/brand/icon.svg?raw';
import { shuffle } from './wordGame';

// Printable worksheets: the parent picks a topic and a type; the sheet is a standalone A4 HTML document that is
// shown scaled as a preview and printed through a hidden iframe (the browser's print dialog can also save a PDF).

type Kind = 'match' | 'trace' | 'write' | 'blank';

const COUNT = 6;
// A4 at 96 dpi.
const PAGE_W = 794;
const PAGE_H = 1123;

const topics: Record<string, { emoji: string; fa: string; en: string }> = {
  animals: { emoji: '🐾', fa: 'حیوانات', en: 'Animals' },
  nature: { emoji: '🌿', fa: 'طبیعت', en: 'Nature' },
  food: { emoji: '🍎', fa: 'خوراکی‌ها', en: 'Food' },
  kitchen: { emoji: '🍳', fa: 'آشپزخانه', en: 'Kitchen' },
  home: { emoji: '🏠', fa: 'خانه', en: 'Home' },
  clothes: { emoji: '👕', fa: 'لباس', en: 'Clothes' },
  school: { emoji: '✏️', fa: 'مدرسه', en: 'School' },
  people: { emoji: '👪', fa: 'آدم‌ها و شغل‌ها', en: 'People & jobs' },
  body: { emoji: '🖐️', fa: 'بدن', en: 'Body' },
  feelings: { emoji: '😊', fa: 'احساسات', en: 'Feelings' },
  actions: { emoji: '🏃', fa: 'فعل‌ها', en: 'Actions' },
  describe: { emoji: '🎨', fa: 'صفت‌ها و رنگ‌ها', en: 'Describing' },
  time: { emoji: '⏰', fa: 'زمان و عدد', en: 'Time & numbers' },
  places: { emoji: '🏙️', fa: 'مکان‌ها و سفر', en: 'Places & travel' },
  play: { emoji: '⚽', fa: 'بازی و سرگرمی', en: 'Play & hobbies' },
  science: { emoji: '🚀', fa: 'علم و دنیا', en: 'Science & world' },
  everyday: { emoji: '💬', fa: 'کلمات روزمره', en: 'Everyday words' },
};

const kinds: { key: Kind; Icon: typeof Link; fa: string; en: string; sheetFa: string; sheetEn: string }[] = [
  {
    key: 'match',
    Icon: Link,
    fa: 'وصل کن',
    en: 'Match',
    sheetEn: 'Match the picture to the word.',
    sheetFa: 'هر تصویر را با یک خط به کلمه‌اش وصل کن.',
  },
  {
    key: 'trace',
    Icon: PenLine,
    fa: 'رونویسی',
    en: 'Trace',
    sheetEn: 'Trace the word. Then write it again.',
    sheetFa: 'روی خط‌چین‌ها بنویس، بعد کلمه را یک بار دیگر خودت بنویس.',
  },
  {
    key: 'write',
    Icon: LayoutGrid,
    fa: 'ببین و بنویس',
    en: 'Look and write',
    sheetEn: 'Look at the picture and write the word.',
    sheetFa: 'به تصویر نگاه کن و کلمه را در خانه‌ها بنویس. حرف اول را داریم!',
  },
  {
    key: 'blank',
    Icon: TextCursorInput,
    fa: 'جای خالی',
    en: 'Fill the blank',
    sheetEn: 'Choose a word from the box and fill the blank.',
    sheetFa: 'کلمه‌ی مناسب را از جعبه پیدا کن و در جای خالی بنویس.',
  },
];

const text = {
  fa: {
    title: 'کاربرگ‌های چاپی',
    lead: 'یک موضوع و یک نوع تمرین انتخاب کنید، کاربرگ را چاپ کنید و کنار فرزندتان بنشینید. ده دقیقه تمرین با مداد و کاغذ، کلمه‌ها را خیلی بهتر در ذهن نگه می‌دارد.',
    topic: '۱. موضوع',
    type: '۲. نوع تمرین',
    newWords: 'کلمه‌های دیگر',
    print: 'چاپ / ذخیره به‌صورت PDF',
    pdfHint: 'برای داشتن فایل PDF، در پنجره‌ی چاپ گزینه‌ی «Save as PDF» را انتخاب کنید.',
    preview: 'پیش‌نمایش کاربرگ',
  },
  en: {
    title: 'Printable worksheets',
    lead: 'Pick a topic and an exercise, print the sheet and sit with your child. Ten minutes with a pencil and paper helps new words stick.',
    topic: '1. Topic',
    type: '2. Exercise',
    newWords: 'Other words',
    print: 'Print / Save as PDF',
    pdfHint: 'To keep a PDF file, choose "Save as PDF" in the print window.',
    preview: 'Worksheet preview',
  },
};

const simple = (w: Word) => /^[a-z]{3,9}$/i.test(w.en);

// The example sentence split around the word, or null when the word is not in it.
const gapOf = (w: Word): [string, string] | null => {
  const m = new RegExp(`\\b${w.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').exec(w.s);
  return m ? [w.s.slice(0, m.index), w.s.slice(m.index + m[0].length)] : null;
};

const fits: Record<Kind, (w: Word) => boolean> = {
  match: (w) => w.en.length <= 14,
  trace: simple,
  write: simple,
  blank: (w) => w.s.length <= 60 && gapOf(w) !== null,
};

// Six words with their own picture, no two with the same emoji.
function pickWords(all: Word[], topic: string, kind: Kind) {
  const out: Word[] = [];
  const seen = new Set<string>();
  for (const w of shuffle(all.filter((w) => w.c === topic && w.e && fits[kind](w)))) {
    if (seen.has(w.e)) continue;
    seen.add(w.e);
    out.push(w);
    if (out.length === COUNT) break;
  }
  return out;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function sheetBody(kind: Kind, list: Word[]) {
  const pic = (w: Word) => `<div class="pic emo">${w.e}</div>`;
  if (kind === 'match') {
    const right = shuffle(list);
    return `<div class="rows">${list
      .map(
        (w, i) =>
          `<div class="row match">${pic(w)}<span class="dot"></span><span class="space"></span><span class="dot"></span><div class="word">${esc(right[i].en)}</div></div>`,
      )
      .join('')}</div>`;
  }
  if (kind === 'trace') {
    return `<div class="rows">${list
      .map(
        (w) =>
          `<div class="row">${pic(w)}<div class="grow"><div class="trace">${esc(w.en)}</div><div class="guide"><span></span></div></div></div>`,
      )
      .join('')}</div>`;
  }
  if (kind === 'write') {
    return `<div class="rows">${list
      .map(
        (w) =>
          `<div class="row"><div class="picbox">${pic(w)}<div class="fa" dir="rtl">${esc(w.fa)}</div></div><div class="boxes">${[
            ...w.en.toLowerCase(),
          ]
            .map((ch, i) => `<span class="box">${i === 0 ? esc(ch) : ''}</span>`)
            .join('')}</div></div>`,
      )
      .join('')}</div>`;
  }
  const bank = shuffle(list)
    .map((w) => `<span>${esc(w.en.toLowerCase())}</span>`)
    .join('');
  return `<div class="bank">${bank}</div><ol class="sentences">${list
    .map((w) => {
      const [before, after] = gapOf(w)!;
      return `<li><span class="emo small">${w.e}</span><span>${esc(before)}<span class="blank"></span>${esc(after)}</span></li>`;
    })
    .join('')}</ol>`;
}

function buildSheet(kind: Kind, topic: string, list: Word[]) {
  const k = kinds.find((x) => x.key === kind)!;
  const t = topics[topic];
  const icon = iconSvg.replace('<svg ', '<svg class="icon" ');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>englishkids.ir worksheet - ${esc(t.en)} - ${esc(k.en)}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #111; }
body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 12mm 14mm 10mm; display: flex; flex-direction: column; overflow: hidden; }
.emo { font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif; }
.fa { font-family: Tahoma, 'Segoe UI', sans-serif; }
header { display: flex; align-items: center; justify-content: space-between; gap: 6mm; padding-bottom: 4mm; border-bottom: 1.5px solid #222; }
.brand { display: flex; align-items: center; gap: 2.5mm; font-weight: bold; font-size: 15px; }
.icon { width: 9mm; height: 9mm; }
.nd { font-size: 15px; white-space: nowrap; }
.nd b { display: inline-block; width: 45mm; border-bottom: 1px solid #222; margin: 0 4mm 0 1.5mm; }
.nd b:last-child { width: 30mm; margin-right: 0; }
h1 { margin: 5mm 0 0; font-size: 25px; }
.topic { display: inline-block; margin-left: 2mm; padding: 0.5mm 3mm; border: 1.2px solid #222; border-radius: 4mm; font-size: 14px; font-weight: normal; vertical-align: middle; }
.inst { margin: 2mm 0 0; font-size: 14px; color: #333; }
.inst .fa { display: block; margin-top: 1mm; text-align: right; }
main { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; padding: 4mm 0; }
.rows { flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; }
.row { display: flex; align-items: center; gap: 6mm; }
.pic { width: 25mm; height: 25mm; flex: none; display: flex; align-items: center; justify-content: center; border: 1.5px solid #222; border-radius: 4mm; font-size: 15mm; line-height: 1; }
.dot { width: 3.5mm; height: 3.5mm; flex: none; border-radius: 50%; border: 1.5px solid #222; }
.space { flex: 1; }
.match .word { width: 52mm; font-size: 26px; font-weight: bold; padding: 3mm 4mm; border: 1.5px solid #222; border-radius: 4mm; text-align: center; }
.grow { flex: 1; }
.trace { font-family: 'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', cursive; font-size: 58px; line-height: 1.15; letter-spacing: 3px; color: #c8c8c8; }
@supports (-webkit-text-stroke: 1px black) { .trace { color: transparent; -webkit-text-stroke: 1.3px #8a8a8a; } }
.guide { position: relative; height: 15mm; margin-top: 1mm; border-top: 1px solid #999; border-bottom: 1.5px solid #222; }
.guide span { position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #bbb; }
.picbox { width: 30mm; flex: none; display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
.picbox .fa { font-size: 13px; color: #555; }
.boxes { display: flex; flex-wrap: wrap; gap: 2mm; }
.box { width: 13mm; height: 15mm; border: 1.5px solid #222; border-radius: 2mm; display: flex; align-items: center; justify-content: center; font-size: 30px; font-family: 'Comic Sans MS', 'Comic Sans', Arial, sans-serif; }
.bank { display: flex; flex-wrap: wrap; justify-content: center; gap: 3mm 8mm; padding: 4mm 5mm; border: 1.5px dashed #222; border-radius: 4mm; font-size: 22px; font-weight: bold; }
.sentences { flex: 1; margin: 6mm 0 0; padding-left: 8mm; display: flex; flex-direction: column; justify-content: space-evenly; font-size: 21px; }
.sentences li { padding-left: 2mm; }
.sentences li > span { vertical-align: middle; }
.small { font-size: 9mm; margin-right: 3mm; }
.blank { display: inline-block; width: 36mm; border-bottom: 1.5px solid #222; margin: 0 1.5mm; }
footer { display: flex; align-items: center; justify-content: center; gap: 2mm; padding-top: 3mm; border-top: 1px solid #bbb; font-size: 12px; color: #444; }
footer .icon { width: 5mm; height: 5mm; }
</style></head>
<body><div class="page">
<header><div class="brand">${icon}<span>englishkids.ir</span></div><div class="nd">Name:<b></b>Date:<b></b></div></header>
<h1>${esc(k.sheetEn.replace(/\.$/, ''))} <span class="topic"><span class="emo">${t.emoji}</span> ${esc(t.en)}</span></h1>
<p class="inst"><span class="fa" dir="rtl">${esc(k.sheetFa)}</span></p>
<main>${sheetBody(kind, list)}</main>
<footer>${icon}<span>englishkids.ir · Miss Leila · English for kids</span></footer>
</div></body></html>`;
}

let printFrame: HTMLIFrameElement | null = null;

function printSheet(html: string) {
  printFrame?.remove();
  const frame = document.createElement('iframe');
  printFrame = frame;
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return;
    win.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 500));
    // A short pause lets the emoji and fonts finish drawing before the print dialog takes its snapshot.
    setTimeout(() => {
      win.focus();
      win.print();
    }, 250);
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
}

function Preview({ html, label }: { html: string; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / PAGE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={box}
      dir="ltr"
      className="relative w-full overflow-hidden rounded-2xl border-4 border-surface bg-white shadow-soft"
      style={{ aspectRatio: '210 / 297' }}
    >
      <iframe
        srcDoc={html}
        title={label}
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
        style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})` }}
      />
    </div>
  );
}

export default function Worksheets() {
  const { lang } = useI18n();
  const s = text[lang];
  const [all, setAll] = useState<Word[]>([]);
  const [topic, setTopic] = useState('animals');
  const [kind, setKind] = useState<Kind>('match');
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    let alive = true;
    import('../data/words').then((m) => alive && setAll(m.words));
    return () => {
      alive = false;
    };
  }, []);

  // Topics with enough pictured words for every worksheet type.
  const available = useMemo(
    () => Object.keys(topics).filter((c) => all.filter((w) => w.c === c && w.e && simple(w)).length >= 8),
    [all],
  );

  const list = useMemo(() => pickWords(all, topic, kind), [all, topic, kind, seed]);
  const html = useMemo(() => (list.length ? buildSheet(kind, topic, list) : ''), [kind, topic, list]);

  const print = () => {
    printSheet(html);
    awardSticker('worksheet');
  };

  return (
    <div className="rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-100 text-sun-700">
          <Printer className="size-7" />
        </div>
        <div>
          <h3 className="text-2xl font-black">{s.title}</h3>
          <p className="mt-1 leading-7 text-ink/70">{s.lead}</p>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="grid min-h-40 place-items-center">
          <Loader2 className="size-8 animate-spin text-leaf-500" />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink/60">{s.topic}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {available.map((c) => (
                <button
                  key={c}
                  onClick={() => setTopic(c)}
                  aria-pressed={topic === c}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition ${
                    topic === c ? 'border-leaf-500 bg-leaf-100 text-leaf-700' : 'border-ink/10 hover:border-leaf-200'
                  }`}
                >
                  <span>{topics[c].emoji}</span>
                  {topics[c][lang]}
                </button>
              ))}
            </div>

            <p className="mt-7 text-sm font-bold text-ink/60">{s.type}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {kinds.map(({ key, Icon, ...k }) => (
                <motion.button
                  key={key}
                  onClick={() => setKind(key)}
                  aria-pressed={kind === key}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 text-center transition ${
                    kind === key ? 'border-grape-500 bg-grape-50' : 'border-ink/10 hover:border-grape-100'
                  }`}
                >
                  <Icon className={`size-6 ${kind === key ? 'text-grape-600' : 'text-ink/50'}`} />
                  <span className="font-black">{k[lang]}</span>
                  <span className="text-xs leading-5 text-ink/60">{lang === 'fa' ? k.sheetFa : k.sheetEn}</span>
                </motion.button>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={print}
                disabled={!html}
                className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-6 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Printer className="size-5" />
                {s.print}
              </button>
              <button
                onClick={() => setSeed((n) => n + 1)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 px-5 py-3 font-bold transition hover:border-leaf-500"
              >
                <Shuffle className="size-4" />
                {s.newWords}
              </button>
            </div>
            <p className="mt-3 text-sm text-ink/60">{s.pdfHint}</p>
          </div>

          <div className="mx-auto w-full max-w-xs lg:max-w-none">
            <p className="mb-3 text-sm font-bold text-ink/60">{s.preview}</p>
            {html && <Preview html={html} label={s.preview} />}
          </div>
        </div>
      )}
    </div>
  );
}
