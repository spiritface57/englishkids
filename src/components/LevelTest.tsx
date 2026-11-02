import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Headphones, Loader2, RotateCcw, ShieldCheck, Sparkles, Volume2, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { links } from '../content';
import type { Word } from '../data/words';
import { awardSticker } from '../progress';
import { Reveal, Section, SectionHeading, WhatsAppIcon } from './ui';
import { canSpeak, shuffle, speak } from './wordGame';

// Placement test for parents: 12 questions on a three-step ladder (Starter → Explorer → Champion).
// It starts in the middle; a right answer moves one step up, a wrong one one step down.
// The level is where the child settled: the average step after the last 6 answers.

type Band = 0 | 1 | 2;
type Kind = 'picture' | 'listen' | 'meaning' | 'grammar';
type Skill = 'vocab' | 'listening' | 'grammar';
type Age = '5-6' | '7-8' | '9-10' | '11+';
type GrammarItem = { s: string; e?: string; o: string[]; a: string };
type Question = { kind: Kind; band: Band; word?: Word; item?: GrammarItem; options: string[]; answer: string };
type Answer = { band: Band; skill: Skill; right: boolean };

const TOTAL = 12;
const ages: Age[] = ['5-6', '7-8', '9-10', '11+'];
const bandEmoji = ['🌱', '🧭', '🏆'];
const skillOf: Record<Kind, Skill> = { picture: 'vocab', meaning: 'vocab', listen: 'listening', grammar: 'grammar' };

// Question types in order; listening turns into vocabulary when the browser can't speak.
const plan: Kind[] = [
  'picture',
  'grammar',
  'listen',
  'meaning',
  'grammar',
  'picture',
  'listen',
  'meaning',
  'grammar',
  'listen',
  'meaning',
  'grammar',
];

// Hand-picked words per band. Picture words are concrete things whose emoji is unmistakable.
const pictureWords: string[][] = [
  'cat dog fish bird apple banana egg milk book car sun moon star tree house bed cake baby duck cow horse bread door'.split(
    ' ',
  ),
  'rabbit monkey lion turtle frog carrot orange cheese pizza pencil umbrella bicycle rainbow mountain cloud spoon window elephant hospital'.split(
    ' ',
  ),
  'giraffe dolphin octopus penguin volcano island desert planet rocket telescope magnet microscope butterfly strawberry pineapple sandwich astronaut museum bridge thermometer'.split(
    ' ',
  ),
];
const extraWords: string[][] = [
  'mother ball bag red happy sad big small eye hand nose water rain pen'.split(' '),
  'kitchen jacket river library family brother sister hungry tired angry run jump swim sleep write teacher doctor'.split(
    ' ',
  ),
  'dictionary thunder ocean weather invent explore brave curious proud nervous surprised dangerous delicious quiet ancient energy'.split(
    ' ',
  ),
];

const grammar: GrammarItem[][] = [
  [
    { s: 'This is ___ apple.', e: '🍎', o: ['a', 'an'], a: 'an' },
    { s: 'I ___ happy.', e: '😀', o: ['am', 'is', 'are'], a: 'am' },
    { s: 'I have two ___.', e: '🐕🐕', o: ['dog', 'dogs'], a: 'dogs' },
    { s: 'We ___ friends.', e: '🧒🧒', o: ['is', 'am', 'are'], a: 'are' },
    { s: 'The sun is ___.', e: '☀️', o: ['yellow', 'blue', 'green'], a: 'yellow' },
    { s: '___ is a cat.', e: '🐈', o: ['It', 'They', 'We'], a: 'It' },
  ],
  [
    { s: 'She ___ to school every day.', e: '🏫', o: ['go', 'goes', 'going'], a: 'goes' },
    { s: 'There ___ three books on the table.', e: '📚', o: ['is', 'are', 'am'], a: 'are' },
    { s: 'He ___ like carrots.', e: '🥕', o: ["don't", "doesn't", "isn't"], a: "doesn't" },
    { s: 'Look! The baby ___ sleeping.', e: '👶', o: ['is', 'are', 'am'], a: 'is' },
    { s: '___ you swim? Yes, I can.', e: '🏊', o: ['Can', 'Do', 'Are'], a: 'Can' },
    { s: 'This is ___ bag.', e: '🎒', o: ['my', 'me', 'I'], a: 'my' },
  ],
  [
    { s: 'Yesterday we ___ to the park.', e: '🌳', o: ['go', 'went', 'gone'], a: 'went' },
    { s: 'An elephant is ___ than a dog.', e: '🐘', o: ['big', 'bigger', 'biggest'], a: 'bigger' },
    { s: 'The cat is hiding ___ the bed.', e: '🛏️', o: ['under', 'at', 'of'], a: 'under' },
    { s: 'This is the ___ day of my life!', e: '🎉', o: ['good', 'better', 'best'], a: 'best' },
    { s: "I didn't ___ my homework last night.", e: '📝', o: ['do', 'did', 'done'], a: 'do' },
    { s: 'If it rains, we ___ stay at home.', e: '🌧️', o: ['will', 'would', 'was'], a: 'will' },
    { s: 'She has lived here ___ 2020.', e: '🏠', o: ['since', 'for', 'ago'], a: 'since' },
  ],
];

const text = {
  fa: {
    eyebrow: 'برای پدر و مادرها',
    title: 'انگلیسی فرزندم در چه سطحی است؟',
    lead: 'یک آزمون تعیین سطح رایگان و بازی‌گونه، فقط حدود ۳ دقیقه. کنار فرزندتان بنشینید و بگذارید خودش جواب بدهد.',
    points: [
      '۱۲ سؤال کوتاه با تصویر، صدا و جمله',
      'جواب درست، سؤال بعدی کمی سخت‌تر؛ جواب نادرست، کمی آسان‌تر',
      'بدون ثبت‌نام؛ هیچ اطلاعاتی جایی فرستاده نمی‌شود',
    ],
    ageLabel: 'سن فرزندتان (اختیاری)',
    ages: { '5-6': '۵ تا ۶ سال', '7-8': '۷ تا ۸ سال', '9-10': '۹ تا ۱۰ سال', '11+': '۱۱ سال به بالا' } as Record<
      Age,
      string
    >,
    start: 'شروع آزمون',
    loading: 'در حال آماده‌سازی…',
    kidTip: 'اشکالی ندارد اگر جوابی را ندانی؛ فقط بهترین حدست را بزن! 😊',
    question: (n: string, total: string) => `سؤال ${n} از ${total}`,
    prompts: {
      picture: 'این چیست؟ اسم انگلیسی‌اش را انتخاب کن.',
      listen: 'خوب گوش کن! کدام کلمه را شنیدی؟',
      meaning: 'معنی این کلمه چیست؟',
      grammar: 'کدام کلمه جای خالی را درست پر می‌کند؟',
    } as Record<Kind, string>,
    replay: 'دوباره گوش بده',
    right: ['آفرین! 🎉', 'عالی بود! ⭐', 'درسته! 👏', 'باریکلا! 🌟'],
    wrong: ['اشکالی ندارد! 💪', 'تلاش خوبی بود! 🌈', 'بریم سراغ بعدی! 🚀'],
    bands: ['نوآموز', 'کاوشگر', 'قهرمان'],
    resultTitle: 'سطح تخمینی فرزندتان',
    score: (r: string, total: string) => `${r} جواب درست از ${total}`,
    about: [
      'فرزندتان در حال آشنا شدن با کلمه‌های ساده و پرکاربرد مثل حیوان‌ها، رنگ‌ها و خوراکی‌هاست. قدم بعدی: بیشتر کردن کلمه‌ها با بازی، آهنگ و قصه، و گفتن جمله‌های خیلی کوتاه.',
      'فرزندتان کلمه‌های روزمره‌ی زیادی می‌شناسد و جمله‌های ساده را می‌فهمد. قدم بعدی: ساختن جمله‌های کامل‌تر، تمرین زمان حال ساده، و تقویت شنیدن و صحبت کردن.',
      'فرزندتان دایره‌ی لغات خوبی دارد و با گرامر پایه مثل زمان گذشته و مقایسه آشناست. قدم بعدی: خواندن قصه‌های کوتاه، نوشتن، و صحبت کردن روان‌تر در گفت‌وگوهای واقعی.',
    ],
    skillsTitle: 'مهارت‌ها',
    skills: { vocab: 'واژگان', listening: 'شنیدن', grammar: 'گرامر و جمله' } as Record<Skill, string>,
    skillLevels: ['در شروع راه', 'در حال رشد', 'قوی'],
    notTested: 'سنجیده نشد',
    focus: (s: string) => `بیشترین جای پیشرفت: ${s}`,
    ageGood: (a: string) => `برای گروه سنی ${a} عالی است! 👏`,
    ageGentle: 'هر بچه‌ای با سرعت خودش پیش می‌رود؛ با تمرین منظم و بازی، پیشرفت خیلی زود دیده می‌شود.',
    cta: 'رزرو مشاوره‌ی رایگان در واتساپ',
    again: 'انجام دوباره‌ی آزمون',
    disclaimer: 'این آزمون فقط یک تخمین غیررسمی و سرگرم‌کننده است و مدرک یا گواهی رسمی به حساب نمی‌آید.',
    wa: (level: string, age: string | null, score: string) =>
      [
        'سلام خانم لیلا 🌷',
        'فرزندم آزمون تعیین سطح سایت را انجام داد:',
        `• سطح: ${level}`,
        age && `• گروه سنی: ${age}`,
        `• امتیاز: ${score}`,
        'ممنون می‌شوم برای یک جلسه‌ی مشاوره‌ی رایگان راهنمایی‌ام کنید.',
      ]
        .filter(Boolean)
        .join('\n'),
  },
  en: {
    eyebrow: 'For parents',
    title: "How good is my child's English?",
    lead: 'A free, playful level test that takes about 3 minutes. Sit next to your child and let them answer on their own.',
    points: [
      '12 short questions with pictures, sounds and sentences',
      'A right answer makes the next one a bit harder; a wrong one makes it a bit easier',
      'No sign-up; nothing is sent anywhere',
    ],
    ageLabel: "Your child's age (optional)",
    ages: { '5-6': '5–6 years', '7-8': '7–8 years', '9-10': '9–10 years', '11+': '11+ years' } as Record<Age, string>,
    start: 'Start the test',
    loading: 'Getting ready…',
    kidTip: "It's okay not to know an answer, just take your best guess! 😊",
    question: (n: string, total: string) => `Question ${n} of ${total}`,
    prompts: {
      picture: 'What is this? Pick the English word.',
      listen: 'Listen carefully! Which word did you hear?',
      meaning: 'What does this word mean?',
      grammar: 'Which word fills the gap?',
    } as Record<Kind, string>,
    replay: 'Listen again',
    right: ['Well done! 🎉', 'Great job! ⭐', "That's right! 👏", 'Super! 🌟'],
    wrong: ['No worries! 💪', 'Good try! 🌈', "Let's go on! 🚀"],
    bands: ['Starter', 'Explorer', 'Champion'],
    resultTitle: "Your child's estimated level",
    score: (r: string, total: string) => `${r} of ${total} answers right`,
    about: [
      'Your child is getting to know simple, everyday words like animals, colours and food. Next step: grow their vocabulary through games, songs and stories, and start saying very short sentences.',
      'Your child knows many everyday words and understands simple sentences. Next step: build longer sentences, practise the present simple, and strengthen listening and speaking.',
      'Your child has a good vocabulary and knows basic grammar such as the past tense and comparisons. Next step: read short stories, write, and speak more fluently in real conversations.',
    ],
    skillsTitle: 'Skills',
    skills: { vocab: 'Vocabulary', listening: 'Listening', grammar: 'Grammar' } as Record<Skill, string>,
    skillLevels: ['Just starting', 'Growing', 'Strong'],
    notTested: 'Not tested',
    focus: (s: string) => `Most room to grow: ${s}`,
    ageGood: (a: string) => `Great for ${a}! 👏`,
    ageGentle: 'Every child learns at their own pace; with regular practice and play, progress shows up quickly.',
    cta: 'Book a free consultation on WhatsApp',
    again: 'Take the test again',
    disclaimer: 'This is an informal, just-for-fun estimate, not an official certificate or assessment.',
    wa: (level: string, age: string | null, score: string) =>
      [
        'Hello Miss Leila 🌷',
        'My child took the level test on your website:',
        `• Level: ${level}`,
        age && `• Age group: ${age}`,
        `• Score: ${score}`,
        "I'd love to book a free consultation.",
      ]
        .filter(Boolean)
        .join('\n'),
  },
};

// The level we'd usually expect by age, only used for a gentle encouraging note.
const expectedBand: Record<Age, Band> = { '5-6': 0, '7-8': 0, '9-10': 1, '11+': 1 };

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const clampBand = (n: number) => Math.max(0, Math.min(2, n)) as Band;

type Bank = { pictures: Word[][]; all: Word[][] };

function makeBank(words: Word[]): Bank {
  const byEn = new Map(words.map((w) => [w.en.toLowerCase(), w]));
  const lookup = (list: string[]) => list.map((en) => byEn.get(en)).filter((w): w is Word => !!w);
  const pictures = pictureWords.map((list) => lookup(list).filter((w) => w.e));
  return { pictures, all: pictures.map((p, b) => [...p, ...lookup(extraWords[b])]) };
}

function makeQuestion(kind: Kind, band: Band, bank: Bank, usedWords: Set<string>, usedItems: Set<GrammarItem>) {
  if (kind === 'grammar') {
    const item = pick(grammar[band].filter((g) => !usedItems.has(g)));
    usedItems.add(item);
    return { kind, band, item, options: shuffle(item.o), answer: item.a } as Question;
  }
  const source = kind === 'picture' ? bank.pictures[band] : bank.all[band];
  const word = pick(source.filter((w) => !usedWords.has(w.en)));
  usedWords.add(word.en);
  const label = (w: Word) => (kind === 'meaning' ? w.fa : w.en);
  const options = [label(word)];
  for (const w of shuffle(source)) {
    if (options.length === 4) break;
    if (options.includes(label(w)) || (kind === 'picture' && w.e === word.e)) continue;
    options.push(label(w));
  }
  return { kind, band, word, options: shuffle(options), answer: label(word) } as Question;
}

export default function LevelTest() {
  const { lang } = useI18n();
  const tx = text[lang];
  const num = (n: number) => (lang === 'fa' ? n.toLocaleString('fa-IR') : String(n));

  const [phase, setPhase] = useState<'intro' | 'loading' | 'playing' | 'result'>('intro');
  const [age, setAge] = useState<Age | null>(null);
  const [q, setQ] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const bank = useRef<Bank | null>(null);
  const used = useRef({ words: new Set<string>(), items: new Set<GrammarItem>() });

  const kinds = useRef<Kind[]>(plan);
  const index = answers.length - (picked !== null ? 1 : 0);
  const answered = picked !== null;
  const isRight = answered && picked === q?.answer;

  const next = (kind: Kind, band: Band) => {
    setQ(makeQuestion(kind, band, bank.current!, used.current.words, used.current.items));
    setPicked(null);
  };

  const start = async () => {
    setPhase('loading');
    if (!bank.current) {
      const { words } = await import('../data/words');
      bank.current = makeBank(words);
    }
    used.current = { words: new Set(), items: new Set() };
    kinds.current = plan.map((k, i) => (k === 'listen' && !canSpeak ? (i % 2 ? 'picture' : 'meaning') : k));
    setAnswers([]);
    next(kinds.current[0], 1);
    setPhase('playing');
  };

  // Listening questions play the word as soon as they appear.
  useEffect(() => {
    if (phase === 'playing' && q?.kind === 'listen') speak(q.word!.en);
  }, [phase, q]);

  const choose = (option: string) => {
    if (!q || answered) return;
    setPicked(option);
    const right = option === q.answer;
    setAnswers((a) => [...a, { band: q.band, skill: skillOf[q.kind], right }]);
    if (q.kind === 'picture' || q.kind === 'meaning') speak(q.word!.en);
    if (q.kind === 'grammar') speak(q.item!.s.replace('___', q.answer));
  };

  // Short feedback, then on to the next question (one step up after a right answer, one down after a wrong one).
  useEffect(() => {
    if (phase !== 'playing' || !q || picked === null) return;
    const id = setTimeout(
      () => {
        if (answers.length >= TOTAL) {
          awardSticker('level-test');
          setPhase('result');
          return;
        }
        next(kinds.current[answers.length], clampBand(q.band + (picked === q.answer ? 1 : -1)));
      },
      picked === q.answer ? 1100 : 1700,
    );
    return () => clearTimeout(id);
  }, [phase, picked, q]);

  const card = 'mx-auto max-w-2xl rounded-[2rem] border-4 border-surface bg-surface p-6 shadow-soft sm:p-8';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 rounded-full bg-grape-500 font-bold text-white shadow-soft transition hover:-translate-y-0.5';

  let body;
  if (phase === 'intro' || phase === 'loading') {
    body = (
      <div className={`${card} text-center`}>
        <motion.div
          className="text-6xl"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
        >
          🧭
        </motion.div>
        <ul className="mx-auto mt-5 max-w-md space-y-2 text-start">
          {tx.points.map((point, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-cream px-4 py-3 font-bold">
              {i === 2 ? (
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-leaf-600" />
              ) : (
                <Sparkles className="mt-0.5 size-5 shrink-0 text-sun-600" />
              )}
              <span className="text-ink/80">{point}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm font-bold text-ink/60">{tx.ageLabel}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ages.map((a) => (
            <button
              key={a}
              onClick={() => setAge(age === a ? null : a)}
              aria-pressed={age === a}
              className={`min-h-12 rounded-2xl border-2 px-3 py-2 font-bold transition ${
                age === a ? 'border-leaf-500 bg-leaf-500 text-white shadow-soft' : 'border-ink/10 hover:border-leaf-200'
              }`}
            >
              {tx.ages[a]}
            </button>
          ))}
        </div>

        <button
          onClick={start}
          disabled={phase === 'loading'}
          className={`mt-7 min-h-14 px-8 py-3 text-lg disabled:opacity-70 ${primaryBtn}`}
        >
          {phase === 'loading' ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          {phase === 'loading' ? tx.loading : tx.start}
        </button>
        <p className="mt-4 text-sm text-ink/60">{tx.kidTip}</p>
      </div>
    );
  } else if (phase === 'result') {
    body = (
      <Result
        answers={answers}
        age={age}
        lang={lang}
        num={num}
        onAgain={() => {
          setPhase('intro');
          setQ(null);
        }}
        card={card}
      />
    );
  } else if (q) {
    const feedback = isRight ? tx.right[index % tx.right.length] : tx.wrong[index % tx.wrong.length];
    const gap = q.item?.s.split('___');
    body = (
      <div className={card}>
        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <span className="text-ink/60">{tx.question(num(index + 1), num(TOTAL))}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-3 py-1 text-sun-700">
            <span aria-hidden="true">{bandEmoji[q.band]}</span>
            {tx.bands[q.band]}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" dir="ltr" aria-hidden="true">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full transition-colors ${
                i < answers.length ? (answers[i].right ? 'bg-leaf-500' : 'bg-sun-400') : 'bg-grape-50'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={answers.length - (answered ? 1 : 0)}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mt-6 text-center text-lg font-bold">{tx.prompts[q.kind]}</p>

            <div className="mt-4 flex min-h-28 flex-col items-center justify-center gap-3 text-center">
              {q.kind === 'picture' && <span className="text-7xl sm:text-8xl">{q.word!.e}</span>}
              {q.kind === 'meaning' && (
                <button
                  onClick={() => speak(q.word!.en)}
                  dir="ltr"
                  className="inline-flex items-center gap-3 font-display text-4xl font-bold text-leaf-700 sm:text-5xl"
                >
                  {q.word!.en}
                  {canSpeak && <Volume2 className="size-6 text-grape-500" />}
                </button>
              )}
              {q.kind === 'listen' && (
                <>
                  <motion.button
                    onClick={() => speak(q.word!.en)}
                    aria-label={tx.replay}
                    whileTap={{ scale: 0.9 }}
                    className="grid size-24 place-items-center rounded-full bg-sun-500 text-night shadow-soft transition hover:scale-105"
                  >
                    <Headphones className="size-11" />
                  </motion.button>
                  <button
                    onClick={() => speak(q.word!.en)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-grape-600"
                  >
                    <Volume2 className="size-4" />
                    {tx.replay}
                  </button>
                </>
              )}
              {q.kind === 'grammar' && gap && (
                <>
                  {q.item!.e && <span className="text-5xl">{q.item!.e}</span>}
                  <p dir="ltr" className="font-display text-2xl leading-relaxed font-bold sm:text-3xl">
                    {gap[0]}
                    <span
                      className={`mx-1 inline-block min-w-16 border-b-4 px-1 ${
                        !answered
                          ? 'border-grape-500'
                          : isRight
                            ? 'border-leaf-500 text-leaf-700'
                            : 'border-berry-500 text-berry-500'
                      }`}
                    >
                      {answered ? q.answer : ' '}
                    </span>
                    {gap[1]}
                  </p>
                </>
              )}
            </div>

            <div className={`mt-6 grid gap-3 ${q.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {q.options.map((o) => {
                const isAnswer = o === q.answer;
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
                    dir={q.kind === 'meaning' ? 'rtl' : 'ltr'}
                    className={`flex min-h-14 items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center text-lg font-bold break-words transition ${q.kind === 'meaning' ? '' : 'font-display'} ${state}`}
                  >
                    {answered && isAnswer && <Check className="size-5 shrink-0" />}
                    {answered && o === picked && !isAnswer && <X className="size-5 shrink-0" />}
                    {o}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-5 min-h-8 text-center" role="status">
              {answered && (
                <motion.p
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                  className={`text-lg font-black ${isRight ? 'text-leaf-700' : 'text-grape-600'}`}
                >
                  {feedback}
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Section id="level-test">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-24 -start-16 size-56 rounded-full bg-sun-100/70" />
        <div className="absolute -end-20 bottom-16 size-72 rounded-full bg-grape-50" />
      </div>
      <div className="relative">
        <SectionHeading eyebrow={tx.eyebrow} title={tx.title} lead={tx.lead} tone="sun" />
        <Reveal className="mt-10">{body}</Reveal>
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-6 text-ink/50">{tx.disclaimer}</p>
      </div>
    </Section>
  );
}

function Result({
  answers,
  age,
  lang,
  num,
  onAgain,
  card,
}: {
  answers: Answer[];
  age: Age | null;
  lang: 'fa' | 'en';
  num: (n: number) => string;
  onAgain: () => void;
  card: string;
}) {
  const tx = text[lang];
  // Where the child settled on the ladder after each of the last 6 answers.
  const settled = answers
    .slice(-6)
    .map((a) => clampBand(a.band + (a.right ? 1 : -1)))
    .reduce<number>((sum, b) => sum + b, 0);
  const avg = settled / Math.min(6, answers.length);
  const level: Band = avg >= 1.6 ? 2 : avg >= 0.6 ? 1 : 0;
  const right = answers.filter((a) => a.right).length;

  // Right answers on harder steps count for more, so a bar reflects both accuracy and difficulty.
  const skills = (['vocab', 'listening', 'grammar'] as Skill[]).map((skill) => {
    const mine = answers.filter((a) => a.skill === skill);
    const value = mine.length ? mine.reduce((sum, a) => sum + (a.right ? (a.band + 2) / 4 : 0), 0) / mine.length : null;
    return { skill, value };
  });
  const tested = skills.filter((s) => s.value !== null);
  const weakest = tested.length > 1 ? tested.reduce((a, b) => (b.value! < a.value! ? b : a)) : null;

  const levelName = lang === 'fa' ? `${tx.bands[level]} (${text.en.bands[level]})` : tx.bands[level];
  const scoreText = `${num(right)}/${num(answers.length)}`;
  const waText = tx.wa(levelName, age && tx.ages[age], scoreText);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${card} text-center`}
    >
      <p className="text-sm font-bold text-ink/60">{tx.resultTitle}</p>
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 12 }}
        className="mt-3 text-7xl"
      >
        {bandEmoji[level]}
      </motion.div>
      <h3 className="mt-3 text-3xl font-black text-grape-600 sm:text-4xl">{tx.bands[level]}</h3>
      {lang === 'fa' && (
        <p dir="ltr" className="font-display text-lg font-bold text-ink/50">
          {text.en.bands[level]}
        </p>
      )}

      <div className="mx-auto mt-4 flex max-w-xs items-end justify-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((b) => (
          <motion.div
            key={b}
            initial={{ height: 0 }}
            animate={{ height: 24 + b * 18 }}
            transition={{ delay: 0.3 + b * 0.1, type: 'spring', stiffness: 200, damping: 18 }}
            className={`flex flex-1 items-start justify-center rounded-t-xl pt-1 text-sm ${
              b <= level ? 'bg-sun-400' : 'bg-ink/10'
            }`}
          >
            {b === level && '⭐'}
          </motion.div>
        ))}
      </div>

      <p className="mt-4 font-bold text-ink/70">{tx.score(num(right), num(answers.length))}</p>
      <p className="mx-auto mt-3 max-w-lg leading-8 text-ink/80">{tx.about[level]}</p>
      {age && (
        <p className="mt-2 text-sm font-bold text-leaf-700">
          {level >= expectedBand[age] ? tx.ageGood(tx.ages[age]) : tx.ageGentle}
        </p>
      )}

      <div className="mt-6 rounded-3xl bg-cream p-5 text-start">
        <p className="text-sm font-bold text-ink/60">{tx.skillsTitle}</p>
        <ul className="mt-3 space-y-3">
          {skills.map(({ skill, value }, i) => (
            <li key={skill}>
              <div className="flex items-center justify-between gap-2 text-sm font-bold">
                <span>{tx.skills[skill]}</span>
                <span className="text-ink/60">
                  {value === null ? tx.notTested : tx.skillLevels[value < 0.4 ? 0 : value < 0.7 ? 1 : 2]}
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-surface">
                <motion.div
                  className={`h-full rounded-full ${['bg-leaf-500', 'bg-sun-500', 'bg-grape-500'][i]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, (value ?? 0) * 100)}%` }}
                  transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 90, damping: 18 }}
                />
              </div>
            </li>
          ))}
        </ul>
        {weakest && weakest.value! < 1 && (
          <p className="mt-4 text-sm font-bold text-grape-600">{tx.focus(tx.skills[weakest.skill])}</p>
        )}
      </div>

      <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <a
          href={links.whatsapp(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-leaf-500 px-7 py-3 text-lg font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-leaf-600"
        >
          <WhatsAppIcon className="size-6" />
          {tx.cta}
        </a>
        <button
          onClick={onAgain}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-grape-500"
        >
          <RotateCcw className="size-4" />
          {tx.again}
        </button>
      </div>
    </motion.div>
  );
}
