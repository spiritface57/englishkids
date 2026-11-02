import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Ear, Lightbulb, Loader2, Mic, RotateCcw, ShieldCheck, ThumbsUp, Volume2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { awardSticker, bump } from '../../progress';
import { canSpeak, shuffle, speak } from '../wordGame';

// "Say it!": the child sees a word, listens to it and says it into the microphone. The browser's speech
// recognition (Web Speech API) turns the voice into text and we compare it with the word.
// Without speech recognition (Firefox, some iPhones) a parent listens and judges instead.

type Item = { en: string; fa: string; e: string; vs?: string };
type Group = { key: string; title: string; tip: { fa: string; en: string }; items: Item[] };
type SetKey = 'everyday' | 'tricky';
type Stars = 1 | 2 | 3;
type Result = { stars: Stars; heard: string };
type Problem = 'denied' | 'noSpeech' | 'noMic' | 'network' | 'other';

// Sounds that are hard for Persian speakers.
const groups: Group[] = [
  {
    key: 'th',
    title: 'th',
    tip: {
      fa: 'نوک زبان را کمی بین دندان‌ها بگذار و آرام هوا را بیرون بده. th را «ت»، «س»، «د» یا «ز» نگو.',
      en: 'Put the tip of your tongue lightly between your teeth and blow. Don’t say it as t, s, d or z.',
    },
    items: [
      { en: 'three', fa: 'سه', e: '3️⃣' },
      { en: 'thumb', fa: 'انگشت شست', e: '👍' },
      { en: 'mother', fa: 'مادر', e: '👩' },
      { en: 'father', fa: 'پدر', e: '👨' },
      { en: 'teeth', fa: 'دندان‌ها', e: '🦷' },
      { en: 'bath', fa: 'حمام کردن', e: '🛁' },
    ],
  },
  {
    key: 'wv',
    title: 'w / v',
    tip: {
      fa: 'برای w لب‌ها را گرد کن، مثل وقتی می‌خواهی سوت بزنی؛ دندان به لب نمی‌خورد. برای v دندان‌های بالا آرام روی لب پایین می‌نشیند.',
      en: 'For w, make your lips round like a whistle; teeth don’t touch the lip. For v, top teeth rest gently on the bottom lip.',
    },
    items: [
      { en: 'water', fa: 'آب', e: '💧' },
      { en: 'window', fa: 'پنجره', e: '🪟' },
      { en: 'wolf', fa: 'گرگ', e: '🐺' },
      { en: 'van', fa: 'ون', e: '🚐' },
      { en: 'vegetable', fa: 'سبزیجات', e: '🥦' },
      { en: 'violin', fa: 'ویولن', e: '🎻' },
    ],
  },
  {
    key: 's',
    title: 's + …',
    tip: {
      fa: 'ما فارسی‌زبان‌ها معمولاً اول این کلمه‌ها یک «اِ» اضافه می‌کنیم (اِسکول). مستقیم با «سسس» شروع کن: sss-chool.',
      en: 'Persian speakers often add an “e” before these words (“eschool”). Start straight with “sss”: sss-chool.',
    },
    items: [
      { en: 'school', fa: 'مدرسه', e: '🏫' },
      { en: 'star', fa: 'ستاره', e: '⭐' },
      { en: 'snake', fa: 'مار', e: '🐍' },
      { en: 'spoon', fa: 'قاشق', e: '🥄' },
      { en: 'sky', fa: 'آسمان', e: '🌤️' },
      { en: 'smile', fa: 'لبخند', e: '😊' },
    ],
  },
  {
    key: 'iee',
    title: 'i / ee',
    tip: {
      fa: 'i کوتاه و شُل است (ship)، ee کشیده و با لبخند (sheep). اگر جابه‌جا بگویی، معنی کلمه عوض می‌شود!',
      en: 'Short i is quick and relaxed (ship); long ee is longer, with a smile (sheep). Mixing them changes the meaning!',
    },
    items: [
      { en: 'ship', fa: 'کشتی', e: '🚢', vs: 'sheep' },
      { en: 'sheep', fa: 'گوسفند', e: '🐑', vs: 'ship' },
      { en: 'sit', fa: 'نشستن', e: '🪑', vs: 'seat' },
      { en: 'seat', fa: 'صندلی (جای نشستن)', e: '💺', vs: 'sit' },
      { en: 'fill', fa: 'پر کردن', e: '🫗', vs: 'feel' },
      { en: 'feel', fa: 'احساس کردن', e: '🤗', vs: 'fill' },
    ],
  },
  {
    key: 'end',
    title: '-lk -sk -nd -st',
    tip: {
      fa: 'صدای آخر کلمه را نخور و بین صامت‌ها «اِ» اضافه نکن: milk نه «میلکِ»، hand نه «هَن».',
      en: 'Say the last sounds clearly and don’t add a vowel between them: “milk”, not “milke”; “hand”, not “han”.',
    },
    items: [
      { en: 'milk', fa: 'شیر', e: '🥛' },
      { en: 'desk', fa: 'میز تحریر', e: '' },
      { en: 'hand', fa: 'دست', e: '✋' },
      { en: 'fast', fa: 'سریع', e: '🏃' },
    ],
  },
];

const ROUND = 10;

const text = {
  fa: {
    intro: 'کلمه را ببین، گوش کن و بعد بلند بگو. ستاره جمع کن!',
    everyday: 'کلمه‌های روزمره',
    everydayHint: 'کلمه‌های ساده با تصویر',
    tricky: 'صداهای سخت برای ما',
    trickyHint: 'صداهایی که فارسی‌زبان‌ها معمولاً اشتباه می‌گویند',
    allGroups: 'همه',
    tip: 'نکته',
    listen: 'گوش کن',
    pressAndSay: 'دکمه را بزن و کلمه را بگو',
    listening: 'دارم گوش می‌دهم… بگو!',
    start: 'شروع',
    heard: 'شنیدم:',
    nothingHeard: 'چیزی نشنیدم',
    perfect: 'عالی! درست گفتی 🎉',
    almost: 'خیلی نزدیک بود! یک بار دیگر گوش کن',
    tryAgain: 'دوباره امتحان کن. گوش کن و تکرار کن',
    again: 'دوباره بگو',
    next: 'کلمه‌ی بعدی',
    finish: 'تمام',
    word: (n: number, total: number) => `کلمه‌ی ${n.toLocaleString('fa')} از ${total.toLocaleString('fa')}`,
    starsTotal: (n: number) => `${n.toLocaleString('fa')} ستاره`,
    result: (n: number, total: number) => `${n.toLocaleString('fa')} ستاره از ${total.toLocaleString('fa')}`,
    resultGreat: 'آفرین! تلفظت عالی است 🌟',
    resultGood: 'خیلی خوب بود! با تمرین بهتر هم می‌شود.',
    resultKeep: 'شروع خوبی بود! باز هم تمرین کنیم.',
    playAgain: 'دوباره بازی کن',
    changeSet: 'انتخاب تمرین دیگر',
    compare: 'مقایسه کن:',
    unsupported:
      'این مرورگر نمی‌تواند صدا را به نوشته تبدیل کند (مثلاً فایرفاکس و بعضی آیفون‌ها). اشکالی ندارد! در حالت «گوش کن و تکرار کن» بچه گوش می‌دهد و تکرار می‌کند و شما قضاوت می‌کنید. برای تشخیص خودکار، Chrome یا Edge را امتحان کنید.',
    fallbackHint: 'گوش کن، بلند تکرار کن؛ بعد پدر یا مادر دکمه‌ی مناسب را بزند.',
    saidWell: 'خوب گفت',
    sayAgain: 'دوباره',
    useFallback: 'حالت «گوش کن و تکرار کن»',
    useMic: 'برگشت به میکروفون',
    problems: {
      denied:
        'اجازه‌ی استفاده از میکروفون داده نشده. از نماد قفل کنار آدرس سایت، میکروفون را مجاز کنید و دوباره امتحان کنید.',
      noSpeech: 'صدایی نشنیدم. کمی بلندتر و نزدیک‌تر به گوشی بگو.',
      noMic: 'میکروفونی پیدا نشد. مطمئن شوید میکروفون وصل است.',
      network: 'تشخیص صدا در این مرورگر به اینترنت نیاز دارد. اتصال را بررسی کنید.',
      other: 'مشکلی پیش آمد. دوباره امتحان کن.',
    } satisfies Record<Problem, string>,
    privacy:
      'تشخیص گفتار را خود مرورگر انجام می‌دهد؛ در Chrome صدا برای پردازش به سرویس گفتار گوگل فرستاده می‌شود. این سایت هیچ صدایی ذخیره نمی‌کند.',
  },
  en: {
    intro: 'Look at the word, listen, then say it out loud. Collect stars!',
    everyday: 'Everyday words',
    everydayHint: 'Simple words with pictures',
    tricky: 'Tricky sounds',
    trickyHint: 'Sounds Persian speakers often find hard',
    allGroups: 'All',
    tip: 'Tip',
    listen: 'Listen',
    pressAndSay: 'Press the button and say the word',
    listening: 'Listening… say it!',
    start: 'Start',
    heard: 'I heard:',
    nothingHeard: 'I didn’t hear anything',
    perfect: 'Perfect! 🎉',
    almost: 'Almost! Listen again',
    tryAgain: 'Try again: listen and repeat',
    again: 'Say it again',
    next: 'Next word',
    finish: 'Finish',
    word: (n: number, total: number) => `Word ${n} of ${total}`,
    starsTotal: (n: number) => `${n} stars`,
    result: (n: number, total: number) => `${n} of ${total} stars`,
    resultGreat: 'Wonderful! Your pronunciation is great 🌟',
    resultGood: 'Very good! Practice makes it even better.',
    resultKeep: 'Good start! Let’s practise some more.',
    playAgain: 'Play again',
    changeSet: 'Choose another practice',
    compare: 'Compare:',
    unsupported:
      'This browser can’t turn speech into text (e.g. Firefox and some iPhones). No problem! In “Listen & repeat” mode your child listens and repeats, and you decide how it went. For automatic checking, try Chrome or Edge.',
    fallbackHint: 'Listen and repeat out loud; then a parent taps the right button.',
    saidWell: 'Said it well',
    sayAgain: 'Try again',
    useFallback: '“Listen & repeat” mode',
    useMic: 'Back to the microphone',
    problems: {
      denied: 'Microphone access is blocked. Allow the microphone via the lock icon next to the address and try again.',
      noSpeech: 'I didn’t hear anything. Say it a bit louder and closer to the device.',
      noMic: 'No microphone found. Make sure one is connected.',
      network: 'Speech recognition in this browser needs the internet. Please check your connection.',
      other: 'Something went wrong. Please try again.',
    } satisfies Record<Problem, string>,
    privacy:
      'Speech recognition is done by your browser; in Chrome the audio is processed by Google’s speech service. This site saves no audio.',
  },
};

// Minimal Web Speech API types (not in TypeScript's DOM lib).
type RecAlternative = { transcript: string };
type RecEvent = { results: ArrayLike<ArrayLike<RecAlternative>> };
type Recognition = {
  lang: string;
  maxAlternatives: number;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

const Recognizer: RecognitionCtor | undefined =
  typeof window === 'undefined'
    ? undefined
    : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition);

// Recognisers often write numbers as digits ("3" for "three").
const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b(10|[0-9])\b/g, (d) => digits[Number(d)])
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const distance = (a: string, b: string) => {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
};

const score = (word: string, alternatives: string[]): Stars => {
  const target = normalise(word);
  const alts = alternatives.map(normalise).filter(Boolean);
  if (alts.some((a) => a === target)) return 3;
  if (alts.some((a) => a.includes(target) || distance(a, target) <= 1)) return 2;
  return 1;
};

// Slower than the shared speak(), so a child who missed can hear each sound.
const speakSlowly = (word: string) => {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.6;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
};

const problemOf = (error: string): Problem | null => {
  if (error === 'aborted') return null;
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'denied';
  if (error === 'no-speech') return 'noSpeech';
  if (error === 'audio-capture') return 'noMic';
  if (error === 'network') return 'network';
  return 'other';
};

const recordStar = () => {
  const n = bump('speak-correct');
  if (n === 1) awardSticker('speak-first');
  if (n >= 10) awardSticker('speak-star');
};

export default function SpeakPractice() {
  const { lang } = useI18n();
  const s = text[lang];
  const [phase, setPhase] = useState<'menu' | 'playing' | 'done'>('menu');
  const [setKey, setSetKey] = useState<SetKey>('everyday');
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [best, setBest] = useState<Stars[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening'>('idle');
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(!Recognizer);
  const recRef = useRef<Recognition | null>(null);

  const item = items[index];
  const group = groups.find((g) => g.items.includes(item)) ?? null;

  useEffect(() => () => recRef.current?.abort(), []);

  const start = async (key: SetKey, gKey: string | null = null) => {
    let list: Item[];
    if (key === 'tricky') {
      list = gKey ? groups.find((g) => g.key === gKey)!.items : shuffle(groups.flatMap((g) => g.items)).slice(0, ROUND);
    } else {
      setLoading(true);
      const { words } = await import('../../data/words');
      setLoading(false);
      // Short, simple words with their own picture.
      const pool = words.filter((w) => w.e && /^[a-z]{2,9}$/i.test(w.en));
      list = shuffle(pool)
        .slice(0, ROUND)
        .map((w) => ({ en: w.en, fa: w.fa, e: w.e }));
    }
    setSetKey(key);
    setGroupKey(gKey);
    setItems(list);
    setIndex(0);
    setBest([]);
    setResult(null);
    setProblem(null);
    setPhase('playing');
  };

  const keepBest = (stars: Stars) =>
    setBest((b) => {
      const copy = [...b];
      copy[index] = Math.max(copy[index] ?? 0, stars) as Stars;
      return copy;
    });

  const judge = (alternatives: string[]) => {
    const stars = score(item.en, alternatives);
    setResult({ stars, heard: alternatives[0] ?? '' });
    keepBest(stars);
    if (stars === 3) recordStar();
    else speakSlowly(item.en);
  };

  const listen = () => {
    if (!Recognizer || status === 'listening') return;
    if (canSpeak) window.speechSynthesis.cancel();
    setProblem(null);
    setResult(null);
    const rec = new Recognizer();
    rec.lang = 'en-US';
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    let got = false;
    let failed = false;
    rec.onresult = (e) => {
      got = true;
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      judge(alts);
    };
    rec.onerror = (e) => {
      failed = true;
      const p = problemOf(e.error);
      if (p) setProblem(p);
    };
    rec.onend = () => {
      setStatus('idle');
      if (recRef.current === rec) recRef.current = null;
      if (!got && !failed) setProblem('noSpeech');
    };
    recRef.current = rec;
    try {
      rec.start();
      setStatus('listening');
    } catch {
      setProblem('other');
    }
  };

  // Listen & repeat mode: a parent decides.
  const parentSays = (good: boolean) => {
    if (good) {
      setResult({ stars: 3, heard: '' });
      keepBest(3);
      recordStar();
    } else {
      setResult({ stars: 1, heard: '' });
      keepBest(1);
      speakSlowly(item.en);
    }
  };

  const next = () => {
    recRef.current?.abort();
    setResult(null);
    setProblem(null);
    if (index + 1 < items.length) setIndex(index + 1);
    else setPhase('done');
  };

  const card = 'mx-auto max-w-2xl rounded-[2rem] border-4 border-surface bg-surface p-5 shadow-soft sm:p-8';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-full bg-grape-500 font-bold text-white shadow-soft transition hover:-translate-y-0.5';
  const secondaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink/10 font-bold transition hover:border-grape-500';

  const privacy = Recognizer && !fallback && (
    <p className="mx-auto mt-4 flex max-w-2xl items-start gap-2 text-xs text-ink/50">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      {s.privacy}
    </p>
  );

  const modeSwitch = Recognizer && (
    <button onClick={() => setFallback((f) => !f)} className="text-sm font-bold text-grape-600 underline">
      {fallback ? s.useMic : s.useFallback}
    </button>
  );

  if (phase === 'menu') {
    const sets = [
      { key: 'everyday' as const, label: s.everyday, hint: s.everydayHint, emoji: '🐶' },
      { key: 'tricky' as const, label: s.tricky, hint: s.trickyHint, emoji: '👅' },
    ];
    return (
      <div>
        <div className={`${card} text-center`}>
          <div className="text-6xl">🎤</div>
          <p className="mt-4 text-lg font-bold">{s.intro}</p>
          {!Recognizer && <p className="mt-4 rounded-2xl bg-sun-50 p-4 text-start text-sm">{s.unsupported}</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sets.map((x) => (
              <button
                key={x.key}
                onClick={() => setSetKey(x.key)}
                aria-pressed={setKey === x.key}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                  setKey === x.key ? 'border-grape-500 bg-grape-50' : 'border-ink/10 hover:border-grape-100'
                }`}
              >
                <span className="text-4xl">{x.emoji}</span>
                <span className="text-lg font-black">{x.label}</span>
                <span className="text-sm text-ink/60">{x.hint}</span>
              </button>
            ))}
          </div>

          {setKey === 'tricky' ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2" dir="ltr">
              {[{ key: null, title: s.allGroups }, ...groups].map((g) => (
                <motion.button
                  key={g.key ?? 'all'}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => start('tricky', g.key)}
                  className="min-h-12 rounded-2xl bg-sun-100 px-4 py-2 font-display text-lg font-bold shadow-sm transition hover:-translate-y-0.5 hover:bg-sun-400"
                >
                  {g.title}
                </motion.button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => start('everyday')}
              disabled={loading}
              className={`mt-6 px-7 py-3 text-lg ${primaryBtn}`}
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
              {s.start}
            </button>
          )}
          <div className="mt-5">{modeSwitch}</div>
        </div>
        {privacy}
      </div>
    );
  }

  if (phase === 'done') {
    const total = best.reduce<number>((sum, x) => sum + (x ?? 0), 0);
    const max = items.length * 3;
    const ratio = total / max;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${card} text-center`}
      >
        <div className="flex justify-center gap-2 text-5xl">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 260, damping: 14 }}
              className={i < Math.round(ratio * 3) ? '' : 'opacity-20 grayscale'}
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <p className="mt-4 font-display text-3xl font-black text-grape-600">{s.result(total, max)}</p>
        <p className="mt-3 text-lg font-bold">
          {ratio >= 0.85 ? s.resultGreat : ratio >= 0.6 ? s.resultGood : s.resultKeep}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => start(setKey, groupKey)} className={`px-7 py-3 ${primaryBtn}`}>
            <RotateCcw className="size-4" />
            {s.playAgain}
          </button>
          <button onClick={() => setPhase('menu')} className={`px-6 py-3 ${secondaryBtn}`}>
            {s.changeSet}
          </button>
        </div>
      </motion.div>
    );
  }

  const listening = status === 'listening';
  const feedback =
    result &&
    {
      3: { label: s.perfect, tone: 'bg-leaf-100 text-leaf-700' },
      2: { label: s.almost, tone: 'bg-sun-100 text-sun-700' },
      1: { label: s.tryAgain, tone: 'bg-berry-100 text-berry-500' },
    }[result.stars];
  const earned = best.reduce<number>((sum, x) => sum + (x ?? 0), 0);

  return (
    <div>
      <div className={card}>
        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <span className="text-ink/60">{s.word(index + 1, items.length)}</span>
          <span className="rounded-full bg-sun-100 px-3 py-1 text-sun-700">⭐ {s.starsTotal(earned)}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-grape-50">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
            animate={{ width: `${((index + (result ? 1 : 0)) / items.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>

        {setKey === 'tricky' && group && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-sun-50 p-3 text-sm">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-sun-700" />
            <p>
              <span className="font-bold">
                {s.tip} (
                <span dir="ltr" className="font-display">
                  {group.title}
                </span>
                ):
              </span>{' '}
              {group.tip[lang]}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="mt-5 flex flex-col items-center text-center"
          >
            {item.e && (
              <motion.span
                className="text-7xl sm:text-8xl"
                animate={result?.stars === 3 ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
              >
                {item.e}
              </motion.span>
            )}
            <span dir="ltr" className="mt-2 font-display text-5xl font-bold text-leaf-700 sm:text-6xl">
              {item.en}
            </span>
            <span dir="rtl" className="mt-1 text-lg text-ink/70">
              {item.fa}
            </span>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => speak(item.en)}
                disabled={!canSpeak}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun-500 px-5 py-2 font-bold text-night shadow-soft transition hover:scale-105 disabled:opacity-40"
              >
                <Volume2 className="size-5" />
                {s.listen}
              </button>
              {item.vs && (
                <span className="inline-flex items-center gap-2 text-sm text-ink/60">
                  {s.compare}
                  <button
                    dir="ltr"
                    onClick={() => speak(`${item.en}. ${item.vs}.`)}
                    className="inline-flex items-center gap-1 rounded-full bg-grape-50 px-3 py-1.5 font-display font-bold text-grape-600 transition hover:bg-grape-100"
                  >
                    {item.en} ↔ {item.vs}
                    <Volume2 className="size-4" />
                  </button>
                </span>
              )}
            </div>

            {fallback ? (
              <div className="mt-6 w-full">
                {!Recognizer && index === 0 && (
                  <p className="rounded-2xl bg-sun-50 p-3 text-start text-sm">{s.unsupported}</p>
                )}
                <p className="mt-3 flex items-center justify-center gap-2 font-bold text-ink/70">
                  <Ear className="size-5" />
                  {s.fallbackHint}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => parentSays(true)}
                    className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-leaf-500 bg-leaf-100 px-3 font-bold text-leaf-700"
                  >
                    <ThumbsUp className="size-5" />
                    {s.saidWell}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => parentSays(false)}
                    className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-berry-500 bg-berry-100 px-3 font-bold text-berry-500"
                  >
                    <RotateCcw className="size-5" />
                    {s.sayAgain}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center">
                <div className="relative grid size-32 place-items-center">
                  {listening &&
                    [0, 1].map((i) => (
                      <motion.span
                        key={i}
                        className="absolute inset-0 rounded-full bg-berry-500/30"
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
                      />
                    ))}
                  <motion.button
                    onClick={listening ? () => recRef.current?.abort() : listen}
                    whileTap={{ scale: 0.92 }}
                    animate={listening ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={listening ? { duration: 0.8, repeat: Infinity } : { type: 'spring' }}
                    aria-label={s.pressAndSay}
                    className={`relative grid size-28 place-items-center rounded-full text-white shadow-soft transition ${
                      listening ? 'bg-berry-500' : 'bg-grape-500 hover:bg-grape-600'
                    }`}
                  >
                    <Mic className="size-12" />
                  </motion.button>
                </div>
                <p className="mt-3 font-bold text-ink/70" role="status">
                  {listening ? s.listening : s.pressAndSay}
                </p>
              </div>
            )}

            <div className="mt-5 min-h-12 w-full" aria-live="polite">
              {problem && !listening && (
                <p className="rounded-2xl bg-berry-100 p-3 text-sm font-bold text-berry-500">{s.problems[problem]}</p>
              )}
              {problem === 'denied' && !fallback && <div className="mt-2">{modeSwitch}</div>}
              {feedback && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={`rounded-2xl p-4 ${feedback.tone}`}
                >
                  <div className="flex justify-center gap-1 text-3xl" aria-label={`${result.stars}/3`}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 12 }}
                        className={i < result.stars ? '' : 'opacity-20 grayscale'}
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                  <p className="mt-2 text-lg font-black">{feedback.label}</p>
                  {!fallback && (
                    <p className="mt-1 text-sm">
                      {s.heard}{' '}
                      {result.heard ? (
                        <span dir="ltr" className="font-display font-bold">
                          “{result.heard.trim()}”
                        </span>
                      ) : (
                        s.nothingHeard
                      )}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {(result || problem) && !listening && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {!fallback && (
                  <button onClick={listen} className={`px-5 py-2.5 ${secondaryBtn}`}>
                    <Mic className="size-4" />
                    {s.again}
                  </button>
                )}
                {(result || problem) && (
                  <button onClick={next} className={`px-6 py-2.5 ${primaryBtn}`}>
                    {index + 1 < items.length ? s.next : s.finish}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 text-center">{modeSwitch}</div>
      </div>
      {privacy}
    </div>
  );
}
