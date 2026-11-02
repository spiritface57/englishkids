import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Flame, Play, RotateCcw, Settings2, Smile } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Word } from '../../data/words';
import { kidStorage } from '../../profiles';

// Shared pieces for the word games (memory match, word search, save the balloons):
// word loading, topic + level setup screen, win panel and small helpers.

export type Level = 'easy' | 'hard';
export type Lang = 'fa' | 'en';

export const topicMeta: Record<string, { emoji: string; fa: string; en: string }> = {
  all: { emoji: '✨', fa: 'همه', en: 'All' },
  animals: { emoji: '🐾', fa: 'حیوانات', en: 'Animals' },
  nature: { emoji: '🌳', fa: 'طبیعت', en: 'Nature' },
  food: { emoji: '🍎', fa: 'خوراکی‌ها', en: 'Food' },
  kitchen: { emoji: '🍳', fa: 'آشپزخانه', en: 'Kitchen' },
  home: { emoji: '🏠', fa: 'خانه', en: 'Home' },
  clothes: { emoji: '👕', fa: 'لباس‌ها', en: 'Clothes' },
  school: { emoji: '🎒', fa: 'مدرسه', en: 'School' },
  people: { emoji: '👨‍👩‍👧', fa: 'آدم‌ها', en: 'People' },
  body: { emoji: '🖐️', fa: 'بدن', en: 'Body' },
  feelings: { emoji: '😊', fa: 'احساسات', en: 'Feelings' },
  actions: { emoji: '🏃', fa: 'کارها', en: 'Actions' },
  describe: { emoji: '🎨', fa: 'توصیف‌ها', en: 'Describing' },
  time: { emoji: '⏰', fa: 'زمان', en: 'Time' },
  places: { emoji: '🗺️', fa: 'جاها', en: 'Places' },
  play: { emoji: '⚽', fa: 'بازی', en: 'Play' },
  science: { emoji: '🔬', fa: 'علم', en: 'Science' },
  everyday: { emoji: '🧺', fa: 'زندگی روزمره', en: 'Everyday' },
};

const kitText = {
  fa: {
    loading: 'در حال آماده کردن بازی…',
    topic: 'موضوع را انتخاب کن',
    level: 'سطح بازی',
    easy: 'آسان',
    hard: 'سخت',
    start: 'شروع بازی',
    again: 'دوباره بازی کن',
    settings: 'تغییر موضوع یا سطح',
  },
  en: {
    loading: 'Getting the game ready…',
    topic: 'Choose a topic',
    level: 'Level',
    easy: 'Easy',
    hard: 'Hard',
    start: 'Start',
    again: 'Play again',
    settings: 'Change topic or level',
  },
};

export const isPlain = (w: Word) => /^[a-z]+$/i.test(w.en);

export const num = (lang: Lang, n: number) => n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

export const clock = (lang: Lang, seconds: number) =>
  `${num(lang, Math.floor(seconds / 60))}:${num(lang, seconds % 60).padStart(2, lang === 'fa' ? '۰' : '0')}`;

export const readNum = (key: string) => Number(kidStorage.getItem(key)) || 0;
export const writeNum = (key: string, n: number) => kidStorage.setItem(key, String(n));

export function useWordList() {
  const [words, setWords] = useState<Word[] | null>(null);
  useEffect(() => {
    let alive = true;
    import('../../data/words').then((m) => alive && setWords(m.words));
    return () => {
      alive = false;
    };
  }, []);
  return words;
}

// The words of a topic that suit the game, or all suitable words when the topic has too few.
export function poolFor(words: Word[], topic: string, fits: (w: Word) => boolean, min: number) {
  const all = words.filter(fits);
  const picked = topic === 'all' ? all : all.filter((w) => w.c === topic);
  return picked.length >= min ? picked : all;
}

const topicsFor = (words: Word[], fits: (w: Word) => boolean, min: number) => {
  const counts = new Map<string, number>();
  for (const w of words) if (fits(w)) counts.set(w.c, (counts.get(w.c) ?? 0) + 1);
  return ['all', ...Object.keys(topicMeta).filter((k) => k !== 'all' && (counts.get(k) ?? 0) >= min)];
};

export const cardClass = 'rounded-3xl border-4 border-surface bg-surface p-4 shadow-soft sm:p-6';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-grape-500 font-bold text-white shadow-soft transition active:scale-95';
export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink/10 bg-surface font-bold transition active:scale-95';

export function Loading() {
  const { lang } = useI18n();
  return (
    <div className={`${cardClass} py-12 text-center font-bold text-ink/60`}>
      <motion.div
        animate={{ rotate: [0, 12, -12, 0] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="mb-3 text-5xl"
      >
        🎲
      </motion.div>
      {kitText[lang].loading}
    </div>
  );
}

type SetupProps = {
  emoji: string;
  intro: string;
  words: Word[];
  fits: (w: Word, level: Level) => boolean;
  min: (level: Level) => number;
  topic: string;
  setTopic: (t: string) => void;
  level: Level;
  setLevel: (l: Level) => void;
  hints: Record<Level, string>;
  best: (level: Level) => string | null;
  onStart: () => void;
};

export function GameSetup(props: SetupProps) {
  const { lang } = useI18n();
  const k = kitText[lang];
  const { words, fits, level, topic } = props;
  const topics = topicsFor(words, (w) => fits(w, level), props.min(level));
  const current = topics.includes(topic) ? topic : 'all';
  const levels = [
    { key: 'easy' as const, label: k.easy, Icon: Smile, tone: 'text-leaf-600' },
    { key: 'hard' as const, label: k.hard, Icon: Flame, tone: 'text-berry-500' },
  ];

  return (
    <div className={`${cardClass} text-center`}>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="text-6xl"
      >
        {props.emoji}
      </motion.div>
      <p className="mt-3 text-lg font-bold">{props.intro}</p>

      <p className="mt-6 text-sm font-bold text-ink/60">{k.topic}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {topics.map((key) => {
          const t = topicMeta[key];
          const on = key === current;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              onClick={() => props.setTopic(key)}
              aria-pressed={on}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${
                on ? 'border-grape-500 bg-grape-500 text-white shadow-soft' : 'border-ink/10 bg-cream'
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              {t[lang]}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-6 text-sm font-bold text-ink/60">{k.level}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {levels.map(({ key, label, Icon, tone }) => {
          const best = props.best(key);
          return (
            <button
              key={key}
              onClick={() => props.setLevel(key)}
              aria-pressed={level === key}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition sm:p-4 ${
                level === key ? 'border-grape-500 bg-grape-50' : 'border-ink/10 bg-cream'
              }`}
            >
              <Icon className={`size-7 ${tone}`} />
              <span className="text-lg font-black">{label}</span>
              <span className="text-xs text-ink/60 sm:text-sm">{props.hints[key]}</span>
              {best && <span className="mt-1 text-xs font-bold text-grape-600">{best}</span>}
            </button>
          );
        })}
      </div>

      <button onClick={props.onStart} className={`mt-6 px-8 py-3 text-lg ${primaryBtn}`}>
        <Play className="size-5" />
        {k.start}
      </button>
    </div>
  );
}

// Emoji confetti bursting out from the middle.
export function Celebrate() {
  const bits = ['🎉', '⭐', '🎈', '✨', '🌟', '🎊'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 110 + (i % 3) * 40;
        return (
          <motion.span
            key={i}
            className="absolute top-1/3 left-1/2 text-2xl"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1.2, opacity: 0, rotate: 180 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: (i % 4) * 0.05 }}
          >
            {bits[i % bits.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = 'bg-grape-50 text-grape-600',
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`rounded-2xl px-3 py-2 ${tone}`}>
      <div className="text-xs font-bold opacity-80">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

type WinProps = {
  emoji: string;
  title: string;
  message?: ReactNode;
  stats: ReactNode;
  note?: string | null;
  celebrate?: boolean;
  againLabel?: string;
  onAgain: () => void;
  onSettings: () => void;
  children?: ReactNode;
};

export function WinPanel(props: WinProps) {
  const { lang } = useI18n();
  const k = kitText[lang];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`relative ${cardClass} text-center`}
    >
      {props.celebrate !== false && <Celebrate />}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 12 }}
        className="text-7xl"
      >
        {props.emoji}
      </motion.div>
      <p className="mt-3 text-2xl font-black text-grape-600">{props.title}</p>
      {props.message && <div className="mt-2 font-bold text-ink/70">{props.message}</div>}
      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3">{props.stats}</div>
      {props.note && <p className="mt-3 text-sm font-bold text-sun-700">{props.note}</p>}
      {props.children}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={props.onAgain} className={`px-7 py-3 ${primaryBtn}`}>
          <RotateCcw className="size-4" />
          {props.againLabel ?? k.again}
        </button>
        <button onClick={props.onSettings} className={`px-5 py-3 ${secondaryBtn}`}>
          <Settings2 className="size-4" />
          {k.settings}
        </button>
      </div>
    </motion.div>
  );
}
