import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Footprints, Timer, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { awardSticker } from '../../progress';
import { shuffle, speak } from '../wordGame';
import {
  GameSetup,
  Loading,
  Stat,
  WinPanel,
  cardClass,
  clock,
  isPlain,
  num,
  poolFor,
  readNum,
  useWordList,
  writeNum,
  type Level,
} from './gameKit';

// Memory match: each pair is a picture (emoji) card and its English word card. Easy 6 pairs (4×3), hard 8 (4×4).

const PAIRS: Record<Level, number> = { easy: 6, hard: 8 };
const MISMATCH_MS = 900;
// A little slack above 8 because two words can share an emoji.
const MIN_WORDS = 10;

const text = {
  fa: {
    intro: 'کارت‌ها را برگردان و هر تصویر را با کلمه‌اش جفت کن!',
    easyHint: '۶ جفت کارت',
    hardHint: '۸ جفت کارت',
    best: (n: string) => `بهترین: ${n} حرکت`,
    moves: 'حرکت',
    time: 'زمان',
    pairs: 'جفت‌ها',
    win: 'آفرین! همه را جفت کردی',
    newBest: 'رکورد تازه! 🎉',
    bestLine: (n: string) => `بهترین رکوردت: ${n} حرکت`,
    quit: 'خروج از بازی',
    hidden: 'کارت پنهان',
  },
  en: {
    intro: 'Flip the cards and match each picture with its word!',
    easyHint: '6 pairs',
    hardHint: '8 pairs',
    best: (n: string) => `Best: ${n} moves`,
    moves: 'Moves',
    time: 'Time',
    pairs: 'Pairs',
    win: 'Well done! All pairs matched',
    newBest: 'New record! 🎉',
    bestLine: (n: string) => `Your best: ${n} moves`,
    quit: 'Leave game',
    hidden: 'Hidden card',
  },
};

type Card = { id: number; word: Word; side: 'pic' | 'word' };

const fits = (w: Word) => !!w.e && isPlain(w) && w.en.length <= 9;
const bestKey = (level: Level) => `memoryBest-${level}`;

function buildDeck(pool: Word[], pairs: number): Card[] {
  const chosen: Word[] = [];
  const emojis = new Set<string>();
  for (const w of shuffle(pool)) {
    if (chosen.length === pairs) break;
    if (emojis.has(w.e)) continue;
    emojis.add(w.e);
    chosen.push(w);
  }
  return shuffle(
    chosen.flatMap((word) => [
      { word, side: 'pic' as const },
      { word, side: 'word' as const },
    ]),
  ).map((c, id) => ({ ...c, id }));
}

export default function MemoryMatch() {
  const { lang } = useI18n();
  const tx = text[lang];
  const words = useWordList();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'won'>('setup');
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState<Level>('easy');
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  // The clock starts with the first flip and stops on a win.
  useEffect(() => {
    if (phase !== 'playing' || !started) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, started]);

  if (!words) return <Loading />;

  const start = () => {
    window.clearTimeout(timeout.current);
    setDeck(buildDeck(poolFor(words, topic, fits, MIN_WORDS), PAIRS[level]));
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setNewBest(false);
    setPhase('playing');
  };

  const flip = (card: Card) => {
    if (open.length >= 2 || open.includes(card.id) || matched.has(card.word.en)) return;
    setStarted(true);
    if (open.length === 0) {
      setOpen([card.id]);
      return;
    }
    const first = deck.find((c) => c.id === open[0])!;
    setOpen([first.id, card.id]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    if (first.word.en === card.word.en) {
      speak(card.word.en);
      const nextMatched = new Set(matched).add(card.word.en);
      setMatched(nextMatched);
      setOpen([]);
      if (nextMatched.size === deck.length / 2) {
        const best = readNum(bestKey(level));
        if (!best || nextMoves < best) {
          writeNum(bestKey(level), nextMoves);
          setNewBest(true);
        }
        awardSticker('memory-win');
        timeout.current = window.setTimeout(() => setPhase('won'), 900);
      }
    } else {
      timeout.current = window.setTimeout(() => setOpen([]), MISMATCH_MS);
    }
  };

  const bestLabel = (l: Level) => {
    const b = readNum(bestKey(l));
    return b ? tx.best(num(lang, b)) : null;
  };

  if (phase === 'setup')
    return (
      <GameSetup
        emoji="🧠"
        intro={tx.intro}
        words={words}
        fits={fits}
        min={() => MIN_WORDS}
        topic={topic}
        setTopic={setTopic}
        level={level}
        setLevel={setLevel}
        hints={{ easy: tx.easyHint, hard: tx.hardHint }}
        best={bestLabel}
        onStart={start}
      />
    );

  if (phase === 'won')
    return (
      <WinPanel
        emoji="🧠"
        title={tx.win}
        stats={
          <>
            <Stat label={tx.moves} value={num(lang, moves)} />
            <Stat label={tx.time} value={clock(lang, seconds)} tone="bg-sun-100 text-sun-700" />
          </>
        }
        note={newBest ? tx.newBest : bestLabel(level) && tx.bestLine(num(lang, readNum(bestKey(level))))}
        onAgain={start}
        onSettings={() => setPhase('setup')}
      />
    );

  const hard = level === 'hard';
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-grape-100 px-3 py-1 text-grape-600">
            <Footprints className="size-4" />
            {tx.moves}: {num(lang, moves)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-3 py-1 text-sun-700">
            <Timer className="size-4" />
            {clock(lang, seconds)}
          </span>
          <span className="rounded-full bg-leaf-100 px-3 py-1 text-leaf-700">
            {tx.pairs}: {num(lang, matched.size)}/{num(lang, deck.length / 2)}
          </span>
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

      <div dir="ltr" className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-2 sm:gap-3">
        {deck.map((card, i) => {
          const isMatched = matched.has(card.word.en);
          const faceUp = isMatched || open.includes(card.id);
          const long = card.word.en.length;
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
              whileTap={faceUp ? undefined : { scale: 0.93 }}
              onClick={() => flip(card)}
              aria-label={faceUp ? (card.side === 'pic' ? card.word.fa : card.word.en) : tx.hidden}
              className={`relative ${hard ? 'aspect-square' : 'aspect-[4/5]'}`}
              style={{ perspective: 800 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: faceUp ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                {/* Back */}
                <div
                  className="absolute inset-0 grid place-items-center rounded-2xl border-4 border-surface bg-grape-500 text-3xl text-white shadow-soft"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="opacity-80">⭐</span>
                </div>
                {/* Face */}
                <motion.div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-4 p-1 shadow-soft ${
                    isMatched
                      ? 'border-leaf-500 bg-leaf-50'
                      : card.side === 'pic'
                        ? 'border-surface bg-sun-50'
                        : 'border-surface bg-grape-50'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  animate={isMatched ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {card.side === 'pic' ? (
                    <span className={hard ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}>{card.word.e}</span>
                  ) : (
                    <span
                      className={`font-display leading-tight font-bold break-all text-leaf-700 ${
                        long > 7 ? 'text-xs sm:text-base' : long > 5 ? 'text-sm sm:text-lg' : 'text-base sm:text-xl'
                      }`}
                    >
                      {card.word.en}
                    </span>
                  )}
                  {isMatched && (
                    <span
                      dir="rtl"
                      className="line-clamp-1 text-[0.65rem] leading-tight font-bold text-ink/60 sm:text-xs"
                    >
                      {card.word.fa}
                    </span>
                  )}
                </motion.div>
              </motion.div>
              {isMatched && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-leaf-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6] }}
                  transition={{ duration: 0.8 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
