import { lazy, Suspense, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  CalendarHeart,
  Languages,
  Loader2,
  MessageCircleHeart,
  Plus,
  Sparkles,
  TrendingUp,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { features } from '../features';
import { Reveal, Section, SectionHeading } from './ui';

const Worksheets = lazy(() => import('./Worksheets'));

// Tips for parents. Text between backticks is English and is shown left-to-right in the display font.
// A point is either a plain line or { head, body, ex } (a named item with an optional English example).

type Point = string | { head: string; body: string; ex?: string };
type Tip = { title: string; summary: string; points: Point[]; note?: string };

const tipStyle: { Icon: LucideIcon; tone: string; ring: string }[] = [
  { Icon: CalendarHeart, tone: 'bg-leaf-100 text-leaf-700', ring: 'border-leaf-500' },
  { Icon: BookOpen, tone: 'bg-sun-100 text-sun-700', ring: 'border-sun-500' },
  { Icon: Tv, tone: 'bg-grape-100 text-grape-600', ring: 'border-grape-500' },
  { Icon: Sparkles, tone: 'bg-berry-100 text-berry-500', ring: 'border-berry-500' },
  { Icon: Languages, tone: 'bg-leaf-100 text-leaf-700', ring: 'border-leaf-500' },
  { Icon: TrendingUp, tone: 'bg-sun-100 text-sun-700', ring: 'border-sun-500' },
];

const text: Record<
  'fa' | 'en',
  { eyebrow: string; title: string; lead: string; more: string; less: string; cta: string; ctaBtn: string; tips: Tip[] }
> = {
  fa: {
    eyebrow: 'ویژه‌ی والدین',
    title: 'شما بهترین همراه انگلیسی فرزندتان هستید',
    lead: 'لازم نیست انگلیسی‌تان عالی باشد. چند عادت کوچک و شاد در خانه، کنار کلاس، فرق بزرگی می‌سازد. این‌ها نکته‌هایی است که من همیشه به خانواده‌ها پیشنهاد می‌کنم.',
    more: 'بیشتر بخوانید',
    less: 'بستن',
    cta: 'سؤالی درباره‌ی انگلیسی فرزندتان دارید؟',
    ctaBtn: 'یک جلسه‌ی مشاوره‌ی رایگان رزرو کنید',
    tips: [
      {
        title: 'روزی ۱۰ دقیقه در خانه',
        summary: 'لازم نیست ساعت‌ها وقت بگذارید؛ چیزی که فرق می‌سازد، تکرار کوتاه و هر روزه است.',
        points: [
          {
            head: 'صبح: یک آهنگ',
            body: 'موقع صبحانه یا لباس پوشیدن یک آهنگ کوتاه انگلیسی پخش کنید و با هم بخوانید و حرکت کنید.',
            ex: 'Hello, hello, how are you?',
          },
          {
            head: 'در طول روز: اسم وسایل خانه',
            body: 'هر هفته چند وسیله را انتخاب کنید و برچسب کاغذی رویشان بچسبانید. هر بار که از کنارشان رد می‌شوید، اسمشان را بگویید.',
            ex: 'door · window · cup · chair',
          },
          {
            head: 'بازی «بده به من»',
            body: 'از کودک بخواهید چیزی را بیاورد. لازم نیست ترجمه کنید؛ اشاره و لبخند کافی است.',
            ex: 'Give me the red cup, please!',
          },
          {
            head: 'شب: سه کلمه قبل از خواب',
            body: 'سه کلمه‌ای را که امروز شنیده یا یاد گرفته با هم مرور کنید و با یک شب‌به‌خیر انگلیسی تمامش کنید.',
            ex: 'Good night, moon. Good night, teddy.',
          },
        ],
        note: 'تمرین را وقتی تمام کنید که کودک هنوز دلش می‌خواهد ادامه بدهد؛ این‌طوری فردا با اشتیاق برمی‌گردد.',
      },
      {
        title: 'با هم کتاب بخوانیم',
        summary: 'حتی اگر انگلیسی خودتان مقدماتی است، می‌توانید همراه خوبی برای کتاب‌خوانی فرزندتان باشید.',
        points: [
          'کتاب‌های تصویری ساده با جمله‌های کوتاه و تکراری انتخاب کنید؛ کتابی که در هر صفحه یکی دو جمله دارد، بهترین شروع است.',
          'لازم نیست همه‌ی متن را بخوانید. به تصویرها اشاره کنید و سؤال‌های کوچک بپرسید: `What’s this?` ، `Where is the cat?` ، `What colour is it?`',
          'اگر تلفظ کلمه‌ای را مطمئن نیستید، اشکالی ندارد. با هم از یک دیکشنری صوتی گوشش کنید؛ دیدن اینکه پدر و مادر هم یاد می‌گیرند، خودش درس بزرگی است.',
          'یک کتاب را بارها بخوانید. بچه‌ها عاشق تکرارند و هر بار بخش بیشتری از قصه را خودشان می‌گویند.',
          'بگذارید کودک صفحه را ورق بزند، جمله‌ی تکراری را با شما بگوید و آخر قصه را حدس بزند.',
        ],
        note: 'کتاب‌خوانی باید لحظه‌ای آرام و دوست‌داشتنی باشد، نه امتحان.',
      },
      {
        title: 'تماشای درست',
        summary: 'کارتون و آهنگ انگلیسی گوش کودک را با صداها و آهنگ زبان آشنا می‌کند، به شرطی که اندازه نگه داریم.',
        points: [
          { head: 'Super Simple Songs', body: 'آهنگ‌های ساده و آرام برای کلمه‌های روزمره؛ مناسب حدود ۲ تا ۶ سال.' },
          { head: 'Peppa Pig', body: 'جمله‌های کوتاه از زندگی روزمره‌ی خانواده؛ مناسب حدود ۳ تا ۶ سال.' },
          { head: 'Numberblocks', body: 'عددها و شمارش با شخصیت‌های بامزه؛ مناسب حدود ۳ تا ۶ سال.' },
          { head: 'Alphablocks', body: 'حرف‌ها و صدای آن‌ها، مقدمه‌ای برای خواندن؛ مناسب حدود ۳ تا ۶ سال.' },
          { head: 'Sesame Street', body: 'آهنگ، عدد، حرف و مهارت‌های اجتماعی؛ مناسب حدود ۳ تا ۷ سال.' },
          { head: 'Bluey', body: 'قصه‌های گرم خانوادگی با زبانی کمی طبیعی‌تر و سریع‌تر؛ مناسب حدود ۴ تا ۸ سال.' },
          'سن‌ها تقریبی است؛ مهم‌تر از سن، این است که کودک بیشتر حرف‌ها را از روی تصویر بفهمد.',
          'با هم تماشا کنید و درباره‌اش حرف بزنید: `Look! Peppa is jumping!` بعد از تماشا هم بپرسید چه دید.',
          'زمان تماشا کوتاه باشد؛ برای بچه‌های کوچک چند قسمت کوتاه در روز کافی است. دیدن دوباره‌ی یک قسمت هم کاملاً مفید است.',
          'نسخه‌ی اصلی انگلیسی را ببینید، نه دوبله را. ویدیوها را از کانال‌های رسمی پخش کنید؛ ویدیوهای تقلیدی همیشه مناسب کودک نیستند.',
        ],
      },
      {
        title: 'اشتباه کردن خوب است',
        summary: 'کودکی که اشتباه می‌کند یعنی دارد امتحان می‌کند، و این همان یادگیری است.',
        points: [
          {
            head: 'به جای «غلط است»، درستش را تکرار کنید',
            body: 'اگر گفت `I goed to the park` ، با لبخند جوابش را بدهید و جمله‌ی درست را طبیعی تکرار کنید:',
            ex: 'Oh, you went to the park! Fun!',
          },
          {
            head: 'تلاش را تشویق کنید، نه فقط جواب درست را',
            body: 'یک `Good try!` یا `Great job!` گرم، جرئت حرف زدن را بیشتر می‌کند.',
          },
          {
            head: 'همه‌چیز را ترجمه نکنید',
            body: 'معنی را با اشاره، حرکت، تصویر و لحن صدا برسانید. این‌طوری کودک کم‌کم یاد می‌گیرد مستقیم به انگلیسی فکر کند.',
          },
          {
            head: 'جواب فارسی هم قبول است',
            body: 'اگر فارسی جواب داد، جوابش را به انگلیسی برایش تکرار کنید، بدون اینکه مجبورش کنید:',
            ex: 'Yes, an apple!',
          },
          {
            head: 'دوره‌ی سکوت طبیعی است',
            body: 'خیلی از بچه‌ها مدتی فقط گوش می‌دهند و کم حرف می‌زنند. آن‌ها در حال جمع کردن کلمه‌ها هستند؛ صبور باشید و مقایسه نکنید.',
          },
        ],
      },
      {
        title: 'چالش‌های رایج کودکان فارسی‌زبان',
        summary: 'بعضی صداها و ساختارهای انگلیسی در فارسی نیستند. شناختنشان کمک می‌کند صبورتر و دقیق‌تر همراهی کنیم.',
        points: [
          {
            head: 'صدای `th`',
            body: 'در فارسی نیست و معمولاً «ت/س» یا «د/ز» گفته می‌شود. بازی کنید: نوک زبان را آرام بین دندان‌ها بگذارید و فوت کنید.',
            ex: 'three (not tree) · this (not zis)',
          },
          {
            head: '`w` و `v`',
            body: 'در فارسی هر دو شبیه «و» هستند. برای `v` دندان‌های بالا روی لب پایین؛ برای `w` لب‌ها گرد، مثل وقتی که بوس می‌فرستیم.',
            ex: 'wet / vet · west / vest',
          },
          {
            head: 'ترتیب کلمه‌ها',
            body: 'در فارسی فعل آخر جمله می‌آید، ولی در انگلیسی بعد از فاعل. صفت هم قبل از اسم می‌آید.',
            ex: 'I like apples. · a red car',
          },
          {
            head: '«اِ» قبل از s',
            body: 'چون در فارسی کلمه با دو صامت شروع نمی‌شود، بچه‌ها می‌گویند «اِسکول». تمرین: «سسس…» را بکشید و بعد بقیه‌ی کلمه را بگویید.',
            ex: 'school · star · snake · spoon',
          },
          {
            head: '`a / an` و `the`',
            body: 'در فارسی معادل دقیقی ندارند و بچه‌ها گاهی جا می‌اندازندشان. قبل از صدای `a, e, i, o, u` از `an` استفاده می‌کنیم.',
            ex: 'a cat · an apple · I have a dog. The dog is big.',
          },
          {
            head: '`he` و `she`',
            body: 'در فارسی هر دو «او» است، پس قاطی شدنشان خیلی طبیعی است. با عکس اعضای خانواده تمرین کنید.',
            ex: 'Dad? He is tall. · Mum? She is kind.',
          },
        ],
      },
      {
        title: 'پیشرفت چه شکلی است؟',
        summary:
          'این‌ها نمونه‌هایی معمول برای بچه‌های ۵ تا ۸ ساله است، نه جدول قبولی. هر کودکی با سرعت خودش پیش می‌رود.',
        points: [
          {
            head: 'ماه‌های اول',
            body: 'سلام و خداحافظی، رنگ‌ها، عددهای ۱ تا ۱۰ و اسم چند حیوان و خوراکی. دستورهای ساده را می‌فهمد، حتی اگر هنوز کم حرف بزند.',
            ex: 'Sit down, please. · Show me the cat.',
          },
          {
            head: 'حدود ۶ ماه',
            body: 'چند آهنگ را همراهی می‌کند و با جمله‌های کوتاه و الگودار حرف می‌زند.',
            ex: 'I like… · I have… · It’s a…',
          },
          {
            head: 'حدود یک سال',
            body: 'به سؤال‌های ساده درباره‌ی خودش جواب می‌دهد و قصه‌های کوتاه تصویری را دنبال می‌کند. اگر به سن خواندن رسیده باشد، کم‌کم کلمه‌های ساده را با صدای حرف‌ها می‌خواند.',
            ex: 'What’s your name? · How old are you?',
          },
          {
            head: 'بعد از آن',
            body: 'جمله‌های کامل‌تر می‌سازد، از روزش تعریف می‌کند و کتاب‌های ساده را خودش می‌خواند.',
          },
          'بچه‌های ۵ و ۶ ساله بیشتر با گوش، آهنگ، بازی و حرکت یاد می‌گیرند؛ معمولاً از حدود ۷ سالگی خواندن و نوشتن جای بیشتری پیدا می‌کند.',
        ],
        note: 'اگر حس می‌کنید فرزندتان علاقه‌اش را از دست داده یا مدتی است پیشرفتی نمی‌بینید، با من در میان بگذارید؛ معمولاً با عوض کردن بازی‌ها و روش، دوباره راه می‌افتد.',
      },
    ],
  },
  en: {
    eyebrow: "Parents' corner",
    title: "You are your child's best English buddy",
    lead: "Your own English doesn't need to be perfect. A few small, happy habits at home, alongside classes, make a big difference. These are the tips I always share with families.",
    more: 'Read more',
    less: 'Close',
    cta: "Questions about your child's English?",
    ctaBtn: 'Book a free consultation',
    tips: [
      {
        title: '10 minutes a day at home',
        summary: "You don't need hours. What makes the difference is a short, everyday routine.",
        points: [
          {
            head: 'Morning: one song',
            body: 'Play a short English song at breakfast or while getting dressed, and sing and move along together.',
            ex: 'Hello, hello, how are you?',
          },
          {
            head: 'During the day: name things at home',
            body: 'Each week pick a few objects, stick paper labels on them and say their names whenever you pass by.',
            ex: 'door · window · cup · chair',
          },
          {
            head: 'The "give me" game',
            body: 'Ask your child to bring you things. No need to translate; pointing and a smile are enough.',
            ex: 'Give me the red cup, please!',
          },
          {
            head: 'Bedtime: three words',
            body: 'Go over three words your child heard or learned today and finish with an English good night.',
            ex: 'Good night, moon. Good night, teddy.',
          },
        ],
        note: 'Stop while your child still wants more: they will come back tomorrow excited.',
      },
      {
        title: 'Reading together',
        summary: 'Even if your own English is basic, you can be a great reading partner.',
        points: [
          'Choose simple picture books with short, repeated sentences; one or two sentences per page is a perfect start.',
          "You don't have to read every word. Point at the pictures and ask little questions: `What’s this?`, `Where is the cat?`, `What colour is it?`",
          "Not sure how to say a word? That's fine. Listen to it together in an audio dictionary; seeing a parent learn is a great lesson too.",
          'Read the same book again and again. Children love repetition, and each time they say more of the story themselves.',
          'Let your child turn the pages, join in the repeated line and guess how the story ends.',
        ],
        note: 'Reading should feel calm and cosy, never like a test.',
      },
      {
        title: 'Screens done right',
        summary:
          "English cartoons and songs tune your child's ear to the sounds and rhythm of English, as long as we keep it in balance.",
        points: [
          { head: 'Super Simple Songs', body: 'Simple, gentle songs about everyday words; about ages 2–6.' },
          { head: 'Peppa Pig', body: 'Short sentences from everyday family life; about ages 3–6.' },
          { head: 'Numberblocks', body: 'Numbers and counting with funny characters; about ages 3–6.' },
          { head: 'Alphablocks', body: 'Letters and their sounds, a first step towards reading; about ages 3–6.' },
          { head: 'Sesame Street', body: 'Songs, numbers, letters and social skills; about ages 3–7.' },
          { head: 'Bluey', body: 'Warm family stories with more natural, faster speech; about ages 4–8.' },
          'Ages are rough; what matters more is that your child can follow most of it from the pictures.',
          'Watch together and talk about it: `Look! Peppa is jumping!` Afterwards, ask what they saw.',
          'Keep it short: for young children a few short episodes a day is plenty. Watching the same episode again is useful too.',
          "Choose the original English version, not a dubbed one, and play videos from the official channels; copycat videos aren't always child-friendly.",
        ],
      },
      {
        title: 'Mistakes are good',
        summary: "A child who makes mistakes is a child who's trying, and that is learning.",
        points: [
          {
            head: 'Instead of "that\'s wrong", say it right',
            body: 'If your child says `I goed to the park`, answer with a smile and naturally repeat the correct sentence:',
            ex: 'Oh, you went to the park! Fun!',
          },
          {
            head: 'Praise the effort, not only the right answer',
            body: 'A warm `Good try!` or `Great job!` builds the courage to speak.',
          },
          {
            head: "Don't translate everything",
            body: 'Show meaning with pointing, gestures, pictures and your voice. This way children slowly learn to think in English.',
          },
          {
            head: 'A Persian answer is OK too',
            body: 'If your child answers in Persian, echo the answer in English without forcing them to repeat it:',
            ex: 'Yes, an apple!',
          },
          {
            head: 'A quiet phase is normal',
            body: "Many children listen for a while and say little. They are collecting words; be patient and don't compare.",
          },
        ],
      },
      {
        title: 'Common challenges for Persian-speaking children',
        summary:
          "Some English sounds and patterns don't exist in Persian. Knowing them helps us support children patiently and precisely.",
        points: [
          {
            head: 'The th sound',
            body: "It doesn't exist in Persian, so it often comes out as t/s or d/z. Make it a game: put the tip of the tongue gently between the teeth and blow.",
            ex: 'three (not tree) · this (not zis)',
          },
          {
            head: 'w and v',
            body: 'In Persian both sound like "و". For v, top teeth on the bottom lip; for w, round lips as if blowing a kiss.',
            ex: 'wet / vet · west / vest',
          },
          {
            head: 'Word order',
            body: 'In Persian the verb comes last; in English it comes after the subject. Adjectives come before the noun.',
            ex: 'I like apples. · a red car',
          },
          {
            head: 'The extra "e" before s',
            body: 'Persian words never start with two consonants, so children say "eschool". Practise stretching "sss…" and then saying the rest.',
            ex: 'school · star · snake · spoon',
          },
          {
            head: 'a / an and the',
            body: 'Persian has no exact match, so children often leave them out. Before the sounds a, e, i, o, u we use an.',
            ex: 'a cat · an apple · I have a dog. The dog is big.',
          },
          {
            head: 'he and she',
            body: 'Persian uses one word, "او", for both, so mixing them up is very normal. Practise with family photos.',
            ex: 'Dad? He is tall. · Mum? She is kind.',
          },
        ],
      },
      {
        title: 'What progress looks like',
        summary:
          'Typical examples for children aged 5–8, not a pass/fail chart. Every child is different and moves at their own pace.',
        points: [
          {
            head: 'The first months',
            body: 'Hello and goodbye, colours, numbers 1–10, a few animals and foods. Understands simple instructions, even if they say little yet.',
            ex: 'Sit down, please. · Show me the cat.',
          },
          {
            head: 'Around 6 months',
            body: 'Sings along to a few songs and speaks in short, patterned sentences.',
            ex: 'I like… · I have… · It’s a…',
          },
          {
            head: 'Around one year',
            body: 'Answers simple questions about themselves and follows short picture stories. If old enough to read, starts sounding out simple words.',
            ex: 'What’s your name? · How old are you?',
          },
          {
            head: 'After that',
            body: 'Builds longer sentences, talks about their day and reads simple books on their own.',
          },
          'Five- and six-year-olds learn mostly through listening, songs, games and movement; reading and writing usually take a bigger place from around age 7.',
        ],
        note: "If your child seems to have lost interest, or you haven't seen progress for a while, talk to me: a change of games or approach usually gets things moving again.",
      },
    ],
  },
};

// Renders `English` parts left-to-right in the display font.
function Rich({ children }: { children: string }) {
  return (
    <>
      {children.split(/`([^`]+)`/).map((part, i) =>
        i % 2 ? (
          <span key={i} dir="ltr" className="font-display font-bold text-leaf-700">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Example({ children }: { children: ReactNode }) {
  return (
    <span
      dir="ltr"
      className="mt-1.5 inline-block rounded-xl bg-sun-50 px-3 py-1 font-display text-sm font-bold text-sun-700"
    >
      {children}
    </span>
  );
}

function TipCard({ tip, index, open, onToggle }: { tip: Tip; index: number; open: boolean; onToggle: () => void }) {
  const { lang } = useI18n();
  const s = text[lang];
  const { Icon, tone, ring } = tipStyle[index];
  return (
    <div
      className={`h-full rounded-3xl border-4 bg-surface shadow-soft transition-colors ${open ? ring : 'border-surface'}`}
    >
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-4 p-6 text-start">
        <div className={`grid size-14 shrink-0 place-items-center rounded-2xl ${tone}`}>
          <Icon className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl leading-snug font-black">{tip.title}</h3>
          <p className="mt-2 leading-7 text-ink/70">{tip.summary}</p>
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-leaf-700">
            <motion.span
              animate={{ rotate: open ? 45 : 0 }}
              className="grid size-6 place-items-center rounded-full bg-leaf-100"
            >
              <Plus className="size-4" />
            </motion.span>
            {open ? s.less : s.more}
          </span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="space-y-3 px-6 pb-6">
              {tip.points.map((p, i) => (
                <li key={i} className="flex gap-3 rounded-2xl bg-cream p-4 leading-7">
                  <span className={`mt-2.5 size-2 shrink-0 rounded-full ${tone.split(' ')[0]}`} />
                  <div className="min-w-0 text-ink/80">
                    {typeof p === 'string' ? (
                      <Rich>{p}</Rich>
                    ) : (
                      <>
                        <p className="font-black text-ink">
                          {/^[\x20-\x7E]+$/.test(p.head) ? (
                            <span dir="ltr" className="font-display">
                              {p.head}
                            </span>
                          ) : (
                            <Rich>{p.head}</Rich>
                          )}
                        </p>
                        <p>
                          <Rich>{p.body}</Rich>
                        </p>
                        {p.ex && <Example>{p.ex}</Example>}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {tip.note && (
              <p className="mx-6 mb-6 rounded-2xl border-2 border-dashed border-leaf-200 p-4 leading-7 font-bold text-leaf-700">
                💚 {tip.note}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ParentsCorner() {
  const { lang } = useI18n();
  const s = text[lang];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Section id="parents">
      <SectionHeading eyebrow={s.eyebrow} title={s.title} lead={s.lead} tone="leaf" />

      <div className="mt-12 grid items-start gap-5 md:grid-cols-2">
        {s.tips.map((tip, i) => (
          <Reveal key={i} delay={(i % 2) * 0.06}>
            <TipCard tip={tip} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          </Reveal>
        ))}
      </div>

      {features.worksheets && (
        <div className="mt-14">
          <Suspense
            fallback={
              <div className="grid min-h-40 place-items-center">
                <Loader2 className="size-8 animate-spin text-leaf-500" />
              </div>
            }
          >
            <Worksheets />
          </Suspense>
        </div>
      )}

      <Reveal className="mt-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl bg-leaf-50 p-6 text-center sm:flex-row sm:text-start">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
            <MessageCircleHeart className="size-7" />
          </div>
          <p className="flex-1 text-lg font-bold">{s.cta}</p>
          <a
            href="#booking"
            className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-6 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5"
          >
            {s.ctaBtn}
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
