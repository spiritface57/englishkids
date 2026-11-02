import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Eye, Lightbulb, RotateCcw, Trophy, Undo2, Volume2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { awardSticker, bump } from '../../progress';
import { canSpeak, shuffle, speak } from '../wordGame';

// Put the shuffled words of an example sentence back in order. Rounds of 8 sentences, two levels:
// short (4–5 words) and long (6–9 words). After 2 wrong tries the answer can be shown.

const ROUND = 8;

type Level = 'short' | 'long';
type Tile = { id: number; text: string };
type Item = { word: Word; sentence: string; answer: string[]; end: string };

const text = {
  fa: {
    title: 'جمله بساز!',
    intro: 'کلمه‌ها به‌هم ریخته‌اند. به ترتیب رویشان بزن تا جمله‌ی درست ساخته شود.',
    tipTitle: 'نکته برای ما فارسی‌زبان‌ها',
    tip: 'در انگلیسی فعل درست بعد از فاعل می‌آید، نه آخر جمله. ما می‌گوییم «من سیب می‌خورم»، ولی در انگلیسی می‌گوییم:',
    tipLiteral: 'یعنی کلمه‌به‌کلمه: «من می‌خورم یک سیب».',
    chooseLevel: 'کدام را بازی کنیم؟',
    short: 'جمله‌های کوتاه',
    shortHint: '۴ یا ۵ کلمه',
    long: 'جمله‌های بلند',
    longHint: '۶ تا ۹ کلمه',
    start: 'شروع کنیم!',
    loading: 'در حال آماده کردن جمله‌ها…',
    sentence: (i: number, n: number) => `جمله‌ی ${i} از ${n}`,
    score: (n: number) => `${n} امتیاز`,
    hint: 'راهنما:',
    listen: 'گوش بده',
    tapTiles: 'روی کلمه‌ها بزن تا در جای خالی بنشینند. برای برگرداندن یک کلمه، دوباره رویش بزن.',
    check: 'بررسی کن',
    clear: 'پاک کردن',
    correct: 'آفرین! جمله کاملاً درست است 🎉',
    wrong: 'هنوز نه! کلمه‌های سبز سر جایشان هستند، قرمزها را جابه‌جا کن.',
    showAnswer: 'جواب را نشانم بده',
    answerShown: 'این جواب درست است. بلند بخوانش!',
    next: 'جمله‌ی بعدی',
    finish: 'دیدن نتیجه',
    result: (r: number, n: number) => `${r} از ${n}`,
    messages: [
      'اشکالی ندارد، دوباره امتحان کن!',
      'خوب بود! کم‌کم داری یاد می‌گیری.',
      'عالی! جمله‌سازی‌ات خیلی خوب است.',
      'بی‌نقص! تو یک جمله‌ساز واقعی هستی!',
    ],
    again: 'یک دور دیگر',
    changeLevel: 'تغییر سطح',
  },
  en: {
    title: 'Build the sentence!',
    intro: 'The words are mixed up. Tap them in the right order to build the sentence.',
    tipTitle: 'A tip for Persian speakers',
    tip: 'In English the verb comes right after the subject, not at the end. In Persian we say «من سیب می‌خورم», but in English we say:',
    tipLiteral: 'Word by word: “I eat an apple”, not “I an apple eat”.',
    chooseLevel: 'Which one shall we play?',
    short: 'Short sentences',
    shortHint: '4 or 5 words',
    long: 'Long sentences',
    longHint: '6 to 9 words',
    start: "Let's start!",
    loading: 'Getting the sentences ready…',
    sentence: (i: number, n: number) => `Sentence ${i} of ${n}`,
    score: (n: number) => `${n} points`,
    hint: 'Hint:',
    listen: 'Listen',
    tapTiles: 'Tap the words to put them in the gaps. Tap a placed word to send it back.',
    check: 'Check',
    clear: 'Clear',
    correct: 'Well done! The sentence is perfect 🎉',
    wrong: 'Not yet! Green words are in the right place; move the red ones.',
    showAnswer: 'Show me the answer',
    answerShown: 'This is the right answer. Read it out loud!',
    next: 'Next sentence',
    finish: 'See the result',
    result: (r: number, n: number) => `${r} of ${n}`,
    messages: [
      "That's OK, try again!",
      'Good job! You are learning.',
      'Great! You build sentences really well.',
      'Perfect! You are a real sentence builder!',
    ],
    again: 'Play again',
    changeLevel: 'Change level',
  },
};

// Simple sentences only: letters, spaces, contractions like "don't", and one final . ! or ?
const SIMPLE = /^[A-Za-z]+(?:'[a-z]+)?(?: [A-Za-z]+(?:'[a-z]+)?)*[.!?]$/;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Words written with a capital in the middle of some sentence (Mom, English, Friday…) keep it as the first word too.
function properNouns(words: Word[]) {
  const set = new Set<string>();
  for (const w of words) {
    if (!SIMPLE.test(w.s)) continue;
    for (const t of w.s.slice(0, -1).split(' ').slice(1)) if (/^[A-Z]/.test(t)) set.add(t);
  }
  // "May" is a month mid-sentence but a question word at the start ("May I…?").
  set.delete('May');
  return set;
}

function buildItems(words: Word[], level: Level): Item[] {
  const proper = properNouns(words);
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const w of words) {
    if (!SIMPLE.test(w.s) || seen.has(w.s)) continue;
    // The hint shows this word's meaning, so the sentence has to contain it.
    if (!new RegExp(`\\b${escape(w.en)}\\b`, 'i').test(w.s)) continue;
    const tokens = w.s.slice(0, -1).split(' ');
    const n = tokens.length;
    if (level === 'short' ? n < 4 || n > 5 : n < 6 || n > 9) continue;
    seen.add(w.s);
    // The first word's capital would give the answer away.
    const first = tokens[0];
    if (first !== 'I' && !proper.has(first)) tokens[0] = first.toLowerCase();
    items.push({ word: w, sentence: w.s, answer: tokens, end: w.s.slice(-1) });
  }
  return items;
}

// Shuffled tiles, never left in the right order already.
function tilesFor(answer: string[]): Tile[] {
  let order = answer.map((t, id) => ({ id, text: t }));
  for (let i = 0; i < 10; i++) {
    order = shuffle(order);
    if (order.some((t, j) => t.text !== answer[j])) break;
  }
  return order;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const confetti = ['🎉', '⭐', '✨', '🌟', '🎈', '💚'];

export default function SentenceBuilder() {
  const { lang } = useI18n();
  const t = text[lang];
  const [all, setAll] = useState<Word[] | null>(null);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [level, setLevel] = useState<Level>('short');
  const [round, setRound] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [marks, setMarks] = useState<boolean[] | null>(null);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<'building' | 'correct' | 'shown'>('building');
  const [right, setRight] = useState(0);

  useEffect(() => {
    let alive = true;
    import('../../data/words').then(({ words }) => alive && setAll(words));
    return () => {
      alive = false;
      if (canSpeak) window.speechSynthesis.cancel();
    };
  }, []);

  const pools = useMemo(() => (all ? { short: buildItems(all, 'short'), long: buildItems(all, 'long') } : null), [all]);

  const item = round[index];
  const done = status !== 'building';

  const setup = (it: Item) => {
    setTiles(tilesFor(it.answer));
    setPlaced([]);
    setMarks(null);
    setTries(0);
    setStatus('building');
  };

  const start = () => {
    if (!pools) return;
    const items = shuffle(pools[level]).slice(0, ROUND);
    setRound(items);
    setIndex(0);
    setRight(0);
    setup(items[0]);
    setPhase('playing');
  };

  const place = (tile: Tile) => {
    if (done || placed.includes(tile)) return;
    setPlaced([...placed, tile]);
    setMarks(null);
  };
  const unplace = (tile: Tile) => {
    if (done) return;
    setPlaced(placed.filter((p) => p !== tile));
    setMarks(null);
  };

  const check = () => {
    // Compare by text, so a word that appears twice fits in either of its places.
    const result = item.answer.map((w, i) => placed[i]?.text === w);
    if (result.every(Boolean)) {
      setStatus('correct');
      setRight((r) => r + 1);
      speak(item.sentence);
      if (bump('sentence-correct') >= 5) awardSticker('sentence-5');
    } else {
      setMarks(result);
      setTries((n) => n + 1);
    }
  };

  const reveal = () => {
    const left = [...tiles];
    // Put the tiles in answer order (matching duplicate words by text).
    setPlaced(
      item.answer.map(
        (w) =>
          left.splice(
            left.findIndex((x) => x.text === w),
            1,
          )[0],
      ),
    );
    setMarks(null);
    setStatus('shown');
    speak(item.sentence);
  };

  const next = () => {
    if (index + 1 < round.length) {
      setIndex(index + 1);
      setup(round[index + 1]);
    } else setPhase('result');
  };

  const card = 'mx-auto max-w-2xl rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-8';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-full bg-grape-500 font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0';

  if (phase === 'intro') {
    const levels = [
      { key: 'short' as const, label: t.short, hint: t.shortHint, emoji: '🧩' },
      { key: 'long' as const, label: t.long, hint: t.longHint, emoji: '🚂' },
    ];
    return (
      <div className={`${card} text-center`}>
        <div className="text-6xl">🧱</div>
        <h3 className="mt-3 text-2xl font-black">{t.title}</h3>
        <p className="mt-2 font-bold text-ink/70">{t.intro}</p>

        <div className="mt-5 rounded-3xl bg-sun-50 p-4 text-start ring-2 ring-sun-400/40">
          <p className="flex items-center gap-2 font-black text-sun-700">
            <Lightbulb className="size-5 shrink-0" />
            {t.tipTitle}
          </p>
          <p className="mt-2 leading-7 text-ink/80">{t.tip}</p>
          <p dir="ltr" className="mt-2 text-center font-display text-2xl font-bold">
            <span className="text-leaf-700">I</span>{' '}
            <span className="rounded-lg bg-sun-400 px-1.5 text-night">eat</span>{' '}
            <span className="text-grape-600">an apple</span>. 🍎
          </p>
          <p className="mt-2 text-sm text-ink/60">{t.tipLiteral}</p>
        </div>

        <p className="mt-6 text-sm font-bold text-ink/60">{t.chooseLevel}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {levels.map(({ key, label, hint, emoji }) => (
            <button
              key={key}
              onClick={() => setLevel(key)}
              aria-pressed={level === key}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                level === key ? 'border-grape-500 bg-grape-50' : 'border-ink/10 hover:border-grape-100'
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-lg font-black">{label}</span>
              <span className="text-sm text-ink/60">{hint}</span>
            </button>
          ))}
        </div>
        <button onClick={start} disabled={!pools} className={`mt-6 px-7 py-3 text-lg ${primaryBtn}`}>
          {pools ? t.start : t.loading}
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    const ratio = right / round.length;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const message = t.messages[ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${card} text-center`}
      >
        <p className="text-sm font-bold text-ink/60">{level === 'short' ? t.short : t.long}</p>
        <div className="mt-2 flex justify-center gap-2 text-5xl" aria-label={`${stars}/3`}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
              className={i < stars ? '' : 'opacity-20 grayscale'}
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <p className="mt-4 font-display text-4xl font-black text-grape-600">{t.result(right, round.length)}</p>
        <p className="mt-3 text-lg font-bold">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={start} className={`px-7 py-3 ${primaryBtn}`}>
            <RotateCcw className="size-4" />
            {t.again}
          </button>
          <button
            onClick={() => setPhase('intro')}
            className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-grape-500"
          >
            {t.changeLevel}
          </button>
        </div>
      </motion.div>
    );
  }

  const full = placed.length === item.answer.length;

  return (
    <div className={`${card} relative overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span className="text-ink/60">{t.sentence(index + 1, round.length)}</span>
        <span className="rounded-full bg-grape-100 px-3 py-1 text-grape-600">{t.score(right)}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-grape-50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
          animate={{ width: `${((index + (done ? 1 : 0)) / round.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-bold text-ink/60">{t.hint}</span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-leaf-50 px-4 py-2 font-black text-leaf-700">
              {item.word.e && <span className="text-3xl">{item.word.e}</span>}
              <span dir="rtl" className="text-lg">
                {item.word.fa}
              </span>
            </span>
            {canSpeak && (
              <button
                onClick={() => speak(item.sentence)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sun-500 px-4 py-2 font-bold text-night shadow-soft transition hover:scale-105"
              >
                <Volume2 className="size-5" />
                {t.listen}
              </button>
            )}
          </div>

          {/* The sentence being built */}
          <div
            dir="ltr"
            className={`mt-5 flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-3xl border-2 p-3 transition ${
              status === 'correct'
                ? 'border-leaf-500 bg-leaf-50'
                : status === 'shown'
                  ? 'border-sun-400 bg-sun-50'
                  : 'border-dashed border-grape-100 bg-cream'
            }`}
          >
            {item.answer.map((_, i) => {
              const tile = placed[i];
              const mark = marks?.[i];
              const look = !tile
                ? 'border-2 border-dashed border-ink/20 text-transparent'
                : status === 'correct'
                  ? 'bg-leaf-500 text-white'
                  : status === 'shown'
                    ? 'bg-sun-400 text-night'
                    : mark === true
                      ? 'bg-leaf-100 text-leaf-700 ring-2 ring-leaf-500'
                      : mark === false
                        ? 'bg-berry-100 text-berry-500 ring-2 ring-berry-500'
                        : 'bg-grape-500 text-white';
              return (
                <motion.button
                  key={tile ? `t${tile.id}` : `slot${i}`}
                  layout
                  onClick={() => tile && unplace(tile)}
                  disabled={!tile || done}
                  initial={tile ? { scale: 0.6 } : false}
                  animate={mark === false ? { scale: 1, x: [0, -5, 5, -3, 3, 0] } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`min-h-12 min-w-14 rounded-xl px-3 py-2 font-display text-xl font-bold shadow-sm ${look}`}
                >
                  {tile ? (i === 0 ? capitalise(tile.text) : tile.text) : '·'}
                </motion.button>
              );
            })}
            <span className="font-display text-2xl font-black text-ink/70">{item.end}</span>
          </div>

          {/* Remaining tiles */}
          {!done && (
            <>
              <p className="mt-4 text-center text-sm text-ink/60">{t.tapTiles}</p>
              <div dir="ltr" className="mt-3 flex min-h-14 flex-wrap justify-center gap-2">
                {tiles.map((tile) =>
                  placed.includes(tile) ? null : (
                    <motion.button
                      key={tile.id}
                      layout
                      onClick={() => place(tile)}
                      whileTap={{ scale: 0.9 }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="min-h-12 min-w-14 rounded-xl bg-sun-100 px-3 py-2 font-display text-xl font-bold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-sun-400"
                    >
                      {tile.text}
                    </motion.button>
                  ),
                )}
              </div>
            </>
          )}

          {done && (
            <p dir="ltr" className="mt-4 text-center font-display text-2xl font-bold text-leaf-700">
              {item.sentence}
            </p>
          )}

          <div className="mt-5 flex min-h-12 flex-wrap items-center justify-center gap-3" role="status">
            {status === 'correct' && <p className="w-full text-center font-bold text-leaf-700">{t.correct}</p>}
            {status === 'shown' && <p className="w-full text-center font-bold text-sun-700">{t.answerShown}</p>}
            {status === 'building' && marks && <p className="w-full text-center font-bold text-berry-500">{t.wrong}</p>}

            {!done && (
              <>
                <button onClick={check} disabled={!full} className={`px-7 py-3 text-lg ${primaryBtn}`}>
                  <Check className="size-5" />
                  {t.check}
                </button>
                <button
                  onClick={() => {
                    setPlaced([]);
                    setMarks(null);
                  }}
                  disabled={placed.length === 0}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/10 px-5 py-2.5 font-bold transition hover:border-grape-500 disabled:opacity-40"
                >
                  <Undo2 className="size-4" />
                  {t.clear}
                </button>
                {tries >= 2 && (
                  <button
                    onClick={reveal}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun-100 px-5 py-2.5 font-bold text-sun-700 transition hover:bg-sun-400 hover:text-night"
                  >
                    <Eye className="size-4" />
                    {t.showAnswer}
                  </button>
                )}
              </>
            )}
            {done && (
              <button onClick={next} className={`px-7 py-3 ${primaryBtn}`}>
                {index + 1 < round.length ? t.next : t.finish}
                {index + 1 >= round.length && <Trophy className="size-4" />}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* A short burst of confetti for a correct sentence */}
      <AnimatePresence>
        {status === 'correct' && (
          <div key={`party${index}`} className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 left-1/2 text-3xl"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 14) * Math.PI * 2) * (110 + (i % 3) * 40),
                  y: Math.sin((i / 14) * Math.PI * 2) * (80 + (i % 3) * 30) - 30,
                  scale: [0, 1.3, 1],
                  opacity: [1, 1, 0],
                  rotate: (i % 2 ? 1 : -1) * 90,
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                {confetti[i % confetti.length]}
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
