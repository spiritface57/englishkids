import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'motion/react';
import { Check, Eye, EyeOff, Timer, Volume2, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { awardSticker } from '../../progress';
import { shuffle, speak } from '../wordGame';
import { kidStorage } from '../../profiles';
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

// Word search: easy 8×8 with 5 words going right/down; hard 10×10 with 7 words in all 8 directions.
// Select by dragging from the first to the last letter, or by tapping the first and then the last letter.

const SIZE: Record<Level, number> = { easy: 8, hard: 10 };
const COUNT: Record<Level, number> = { easy: 5, hard: 7 };
const MIN_WORDS = 12;
const DIRS: Record<Level, [number, number][]> = {
  easy: [
    [0, 1],
    [1, 0],
  ],
  hard: [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
    [0, -1],
    [-1, 0],
    [1, -1],
    [-1, -1],
  ],
};
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Band colours for found words: [svg stroke, list dot].
const COLORS: [string, string][] = [
  ['stroke-leaf-500', 'bg-leaf-500'],
  ['stroke-sun-500', 'bg-sun-500'],
  ['stroke-grape-500', 'bg-grape-500'],
  ['stroke-berry-500', 'bg-berry-500'],
  ['stroke-leaf-200', 'bg-leaf-200'],
  ['stroke-sun-400', 'bg-sun-400'],
  ['stroke-grape-600', 'bg-grape-600'],
];

const text = {
  fa: {
    intro: 'کلمه‌های پنهان در جدول حروف را پیدا کن!',
    easyHint: '۸×۸، ۵ کلمه، به راست و پایین',
    hardHint: '۱۰×۱۰، ۷ کلمه، در همه‌ی جهت‌ها',
    best: (t: string) => `بهترین زمان: ${t}`,
    help: 'انگشتت را از اولین حرف تا آخرین حرف بکش، یا اول حرف اول و بعد حرف آخر را بزن.',
    showEn: 'نمایش کلمه‌های انگلیسی',
    hideEn: 'پنهان کردن کلمه‌های انگلیسی',
    found: 'پیدا شده',
    time: 'زمان',
    words: 'کلمه‌ها',
    win: 'آفرین کارآگاه! همه را پیدا کردی',
    newBest: 'رکورد تازه! 🎉',
    bestLine: (t: string) => `بهترین زمانت: ${t}`,
    listen: 'گوش کن',
    quit: 'خروج از بازی',
  },
  en: {
    intro: 'Find the words hidden in the letter grid!',
    easyHint: '8×8, 5 words, right and down',
    hardHint: '10×10, 7 words, every direction',
    best: (t: string) => `Best time: ${t}`,
    help: 'Drag from the first letter to the last, or tap the first letter and then the last.',
    showEn: 'Show the English words',
    hideEn: 'Hide the English words',
    found: 'Found',
    time: 'Time',
    words: 'Words',
    win: 'Great detective! You found them all',
    newBest: 'New record! 🎉',
    bestLine: (t: string) => `Your best time: ${t}`,
    listen: 'Listen',
    quit: 'Leave game',
  },
};

type Cell = { r: number; c: number };
type Target = { word: Word; text: string };
type Found = { text: string; a: Cell; b: Cell; color: number };
type Puzzle = { grid: string[][]; targets: Target[] };

const fitsFor = (level: Level) => (w: Word) =>
  isPlain(w) && w.en.length >= (level === 'easy' ? 3 : 4) && w.en.length <= (level === 'easy' ? 6 : SIZE.hard);
const bestKey = (level: Level) => `wordSearchBest-${level}`;
const same = (a: Cell | null, b: Cell | null) => !!a && !!b && a.r === b.r && a.c === b.c;

// The cells from a to b if they lie on a straight (or diagonal) line.
function lineCells(a: Cell, b: Cell): Cell[] | null {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const len = Math.max(Math.abs(dr), Math.abs(dc));
  return Array.from({ length: len + 1 }, (_, i) => ({ r: a.r + Math.sign(dr) * i, c: a.c + Math.sign(dc) * i }));
}

function buildPuzzle(pool: Word[], level: Level): Puzzle {
  const size = SIZE[level];
  let best: Puzzle | null = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () => Array<string | null>(size).fill(null));
    const targets: Target[] = [];
    for (const word of shuffle(pool)) {
      if (targets.length === COUNT[level]) break;
      const t = word.en.toUpperCase();
      // A word inside another chosen word ("CAT" in "CATCH") would be found twice.
      if (targets.some((x) => x.text.includes(t) || t.includes(x.text))) continue;
      const spots = shuffle(
        DIRS[level].flatMap(([dr, dc]) =>
          Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size, dr, dc })),
        ),
      );
      const spot = spots.find(({ r, c, dr, dc }) =>
        [...t].every((ch, i) => {
          const rr = r + dr * i;
          const cc = c + dc * i;
          return rr >= 0 && rr < size && cc >= 0 && cc < size && (grid[rr][cc] === null || grid[rr][cc] === ch);
        }),
      );
      if (!spot) continue;
      [...t].forEach((ch, i) => (grid[spot.r + spot.dr * i][spot.c + spot.dc * i] = ch));
      targets.push({ word, text: t });
    }
    const filled = grid.map((row) => row.map((ch) => ch ?? ALPHABET[Math.floor(Math.random() * 26)]));
    if (!best || targets.length > best.targets.length) best = { grid: filled, targets };
    if (targets.length === COUNT[level]) break;
  }
  return best!;
}

export default function WordSearch() {
  const { lang } = useI18n();
  const tx = text[lang];
  const words = useWordList();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'won'>('setup');
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState<Level>('easy');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [found, setFound] = useState<Found[]>([]);
  const [sel, setSel] = useState<{ a: Cell; b: Cell } | null>(null);
  const [wrong, setWrong] = useState<{ a: Cell; b: Cell } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [showEn, setShowEn] = useState(() => kidStorage.getItem('wordSearchShowEn') === '1');
  const gridRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    moved: false,
    wasPending: false,
    anchor: null as Cell | null,
    end: null as Cell | null,
  });
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!words) return <Loading />;

  const size = SIZE[level];
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const start = () => {
    const fits = fitsFor(level);
    setPuzzle(buildPuzzle(poolFor(words, topic, fits, MIN_WORDS), level));
    setFound([]);
    setSel(null);
    setWrong(null);
    setSeconds(0);
    setNewBest(false);
    drag.current = { active: false, moved: false, wasPending: false, anchor: null, end: null };
    setPhase('playing');
  };

  const toggleEn = () => {
    kidStorage.setItem('wordSearchShowEn', showEn ? '0' : '1');
    setShowEn(!showEn);
  };

  const bestLabel = (l: Level) => {
    const b = readNum(bestKey(l));
    return b ? tx.best(clock(lang, b)) : null;
  };

  if (phase === 'setup' || !puzzle)
    return (
      <GameSetup
        emoji="🔍"
        intro={tx.intro}
        words={words}
        fits={(w, l) => fitsFor(l)(w)}
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

  const targets = puzzle.targets;

  if (phase === 'won')
    return (
      <WinPanel
        emoji="🕵️"
        title={tx.win}
        stats={
          <>
            <Stat label={tx.time} value={clock(lang, seconds)} tone="bg-sun-100 text-sun-700" />
            <Stat label={tx.words} value={num(lang, targets.length)} />
          </>
        }
        note={newBest ? tx.newBest : tx.bestLine(clock(lang, readNum(bestKey(level))))}
        onAgain={start}
        onSettings={() => setPhase('setup')}
      >
        <div dir="ltr" className="mt-5 flex flex-wrap justify-center gap-2">
          {targets.map((t) => (
            <button
              key={t.text}
              onClick={() => speak(t.word.en)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 font-display font-bold text-leaf-700 active:scale-95"
            >
              {t.word.e && <span>{t.word.e}</span>}
              {t.word.en}
              <Volume2 className="size-4" />
            </button>
          ))}
        </div>
      </WinPanel>
    );

  const commit = (a: Cell, b: Cell) => {
    const cells = lineCells(a, b);
    if (!cells || cells.length < 2) return;
    const str = cells.map(({ r, c }) => puzzle.grid[r][c]).join('');
    const rev = [...str].reverse().join('');
    const done = new Set(found.map((f) => f.text));
    const target = targets.find((t) => !done.has(t.text) && (t.text === str || t.text === rev));
    if (!target) {
      setWrong({ a, b });
      later(() => setWrong(null), 450);
      return;
    }
    speak(target.word.en);
    const next = [...found, { text: target.text, a, b, color: found.length % COLORS.length }];
    setFound(next);
    if (next.length === targets.length) {
      const best = readNum(bestKey(level));
      if (!best || seconds < best) {
        writeNum(bestKey(level), Math.max(1, seconds));
        setNewBest(true);
      }
      awardSticker('wordsearch-win');
      later(() => setPhase('won'), 1100);
    }
  };

  const cellAt = (e: ReactPointerEvent): Cell => {
    const rect = gridRef.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(size - 1, Math.max(0, n));
    return {
      r: clamp(Math.floor(((e.clientY - rect.top) / rect.height) * size)),
      c: clamp(Math.floor(((e.clientX - rect.left) / rect.width) * size)),
    };
  };

  // Keeps a dragged selection on one of the 8 straight directions from the anchor.
  const snap = (a: Cell, p: Cell): Cell => {
    const dr = p.r - a.r;
    const dc = p.c - a.c;
    if (lineCells(a, p)) return p;
    const step = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
    const sr = Math.round(Math.sin(step));
    const sc = Math.round(Math.cos(step));
    let len = Math.max(Math.abs(dr), Math.abs(dc));
    const inside = (n: number) => {
      const r = a.r + sr * n;
      const c = a.c + sc * n;
      return r >= 0 && r < size && c >= 0 && c < size;
    };
    while (len > 0 && !inside(len)) len--;
    return { r: a.r + sr * len, c: a.c + sc * len };
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (found.length === targets.length) return;
    e.preventDefault();
    const cell = cellAt(e);
    const d = drag.current;
    // Second tap of tap-first-then-tap-last.
    if (d.anchor && !same(d.anchor, cell) && lineCells(d.anchor, cell)) {
      commit(d.anchor, cell);
      d.anchor = null;
      d.end = null;
      setSel(null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    d.wasPending = same(d.anchor, cell);
    d.active = true;
    d.moved = false;
    d.anchor = cell;
    d.end = cell;
    setSel({ a: cell, b: cell });
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !d.anchor) return;
    const cell = snap(d.anchor, cellAt(e));
    if (same(cell, d.end)) return;
    d.end = cell;
    if (!same(cell, d.anchor)) d.moved = true;
    setSel({ a: d.anchor, b: cell });
  };

  const onUp = () => {
    const d = drag.current;
    if (!d.active || !d.anchor) return;
    d.active = false;
    if (d.moved && d.end && !same(d.end, d.anchor)) {
      commit(d.anchor, d.end);
      d.anchor = null;
    } else if (d.wasPending || (d.moved && same(d.end, d.anchor))) {
      // Tapping the waiting letter again (or dragging back to it) cancels.
      d.anchor = null;
    }
    d.end = d.anchor;
    setSel(d.anchor ? { a: d.anchor, b: d.anchor } : null);
  };

  const selected = new Set((sel && lineCells(sel.a, sel.b)?.map(({ r, c }) => `${r}-${c}`)) || []);
  const doneTexts = new Set(found.map((f) => f.text));
  const band = (a: Cell, b: Cell) => ({ x1: a.c + 0.5, y1: a.r + 0.5, x2: b.c + 0.5, y2: b.r + 0.5 });

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-3 py-1 text-sun-700">
            <Timer className="size-4" />
            {clock(lang, seconds)}
          </span>
          <span className="rounded-full bg-leaf-100 px-3 py-1 text-leaf-700">
            {tx.found}: {num(lang, found.length)}/{num(lang, targets.length)}
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
      <p className="mt-3 text-center text-xs font-bold text-ink/60 sm:text-sm">{tx.help}</p>

      <div dir="ltr" className="mx-auto mt-3 max-w-md">
        <div
          ref={gridRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative grid touch-none rounded-2xl bg-cream p-0 select-none"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox={`0 0 ${size} ${size}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {found.map((f) => (
              <motion.line
                key={f.text}
                {...band(f.a, f.b)}
                className={COLORS[f.color][0]}
                strokeWidth={0.78}
                strokeLinecap="round"
                strokeOpacity={0.45}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35 }}
              />
            ))}
            {sel && (
              <line
                {...band(sel.a, sel.b)}
                className="stroke-grape-500"
                strokeWidth={0.78}
                strokeLinecap="round"
                strokeOpacity={0.3}
              />
            )}
            {wrong && (
              <line
                {...band(wrong.a, wrong.b)}
                className="stroke-berry-500"
                strokeWidth={0.78}
                strokeLinecap="round"
                strokeOpacity={0.35}
              />
            )}
          </svg>
          {puzzle.grid.flatMap((row, r) =>
            row.map((ch, c) => (
              <div
                key={`${r}-${c}`}
                className={`relative grid aspect-square place-items-center font-display font-bold transition-transform ${
                  size > 8 ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'
                } ${selected.has(`${r}-${c}`) ? 'scale-110 text-grape-600' : ''}`}
              >
                {ch}
              </div>
            )),
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={toggleEn}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-grape-50 px-4 py-2 text-sm font-bold text-grape-600 active:scale-95"
        >
          {showEn ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showEn ? tx.hideEn : tx.showEn}
        </button>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {targets.map((t) => {
          const f = found.find((x) => x.text === t.text);
          return (
            <motion.li
              key={t.text}
              animate={f ? { scale: [1, 1.08, 1] } : undefined}
              className={`flex min-h-12 items-center gap-2 rounded-2xl border-2 px-2.5 py-1.5 ${
                f ? 'border-leaf-200 bg-leaf-50' : 'border-ink/10 bg-cream'
              }`}
            >
              {f ? (
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-white ${COLORS[f.color][1]}`}
                >
                  <Check className="size-4" />
                </span>
              ) : (
                t.word.e && <span className="shrink-0 text-2xl">{t.word.e}</span>
              )}
              <span className="min-w-0 flex-1 leading-tight">
                <span dir="rtl" className={`block text-sm font-bold ${f ? 'text-ink/50 line-through' : ''}`}>
                  {t.word.fa}
                </span>
                {(showEn || doneTexts.has(t.text)) && (
                  <span
                    dir="ltr"
                    className={`block font-display text-sm font-bold text-leaf-700 ${f ? 'line-through' : ''}`}
                  >
                    {t.word.en}
                  </span>
                )}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
