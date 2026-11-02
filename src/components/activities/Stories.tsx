import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleStop,
  List,
  Rabbit,
  RotateCcw,
  Snail,
  Volume2,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { stories, type Story } from '../../data/stories';
import { awardSticker } from '../../progress';
import { canSpeak, shuffle, speak } from '../wordGame';
import { kidStorage } from '../../profiles';

// Read-along stories: pages read aloud with the current word highlighted, tap a word for its meaning,
// then 3 comprehension questions. Finished stories are remembered in this browser.

const DONE_KEY = 'storiesDone';
const RATES = { slow: 0.6, normal: 0.9 };
// Without word events from the browser, highlighting follows an estimated timeline instead.
const BOUNDARY_WAIT = 600;

type Speed = keyof typeof RATES;
type WordSpan = { start: number; end: number; text: string };
type Segment = { text: string; word: number | null };
type Popover = { index: number; en: string; fa: string; left: number; top: number; width: number };

const text = {
  fa: {
    title: 'قصه‌های خواندنی',
    intro: 'یک قصه انتخاب کن. می‌توانی خودت بخوانی یا بزنی «برایم بخوان». روی هر کلمه بزن تا معنی‌اش را ببینی.',
    level: (n: number) => `سطح ${n}`,
    pages: (n: number) => `${n} صفحه`,
    read: 'خوانده شده',
    page: (i: number, n: number) => `صفحه‌ی ${i} از ${n}`,
    readToMe: 'برایم بخوان',
    stop: 'بس است',
    slow: 'آهسته',
    normal: 'معمولی',
    speed: 'سرعت خواندن',
    prev: 'قبلی',
    next: 'بعدی',
    toQuestions: 'برویم سراغ سؤال‌ها',
    back: 'فهرست قصه‌ها',
    tapHint: 'روی هر کلمه بزن تا معنی‌اش را ببینی.',
    noSpeech: 'مرورگر شما خواندن با صدا را پشتیبانی نمی‌کند، ولی می‌توانی خودت بخوانی!',
    questions: 'سه سؤال از قصه',
    question: (i: number, n: number) => `سؤال ${i} از ${n}`,
    tryAgain: 'نه، دوباره فکر کن!',
    right: 'درست است! 👏',
    nextQuestion: 'سؤال بعدی',
    finish: 'تمام!',
    doneTitle: 'آفرین! قصه را تمام کردی 🎉',
    firstTry: (r: number, n: number) => `${r} از ${n} سؤال را بار اول درست جواب دادی.`,
    words: 'کلمه‌های این قصه',
    readAgain: 'دوباره بخوانیم',
    say: 'تلفظ',
    close: 'بستن',
  },
  en: {
    title: 'Read-along stories',
    intro: 'Pick a story. Read it yourself or tap “Read to me”. Tap any word to see what it means.',
    level: (n: number) => `Level ${n}`,
    pages: (n: number) => `${n} pages`,
    read: 'Read',
    page: (i: number, n: number) => `Page ${i} of ${n}`,
    readToMe: 'Read to me',
    stop: 'Stop',
    slow: 'Slow',
    normal: 'Normal',
    speed: 'Reading speed',
    prev: 'Back',
    next: 'Next',
    toQuestions: 'On to the questions',
    back: 'All stories',
    tapHint: 'Tap any word to see what it means.',
    noSpeech: "Your browser can't read aloud, but you can read it yourself!",
    questions: 'Three questions about the story',
    question: (i: number, n: number) => `Question ${i} of ${n}`,
    tryAgain: 'Not quite, think again!',
    right: 'That’s right! 👏',
    nextQuestion: 'Next question',
    finish: 'Finish!',
    doneTitle: 'Well done! You finished the story 🎉',
    firstTry: (r: number, n: number) => `You got ${r} of ${n} questions right on the first try.`,
    words: 'Words in this story',
    readAgain: 'Read it again',
    say: 'Say it',
    close: 'Close',
  },
};

const readDone = (): string[] => {
  try {
    return JSON.parse(kidStorage.getItem(DONE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

// Splits a page into words (which can be tapped and highlighted) and the spaces/punctuation between them.
function split(page: string) {
  const words: WordSpan[] = [];
  const segments: Segment[] = [];
  let last = 0;
  for (const m of page.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: page.slice(last, start), word: null });
    segments.push({ text: m[0], word: words.length });
    words.push({ start, end: start + m[0].length, text: m[0] });
    last = start + m[0].length;
  }
  if (last < page.length) segments.push({ text: page.slice(last), word: null });
  return { words, segments };
}

const wordAt = (words: WordSpan[], charIndex: number) => {
  let i = 0;
  while (i + 1 < words.length && words[i + 1].start <= charIndex) i++;
  return i;
};

// Rough end time (ms) of each word: longer words take longer, and the voice pauses at commas and full stops.
function timeline(page: string, words: WordSpan[], rate: number) {
  let t = 0;
  return words.map((w) => {
    const after = page.slice(w.end, w.end + 2);
    const pause = /[.!?]/.test(after) ? 380 : after.includes(',') ? 200 : 0;
    t += (120 + 60 * w.text.length + pause) / rate;
    return t;
  });
}

function useReadAloud() {
  const [active, setActive] = useState(-1);
  const [reading, setReading] = useState(false);
  const run = useRef(0);
  const wait = useRef<number>(undefined);
  const tick = useRef<number>(undefined);
  // Chrome may drop events of an utterance that is no longer referenced.
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const clearTimers = () => {
    window.clearTimeout(wait.current);
    window.clearInterval(tick.current);
  };

  const stop = useCallback(() => {
    run.current++;
    clearTimers();
    if (canSpeak) window.speechSynthesis.cancel();
    utterance.current = null;
    setReading(false);
    setActive(-1);
  }, []);

  useEffect(() => stop, [stop]);

  const read = (page: string, words: WordSpan[], rate: number) => {
    stop();
    if (!canSpeak) return;
    const id = run.current;
    const live = () => id === run.current;
    let boundaries = false;
    const u = new SpeechSynthesisUtterance(page);
    u.lang = 'en-US';
    u.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
    if (voice) u.voice = voice;

    u.onstart = () => {
      if (!live()) return;
      const t0 = performance.now();
      setActive(0);
      wait.current = window.setTimeout(() => {
        if (boundaries || !live()) return;
        const ends = timeline(page, words, rate);
        tick.current = window.setInterval(() => {
          const i = ends.findIndex((end) => end > performance.now() - t0);
          setActive(i < 0 ? words.length - 1 : i);
        }, 60);
      }, BOUNDARY_WAIT);
    };
    u.onboundary = (e) => {
      if (!live() || (e.name && e.name !== 'word')) return;
      boundaries = true;
      window.clearInterval(tick.current);
      setActive(wordAt(words, e.charIndex));
    };
    u.onend = u.onerror = () => {
      if (!live()) return;
      clearTimers();
      utterance.current = null;
      setReading(false);
      setActive(-1);
    };

    utterance.current = u;
    setReading(true);
    window.speechSynthesis.speak(u);
  };

  return { active, reading, read, stop };
}

export default function Stories() {
  const { lang } = useI18n();
  const t = text[lang];
  const [done, setDone] = useState<string[]>(readDone);
  const [open, setOpen] = useState<Story | null>(null);
  const [dictionary, setDictionary] = useState<Map<string, string>>(new Map());

  // The vocabulary list is a fallback for words that are not in a story's glossary.
  useEffect(() => {
    let alive = true;
    import('../../data/words').then(({ words }) => {
      if (alive) setDictionary(new Map(words.map((w) => [w.en.toLowerCase(), w.fa])));
    });
    return () => {
      alive = false;
    };
  }, []);

  const finish = (story: Story) => {
    awardSticker('story-read');
    if (done.includes(story.id)) return;
    const next = [...done, story.id];
    kidStorage.setItem(DONE_KEY, JSON.stringify(next));
    setDone(next);
  };

  if (open)
    return (
      <StoryReader
        key={open.id}
        story={open}
        dictionary={dictionary}
        onClose={() => setOpen(null)}
        onFinish={() => finish(open)}
      />
    );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <div className="text-6xl">📚</div>
        <h3 className="mt-3 text-2xl font-black">{t.title}</h3>
        <p className="mt-2 font-bold text-ink/70">{t.intro}</p>
      </div>
      <ul className="mt-6 grid gap-3">
        {stories.map((story, i) => {
          const isDone = done.includes(story.id);
          return (
            <motion.li
              key={story.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
            >
              <motion.button
                onClick={() => setOpen(story)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-4 rounded-3xl border-4 border-surface bg-surface p-4 text-start shadow-soft transition hover:border-grape-100"
              >
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun-100 text-4xl">
                  {story.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span dir="ltr" className="block font-display text-xl font-bold">
                    {story.title}
                  </span>
                  <span dir="rtl" className="block text-ink/70">
                    {story.fa}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-grape-100 px-2 py-0.5 text-grape-600">{t.level(story.level)}</span>
                    <span className="text-ink/60">{t.pages(story.pages.length)}</span>
                  </span>
                </span>
                {isDone && (
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-500 text-white"
                    title={t.read}
                    aria-label={t.read}
                  >
                    <Check className="size-6" strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function StoryReader({
  story,
  dictionary,
  onClose,
  onFinish,
}: {
  story: Story;
  dictionary: Map<string, string>;
  onClose: () => void;
  onFinish: () => void;
}) {
  const { lang } = useI18n();
  const t = text[lang];
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<'read' | 'quiz' | 'end'>('read');
  const [speed, setSpeed] = useState<Speed>('normal');
  const [popover, setPopover] = useState<Popover | null>(null);
  const [score, setScore] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const { active, reading, read, stop } = useReadAloud();

  const current = story.pages[page];
  const { words, segments } = useMemo(() => split(current.text), [current]);
  const last = page === story.pages.length - 1;

  const glossary = useMemo(() => new Map(story.glossary.map((g) => [g.en.toLowerCase(), g.fa])), [story]);
  const meaning = (word: string) => {
    const w = word.toLowerCase();
    const bare = w.replace(/'s$/, '');
    return glossary.get(w) ?? glossary.get(bare) ?? dictionary.get(w) ?? dictionary.get(bare) ?? '';
  };

  const goTo = (p: number) => {
    stop();
    setPopover(null);
    setPage(p);
  };

  const toggleRead = () => {
    setPopover(null);
    if (reading) stop();
    else read(current.text, words, RATES[speed]);
  };

  const changeSpeed = (s: Speed) => {
    setSpeed(s);
    if (reading) read(current.text, words, RATES[s]);
  };

  const tapWord = (e: MouseEvent<HTMLButtonElement>, index: number) => {
    e.stopPropagation();
    stop();
    const word = words[index].text;
    speak(word);
    if (popover?.index === index) {
      setPopover(null);
      return;
    }
    const container = box.current!.getBoundingClientRect();
    const target = e.currentTarget.getBoundingClientRect();
    const width = Math.min(208, container.width - 16);
    const center = target.left + target.width / 2 - container.left;
    setPopover({
      index,
      en: word,
      fa: meaning(word),
      left: Math.max(8, Math.min(container.width - width - 8, center - width / 2)),
      width,
      top: target.bottom - container.top + 8,
    });
  };

  const card = 'mx-auto max-w-2xl rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-8';
  const primaryBtn =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-grape-500 px-6 py-2.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5';
  const ghostBtn =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink/10 px-5 py-2.5 font-bold transition hover:border-grape-500 disabled:opacity-30';

  const header = (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() => {
          stop();
          onClose();
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-grape-50 px-4 py-2 text-sm font-bold text-grape-600 transition hover:bg-grape-100"
      >
        <List className="size-4" />
        {t.back}
      </button>
      <span dir="ltr" className="truncate font-display text-lg font-bold">
        {story.emoji} {story.title}
      </span>
    </div>
  );

  if (mode === 'quiz')
    return (
      <div className={card}>
        {header}
        <Quiz
          story={story}
          onDone={(firstTry) => {
            onFinish();
            setScore(firstTry);
            setMode('end');
          }}
        />
      </div>
    );

  if (mode === 'end')
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={card}>
        {header}
        <div className="mt-6 text-center">
          <motion.div
            className="text-7xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
          >
            📖
          </motion.div>
          <p className="mt-3 text-2xl font-black text-leaf-700">{t.doneTitle}</p>
          <p className="mt-2 font-bold text-ink/70">{t.firstTry(score, story.questions.length)}</p>
        </div>
        <p className="mt-6 text-sm font-bold text-ink/60">{t.words}</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {story.glossary.map((g) => (
            <li key={g.en}>
              <button
                onClick={() => speak(g.en)}
                className="flex w-full items-center justify-between gap-2 rounded-2xl bg-leaf-50 px-3 py-2 text-start transition hover:bg-leaf-100"
              >
                <span className="min-w-0">
                  <span dir="ltr" className="block font-display font-bold text-leaf-700">
                    {g.en}
                  </span>
                  <span dir="rtl" className="block text-sm text-ink/70">
                    {g.fa}
                  </span>
                </span>
                <Volume2 className="size-4 shrink-0 text-grape-600" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setPage(0);
              setMode('read');
            }}
            className={primaryBtn}
          >
            <RotateCcw className="size-4" />
            {t.readAgain}
          </button>
          <button onClick={onClose} className={ghostBtn}>
            <List className="size-4" />
            {t.back}
          </button>
        </div>
      </motion.div>
    );

  return (
    <div className={card}>
      {header}
      <div className="mt-3 flex items-center gap-1.5" aria-label={t.page(page + 1, story.pages.length)}>
        {story.pages.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-full transition ${i <= page ? 'bg-leaf-500' : 'bg-leaf-100'}`}
          />
        ))}
      </div>

      <div ref={box} className="relative" onClick={() => setPopover(null)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="py-4 text-center"
          >
            <motion.div
              className="text-7xl sm:text-8xl"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              {current.emoji}
            </motion.div>
            <p dir="ltr" className="mt-5 font-display text-2xl leading-[2.4] font-bold sm:text-3xl sm:leading-[2.4]">
              {segments.map((s, i) =>
                s.word === null ? (
                  <span key={i}>{s.text}</span>
                ) : (
                  <button
                    key={i}
                    onClick={(e) => tapWord(e, s.word!)}
                    className={`rounded-lg px-0.5 transition-colors ${
                      s.word === active
                        ? 'bg-sun-400 text-night'
                        : popover?.index === s.word
                          ? 'bg-grape-100 text-grape-600'
                          : 'hover:bg-grape-50'
                    }`}
                  >
                    {s.text}
                  </button>
                ),
              )}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {popover && (
            <motion.div
              key={popover.index}
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: popover.left,
                top: popover.top,
                width: popover.width,
              }}
              className="absolute z-10 rounded-2xl border-4 border-surface bg-grape-50 p-3 text-center shadow-soft"
            >
              <button
                onClick={() => setPopover(null)}
                aria-label={t.close}
                className="absolute end-1 top-1 grid size-7 place-items-center rounded-full text-ink/50 hover:bg-ink/5"
              >
                <X className="size-4" />
              </button>
              <p dir="ltr" className="font-display text-2xl font-bold text-grape-600">
                {popover.en}
              </p>
              {popover.fa && (
                <p dir="rtl" className="mt-1 text-lg font-bold">
                  {popover.fa}
                </p>
              )}
              {canSpeak && (
                <button
                  onClick={() => speak(popover.en)}
                  className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sun-500 px-3 py-1 text-sm font-bold text-night"
                >
                  <Volume2 className="size-4" />
                  {t.say}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-sm text-ink/60">{canSpeak ? t.tapHint : t.noSpeech}</p>

      {canSpeak && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={toggleRead}
            className={`inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-2.5 font-bold shadow-soft transition hover:scale-105 ${
              reading ? 'bg-berry-500 text-white' : 'bg-sun-500 text-night'
            }`}
          >
            {reading ? <CircleStop className="size-5" /> : <Volume2 className="size-5" />}
            {reading ? t.stop : t.readToMe}
          </button>
          <div role="group" aria-label={t.speed} className="inline-flex rounded-full bg-ink/5 p-1">
            {(['slow', 'normal'] as const).map((s) => {
              const Icon = s === 'slow' ? Snail : Rabbit;
              return (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  aria-pressed={speed === s}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition ${
                    speed === s ? 'bg-surface text-grape-600 shadow-sm' : 'text-ink/60'
                  }`}
                >
                  <Icon className="size-4" />
                  {t[s]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button onClick={() => goTo(page - 1)} disabled={page === 0} className={ghostBtn}>
          <ChevronLeft className="size-5 rtl:-scale-x-100" />
          {t.prev}
        </button>
        <span className="text-sm font-bold text-ink/60">{t.page(page + 1, story.pages.length)}</span>
        {last ? (
          <button
            onClick={() => {
              stop();
              setPopover(null);
              setMode('quiz');
            }}
            className={primaryBtn}
          >
            <BookOpen className="size-5" />
            <span className="hidden sm:inline">{t.toQuestions}</span>
            <span className="sm:hidden">{t.next}</span>
          </button>
        ) : (
          <button onClick={() => goTo(page + 1)} className={primaryBtn}>
            {t.next}
            <ChevronRight className="size-5 rtl:-scale-x-100" />
          </button>
        )}
      </div>
    </div>
  );
}

function Quiz({ story, onDone }: { story: Story; onDone: (firstTry: number) => void }) {
  const { lang } = useI18n();
  const t = text[lang];
  const questions = useMemo(() => story.questions.map((q) => ({ ...q, options: shuffle(q.options) })), [story]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const q = questions[index];

  const choose = (o: string) => {
    if (solved || wrong.includes(o)) return;
    if (o === q.answer) {
      setSolved(true);
      if (wrong.length === 0) setFirstTry((n) => n + 1);
      speak(o);
    } else setWrong([...wrong, o]);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setWrong([]);
      setSolved(false);
    } else onDone(firstTry);
  };

  return (
    <div className="mt-5">
      <p className="text-center text-sm font-bold text-ink/60">
        {t.questions} · {t.question(index + 1, questions.length)}
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => speak(q.q)}
            dir="ltr"
            className="mx-auto mt-4 flex items-center justify-center gap-3 text-center font-display text-2xl font-bold sm:text-3xl"
          >
            {q.q}
            {canSpeak && <Volume2 className="size-6 shrink-0 text-grape-500" />}
          </button>
          <div className="mt-6 grid gap-3">
            {q.options.map((o) => {
              const isWrong = wrong.includes(o);
              const isRight = solved && o === q.answer;
              return (
                <motion.button
                  key={o}
                  onClick={() => choose(o)}
                  disabled={solved || isWrong}
                  whileTap={solved || isWrong ? undefined : { scale: 0.97 }}
                  animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
                  dir="ltr"
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-display text-xl font-bold transition ${
                    isRight
                      ? 'border-leaf-500 bg-leaf-100 text-leaf-700'
                      : isWrong
                        ? 'border-berry-500 bg-berry-100 text-berry-500 opacity-70'
                        : solved
                          ? 'border-ink/10 bg-cream opacity-50'
                          : 'border-ink/10 bg-cream hover:border-grape-500'
                  }`}
                >
                  {isRight && <Check className="size-5" />}
                  {isWrong && <X className="size-5" />}
                  {o}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-5 flex min-h-12 flex-wrap items-center justify-between gap-3">
            <p className={`font-bold ${solved ? 'text-leaf-700' : 'text-berry-500'}`} role="status">
              {solved ? t.right : wrong.length > 0 ? t.tryAgain : ''}
            </p>
            {solved && (
              <button
                onClick={next}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-grape-500 px-6 py-2.5 font-bold text-white shadow-soft transition hover:-translate-y-0.5"
              >
                {index + 1 < questions.length ? t.nextQuestion : t.finish}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
