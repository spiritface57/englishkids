import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarHeart, Check, Layers, RotateCcw, Trophy, Volume2, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { packs, type FestivalWord, type Pack } from '../../data/seasonal';
import { awardSticker } from '../../progress';
import { shuffle, speak } from '../wordGame';

// Festival word packs: flip cards and a 6-question picture quiz. Opens on the festival that is on now or comes next.

const DAY = 86_400_000;
const QUIZ_LENGTH = 6;

const text = {
  fa: {
    cards: 'کارت‌ها',
    quiz: 'آزمون',
    tapHint: 'روی کارت بزن تا برگردد و معنی‌اش را ببینی.',
    listen: 'گوش بده',
    now: 'همین روزهاست! 🎉',
    tomorrow: 'فردا!',
    inDays: (n: number) => `${n.toLocaleString('fa-IR')} روز دیگر`,
    question: (i: number, n: number) => `سؤال ${i.toLocaleString('fa-IR')} از ${n.toLocaleString('fa-IR')}`,
    which: 'این کدام کلمه است؟',
    next: 'بعدی',
    finish: 'تمام!',
    score: (r: number, n: number) => `${r.toLocaleString('fa-IR')} از ${n.toLocaleString('fa-IR')}`,
    messages: [
      'اشکالی ندارد، دوباره امتحان کن! 💪',
      'خوب بود! یک بار دیگر؟',
      'آفرین! خیلی خوب بود! 🌟',
      'عالی! همه را درست گفتی! 🏆',
    ],
    again: 'دوباره',
    backToCards: 'برگشت به کارت‌ها',
  },
  en: {
    cards: 'Cards',
    quiz: 'Quiz',
    tapHint: 'Tap a card to flip it and see what it means.',
    listen: 'Listen',
    now: "It's festival time! 🎉",
    tomorrow: 'Tomorrow!',
    inDays: (n: number) => `Coming up in ${n} days`,
    question: (i: number, n: number) => `Question ${i} of ${n}`,
    which: 'Which word is this?',
    next: 'Next',
    finish: 'Finish!',
    score: (r: number, n: number) => `${r} / ${n}`,
    messages: [
      "That's OK, try again! 💪",
      'Good job! One more time?',
      'Well done! 🌟',
      'Perfect! You got them all! 🏆',
    ],
    again: 'Play again',
    backToCards: 'Back to the cards',
  },
};

// Days until the pack's festival (0 while it is on), looking at last, this and next year's dates.
function daysUntil(pack: Pack, today: Date) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let best = Infinity;
  for (const y of [-1, 0, 1]) {
    const start = new Date(today.getFullYear() + y, pack.month - 1, pack.day).getTime();
    const diff = Math.round((start - base) / DAY);
    if (diff <= 0 && -diff < pack.lasts) return 0;
    if (diff > 0) best = Math.min(best, diff);
  }
  return best;
}

type Question = { word: FestivalWord; options: string[] };

function buildQuiz(pack: Pack): Question[] {
  const pictured = pack.words.filter((w) => w.e);
  return shuffle(pictured)
    .slice(0, QUIZ_LENGTH)
    .map((word) => ({
      word,
      options: shuffle([
        word.en,
        ...shuffle(pictured.filter((w) => w !== word))
          .slice(0, 3)
          .map((w) => w.en),
      ]),
    }));
}

export default function Seasonal() {
  const { lang } = useI18n();
  const s = text[lang];
  const countdown = useMemo(() => {
    const today = new Date();
    return Object.fromEntries(packs.map((p) => [p.key, daysUntil(p, today)]));
  }, []);
  const upcoming = useMemo(() => packs.reduce((a, b) => (countdown[b.key] < countdown[a.key] ? b : a)), [countdown]);
  const [pack, setPack] = useState<Pack>(upcoming);
  const [mode, setMode] = useState<'cards' | 'quiz'>('cards');

  const days = countdown[pack.key];
  const badge = days === 0 ? s.now : days === 1 ? s.tomorrow : s.inDays(days);

  const choosePack = (p: Pack) => {
    setPack(p);
    setMode('cards');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {packs.map((p) => {
          const active = p.key === pack.key;
          return (
            <button
              key={p.key}
              role="tab"
              aria-selected={active}
              onClick={() => choosePack(p)}
              className={`relative inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition ${
                active ? 'border-leaf-500 bg-leaf-100 text-leaf-700' : 'border-ink/10 bg-surface hover:border-leaf-200'
              }`}
            >
              <span className="text-lg">{p.emoji}</span>
              {p[lang].title}
              {p.key === upcoming.key && (
                <span className="absolute -top-0.5 -end-0.5 size-3 rounded-full border-2 border-cream bg-sun-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border-4 border-surface bg-sun-50 p-4 shadow-soft">
        <span className="text-5xl">{pack.emoji}</span>
        <div className="min-w-0 flex-1">
          <h4 className="text-xl font-black">{pack[lang].title}</h4>
          <p className="text-sm text-ink/70">{pack[lang].intro}</p>
          <p className="mt-0.5 text-xs font-bold text-ink/50">{pack[lang].when}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
            days === 0 ? 'bg-leaf-500 text-white' : 'bg-sun-100 text-sun-700'
          }`}
        >
          <CalendarHeart className="size-4" />
          {badge}
        </span>
      </div>

      <div className="mt-5 inline-flex rounded-full bg-ink/5 p-1">
        {(['cards', 'quiz'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
              mode === m ? 'bg-grape-500 text-white shadow-soft' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {m === 'cards' ? <Layers className="size-4" /> : <Trophy className="size-4" />}
            {s[m]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {mode === 'cards' ? (
          <Cards key={pack.key} pack={pack} />
        ) : (
          <Quiz key={pack.key} pack={pack} onCards={() => setMode('cards')} />
        )}
      </div>
    </div>
  );
}

const tones = ['bg-leaf-100', 'bg-sun-100', 'bg-grape-100', 'bg-berry-100'];

function Cards({ pack }: { pack: Pack }) {
  const { lang } = useI18n();
  const s = text[lang];
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const flip = (w: FestivalWord) => {
    const next = new Set(flipped);
    if (next.has(w.en)) next.delete(w.en);
    else {
      next.add(w.en);
      speak(w.en);
    }
    setFlipped(next);
  };

  return (
    <>
      <p className="mb-3 text-sm font-bold text-ink/60">{s.tapHint}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pack.words.map((w, i) => {
          const isFlipped = flipped.has(w.en);
          return (
            <motion.div
              key={w.en}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="h-48 [perspective:900px]"
            >
              <motion.div
                role="button"
                tabIndex={0}
                aria-pressed={isFlipped}
                onClick={() => flip(w)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), flip(w))}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative size-full cursor-pointer [transform-style:preserve-3d]"
              >
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl border-4 border-surface p-3 text-center shadow-soft [backface-visibility:hidden] ${tones[i % tones.length]}`}
                >
                  {w.e && <span className="text-5xl sm:text-6xl">{w.e}</span>}
                  <span
                    dir="ltr"
                    className={`font-display font-bold leading-tight ${w.e ? 'text-xl' : 'text-2xl sm:text-3xl'}`}
                  >
                    {w.en}
                  </span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl border-4 border-leaf-200 bg-surface p-3 text-center shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span dir="rtl" className="text-lg font-black text-leaf-700">
                    {w.fa}
                  </span>
                  <span dir="ltr" className="font-display text-sm leading-snug text-ink/80">
                    {w.s}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(w.s);
                    }}
                    tabIndex={isFlipped ? 0 : -1}
                    className="inline-flex items-center gap-1 rounded-full bg-sun-500 px-3 py-1 text-xs font-bold text-night transition hover:scale-105"
                  >
                    <Volume2 className="size-3.5" />
                    {s.listen}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

function Quiz({ pack, onCards }: { pack: Pack; onCards: () => void }) {
  const { lang } = useI18n();
  const s = text[lang];
  const [questions, setQuestions] = useState(() => buildQuiz(pack));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const answered = picked !== null;

  const choose = (option: string) => {
    if (answered) return;
    setPicked(option);
    speak(q.word.en);
    if (option === q.word.en) setRight((r) => r + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setDone(true);
    awardSticker('seasonal');
  };

  const restart = () => {
    setQuestions(buildQuiz(pack));
    setIndex(0);
    setPicked(null);
    setRight(0);
    setDone(false);
  };

  const card = 'rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-7';
  const primaryBtn =
    'inline-flex items-center gap-2 rounded-full bg-grape-500 px-6 py-2.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5';

  if (done) {
    const ratio = right / questions.length;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const message = s.messages[ratio === 1 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${card} text-center`}
      >
        <div className="flex justify-center gap-2 text-5xl" aria-label={`${stars}/3`}>
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
        <p className="mt-4 font-display text-4xl font-black text-grape-600">{s.score(right, questions.length)}</p>
        <p className="mt-3 text-lg font-bold">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={restart} className={primaryBtn}>
            <RotateCcw className="size-4" />
            {s.again}
          </button>
          <button
            onClick={onCards}
            className="rounded-full border-2 border-ink/10 px-6 py-2.5 font-bold transition hover:border-grape-500"
          >
            {s.backToCards}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center justify-between gap-3 text-sm font-bold">
        <span className="text-ink/60">{s.question(index + 1, questions.length)}</span>
        <span className="rounded-full bg-grape-100 px-3 py-1 text-grape-600">{s.score(right, questions.length)}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-grape-50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
          animate={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
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
          <p className="mt-5 text-center text-lg font-bold">{s.which}</p>
          <div className="mt-3 text-center text-7xl sm:text-8xl">{q.word.e}</div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {q.options.map((o) => {
              const isAnswer = o === q.word.en;
              const state = !answered
                ? 'border-ink/10 bg-cream hover:border-grape-500'
                : isAnswer
                  ? 'border-leaf-500 bg-leaf-100 text-leaf-700'
                  : o === picked
                    ? 'border-berry-500 bg-berry-100 text-berry-500'
                    : 'border-ink/10 bg-cream opacity-50';
              return (
                <motion.button
                  key={o}
                  onClick={() => choose(o)}
                  disabled={answered}
                  whileTap={answered ? undefined : { scale: 0.96 }}
                  animate={answered && o === picked && !isAnswer ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
                  dir="ltr"
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center font-display text-lg font-bold transition ${state}`}
                >
                  {answered && isAnswer && <Check className="size-5 shrink-0" />}
                  {answered && o === picked && !isAnswer && <X className="size-5 shrink-0" />}
                  {o}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-ink/70" role="status">
              {answered && (
                <>
                  <span dir="ltr" className="font-display text-leaf-700">
                    {q.word.en}
                  </span>{' '}
                  = <span dir="rtl">{q.word.fa}</span>
                </>
              )}
            </p>
            {answered && (
              <button onClick={next} className={primaryBtn}>
                {index + 1 < questions.length ? s.next : s.finish}
                {index + 1 >= questions.length && <Trophy className="size-4" />}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
