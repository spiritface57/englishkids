import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Flame, Volume2, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { awardSticker } from '../../progress';
import { shuffle, speak } from '../wordGame';
import {
  Celebrate,
  GameSetup,
  Loading,
  Stat,
  cardClass,
  isPlain,
  num,
  poolFor,
  primaryBtn,
  readNum,
  secondaryBtn,
  useWordList,
  writeNum,
  type Level,
} from './gameKit';

// Save the balloons: guess the word letter by letter. A teddy holds 6 balloons; each wrong letter lets one float away.
// Easy: 3–5 letter words with the first letter shown. Hard: 6–9 letter words.

const BALLOONS = 6;
const MIN_WORDS = 8;
const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
// Balloon colours (fill) and where each one floats when it is lost.
const BALLOON_STYLE = [
  { fill: 'fill-berry-500', x: 40, y: 58, drift: -40 },
  { fill: 'fill-sun-500', x: 72, y: 36, drift: -20 },
  { fill: 'fill-leaf-500', x: 104, y: 24, drift: 10 },
  { fill: 'fill-grape-500', x: 136, y: 24, drift: -10 },
  { fill: 'fill-sun-600', x: 168, y: 36, drift: 25 },
  { fill: 'fill-leaf-600', x: 200, y: 58, drift: 40 },
];

const text = {
  fa: {
    intro: 'حرف‌های کلمه را حدس بزن تا بادکنک‌های خرسی پرواز نکنند!',
    easyHint: 'کلمه‌های ۳ تا ۵ حرفی، حرف اول معلوم است',
    hardHint: 'کلمه‌های ۶ تا ۹ حرفی',
    best: (n: string) => `بهترین زنجیره: ${n} برد`,
    clue: 'این کلمه یعنی:',
    letters: (n: string) => `${n} حرف`,
    balloons: 'بادکنک‌ها',
    streak: 'برد پشت سر هم',
    win: 'هورا! بادکنک‌ها نجات پیدا کردند',
    lose: 'دفعه‌ی بعد!',
    loseMsg: 'اشکالی ندارد، کلمه این بود:',
    next: 'کلمه‌ی بعدی',
    newBest: 'رکورد تازه! 🎉',
    bestLine: (n: string) => `بهترین زنجیره‌ات: ${n}`,
    left: 'بادکنک مانده',
    listen: 'گوش کن',
    quit: 'خروج از بازی',
    settings: 'تغییر موضوع یا سطح',
  },
  en: {
    intro: "Guess the word's letters before Teddy's balloons fly away!",
    easyHint: '3–5 letter words, first letter shown',
    hardHint: '6–9 letter words',
    best: (n: string) => `Best streak: ${n} wins`,
    clue: 'This word means:',
    letters: (n: string) => `${n} letters`,
    balloons: 'Balloons',
    streak: 'Wins in a row',
    win: 'Hooray! You saved the balloons',
    lose: 'Next time!',
    loseMsg: "That's okay, the word was:",
    next: 'Next word',
    newBest: 'New record! 🎉',
    bestLine: (n: string) => `Your best streak: ${n}`,
    left: 'Balloons left',
    listen: 'Listen',
    quit: 'Leave game',
    settings: 'Change topic or level',
  },
};

const fitsFor = (level: Level) => (w: Word) => {
  const n = w.en.length;
  return isPlain(w) && (level === 'easy' ? n >= 3 && n <= 5 : n >= 6 && n <= 9);
};
const bestKey = (level: Level) => `balloonsBestStreak-${level}`;

function Balloons({ lost, won }: { lost: number; won: boolean }) {
  // Hand of the teddy, where all the strings meet.
  const hand = { x: 120, y: 150 };
  return (
    <svg viewBox="0 0 240 210" className="mx-auto h-52 w-full max-w-xs overflow-visible sm:h-60" aria-hidden>
      {BALLOON_STYLE.map((b, i) => {
        // The last balloons in the list fly away first, from the outside in.
        const order = [5, 0, 4, 1, 3, 2].indexOf(i);
        const gone = order < lost;
        return (
          <motion.g
            key={i}
            initial={false}
            animate={
              gone ? { y: -320, x: b.drift, opacity: 0, rotate: b.drift / 4 } : { y: 0, x: 0, opacity: 1, rotate: 0 }
            }
            transition={gone ? { duration: 2.2, ease: 'easeIn' } : { type: 'spring', stiffness: 120, damping: 14 }}
          >
            <motion.g
              animate={{ y: won ? [0, -10, 0] : [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: won ? 0.6 : 2 + i * 0.25, ease: 'easeInOut' }}
            >
              <path
                d={`M ${b.x} ${b.y + 22} Q ${(b.x + hand.x) / 2 + (i % 2 ? 6 : -6)} ${(b.y + hand.y) / 2} ${hand.x} ${hand.y}`}
                className="stroke-ink/40"
                strokeWidth={1.2}
                fill="none"
              />
              <ellipse cx={b.x} cy={b.y} rx={17} ry={21} className={b.fill} />
              <path d={`M ${b.x - 4} ${b.y + 24} L ${b.x} ${b.y + 19} L ${b.x + 4} ${b.y + 24} Z`} className={b.fill} />
              <ellipse cx={b.x - 6} cy={b.y - 8} rx={4} ry={6} className="fill-white" fillOpacity={0.45} />
            </motion.g>
          </motion.g>
        );
      })}
      <text x={hand.x} y={198} textAnchor="middle" fontSize={50}>
        🧸
      </text>
    </svg>
  );
}

export default function Hangman() {
  const { lang } = useI18n();
  const tx = text[lang];
  const words = useWordList();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'won' | 'lost'>('setup');
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState<Level>('easy');
  const [word, setWord] = useState<Word | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [wins, setWins] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const used = useRef(new Set<string>());
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const answer = word?.en.toUpperCase() ?? '';
  const wrong = [...guessed].filter((ch) => !answer.includes(ch));
  const solved = !!answer && [...answer].every((ch) => guessed.has(ch));

  const guess = (raw: string) => {
    const ch = raw.toUpperCase();
    if (phase !== 'playing' || !word || solved || wrong.length >= BALLOONS) return;
    if (guessed.has(ch) || !/^[A-Z]$/.test(ch)) return;
    const next = new Set(guessed).add(ch);
    setGuessed(next);
    const misses = [...next].filter((x) => !answer.includes(x)).length;
    if ([...answer].every((x) => next.has(x))) {
      speak(word.en);
      const s = streak + 1;
      setStreak(s);
      setWins((w) => w + 1);
      if (s > readNum(bestKey(level))) {
        writeNum(bestKey(level), s);
        setNewBest(true);
      }
      awardSticker('hangman-win');
      timer.current = window.setTimeout(() => setPhase('won'), 700);
    } else if (misses >= BALLOONS) {
      setStreak(0);
      timer.current = window.setTimeout(() => {
        setPhase('lost');
        speak(word.en);
      }, 1200);
    }
  };

  // Physical keyboard support.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !/^[a-z]$/i.test(e.key)) return;
      e.preventDefault();
      guess(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!words) return <Loading />;

  const nextWord = (lvl = level) => {
    window.clearTimeout(timer.current);
    const pool = poolFor(words, topic, fitsFor(lvl), MIN_WORDS);
    let fresh = pool.filter((w) => !used.current.has(w.en));
    if (fresh.length === 0) {
      used.current.clear();
      fresh = pool;
    }
    const w = shuffle(fresh)[0];
    used.current.add(w.en);
    setWord(w);
    setGuessed(lvl === 'easy' ? new Set([w.en[0].toUpperCase()]) : new Set());
    setNewBest(false);
    setPhase('playing');
  };

  const begin = () => {
    setStreak(0);
    setWins(0);
    used.current.clear();
    nextWord();
  };

  if (phase === 'setup' || !word)
    return (
      <GameSetup
        emoji="🎈"
        intro={tx.intro}
        words={words}
        fits={(w, l) => fitsFor(l)(w)}
        min={() => MIN_WORDS}
        topic={topic}
        setTopic={setTopic}
        level={level}
        setLevel={setLevel}
        hints={{ easy: tx.easyHint, hard: tx.hardHint }}
        best={(l) => (readNum(bestKey(l)) ? tx.best(num(lang, readNum(bestKey(l)))) : null)}
        onStart={begin}
      />
    );

  const NextIcon = lang === 'fa' ? ArrowLeft : ArrowRight;
  const wordCard = (
    <button
      onClick={() => speak(word.en)}
      className="mx-auto mt-4 flex items-center gap-3 rounded-2xl bg-leaf-50 px-5 py-3 active:scale-95"
      aria-label={tx.listen}
    >
      {word.e && <span className="text-4xl">{word.e}</span>}
      <span className="text-start">
        <span dir="ltr" className="block font-display text-3xl font-bold text-leaf-700">
          {word.en}
        </span>
        <span dir="rtl" className="block text-sm font-bold text-ink/60">
          {word.fa}
        </span>
      </span>
      <Volume2 className="size-5 text-grape-500" />
    </button>
  );

  if (phase === 'won' || phase === 'lost') {
    const won = phase === 'won';
    const best = readNum(bestKey(level));
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className={`relative ${cardClass} text-center`}
      >
        {won && <Celebrate />}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 12 }}
          className="text-7xl"
        >
          {won ? '🎈' : '🤗'}
        </motion.div>
        <p className={`mt-3 text-2xl font-black ${won ? 'text-grape-600' : 'text-sun-700'}`}>
          {won ? tx.win : tx.lose}
        </p>
        {!won && <p className="mt-2 font-bold text-ink/70">{tx.loseMsg}</p>}
        <div className="flex justify-center">{wordCard}</div>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">
          <Stat label={tx.streak} value={num(lang, streak)} tone="bg-sun-100 text-sun-700" />
          <Stat
            label={won ? tx.left : tx.balloons}
            value={num(lang, Math.max(0, BALLOONS - wrong.length))}
            tone="bg-berry-100 text-berry-500"
          />
        </div>
        <p className="mt-3 text-sm font-bold text-sun-700">
          {newBest ? tx.newBest : best > 0 && tx.bestLine(num(lang, best))}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => nextWord()} className={`px-7 py-3 ${primaryBtn}`}>
            {tx.next}
            <NextIcon className="size-4" />
          </button>
          <button onClick={() => setPhase('setup')} className={`px-5 py-3 ${secondaryBtn}`}>
            {tx.settings}
          </button>
        </div>
      </motion.div>
    );
  }

  const balloonsLeft = BALLOONS - wrong.length;
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-berry-100 px-3 py-1 text-berry-500">
            🎈 {num(lang, balloonsLeft)}/{num(lang, BALLOONS)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-3 py-1 text-sun-700">
            <Flame className="size-4" />
            {tx.streak}: {num(lang, streak)}
          </span>
          {wins > 0 && <span className="rounded-full bg-leaf-100 px-3 py-1 text-leaf-700">⭐ {num(lang, wins)}</span>}
        </div>
        <button
          onClick={() => setPhase('setup')}
          aria-label={tx.quit}
          title={tx.quit}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition active:scale-90"
        >
          <X className="size-5" />
        </button>
      </div>

      <Balloons lost={wrong.length} won={solved} />

      <div className="text-center">
        <p className="text-sm font-bold text-ink/60">{tx.clue}</p>
        <div className="mt-1 flex items-center justify-center gap-3">
          {word.e && <span className="text-5xl">{word.e}</span>}
          <span dir="rtl" className="text-2xl font-black">
            {word.fa}
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-ink/50">{tx.letters(num(lang, answer.length))}</p>
      </div>

      <div dir="ltr" className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {[...answer].map((ch, i) => {
          const shown = guessed.has(ch);
          return (
            <motion.span
              key={i}
              initial={false}
              animate={shown ? { scale: [1.3, 1], y: [-6, 0] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`grid h-12 w-9 place-items-center rounded-xl border-b-4 font-display text-2xl font-bold sm:h-14 sm:w-11 sm:text-3xl ${
                shown ? 'border-leaf-500 bg-leaf-50 text-leaf-700' : 'border-ink/20 bg-cream'
              }`}
            >
              {shown ? ch : ''}
            </motion.span>
          );
        })}
      </div>

      <div dir="ltr" className="mt-5 flex flex-col items-center gap-1.5 sm:gap-2">
        {KEYS.map((row) => (
          <div key={row} className="flex w-full justify-center gap-1 sm:gap-1.5">
            {[...row].map((ch) => {
              const isUsed = guessed.has(ch);
              const good = isUsed && answer.includes(ch);
              return (
                <motion.button
                  key={ch}
                  onClick={() => guess(ch)}
                  disabled={isUsed || solved || balloonsLeft <= 0}
                  whileTap={{ scale: 0.85 }}
                  animate={isUsed && !good ? { x: [0, -4, 4, 0] } : undefined}
                  className={`grid h-12 max-w-11 min-w-0 flex-1 place-items-center rounded-xl font-display text-lg font-bold shadow-sm transition sm:h-14 sm:text-xl ${
                    !isUsed
                      ? 'bg-sun-100 text-ink'
                      : good
                        ? 'bg-leaf-500 text-white'
                        : 'bg-berry-100 text-berry-500 opacity-60'
                  }`}
                >
                  {ch}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
