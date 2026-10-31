import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Shuffle, Volume2 } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Word } from '../data/words';
import { Reveal, Section, SectionHeading } from './ui';

const ROUND_SIZE = 8;

const categories: Record<string, { emoji: string; fa: string; en: string }> = {
  animals: { emoji: '🐾', fa: 'حیوانات', en: 'Animals' },
  nature: { emoji: '🌿', fa: 'طبیعت', en: 'Nature' },
  food: { emoji: '🍎', fa: 'خوراکی‌ها', en: 'Food' },
  kitchen: { emoji: '🍳', fa: 'آشپزخانه', en: 'Kitchen' },
  home: { emoji: '🏠', fa: 'خانه', en: 'Home' },
  clothes: { emoji: '👕', fa: 'لباس', en: 'Clothes' },
  school: { emoji: '✏️', fa: 'مدرسه', en: 'School' },
  people: { emoji: '👪', fa: 'آدم‌ها و شغل‌ها', en: 'People & jobs' },
  body: { emoji: '🖐️', fa: 'بدن', en: 'Body' },
  feelings: { emoji: '😊', fa: 'احساسات', en: 'Feelings' },
  actions: { emoji: '🏃', fa: 'فعل‌ها', en: 'Actions' },
  describe: { emoji: '🎨', fa: 'صفت‌ها و رنگ‌ها', en: 'Describing' },
  time: { emoji: '⏰', fa: 'زمان و عدد', en: 'Time & numbers' },
  places: { emoji: '🏙️', fa: 'مکان‌ها و سفر', en: 'Places & travel' },
  play: { emoji: '⚽', fa: 'بازی و سرگرمی', en: 'Play & hobbies' },
  science: { emoji: '🚀', fa: 'علم و دنیا', en: 'Science & world' },
  everyday: { emoji: '💬', fa: 'کلمات روزمره', en: 'Everyday words' },
};

const cardTones = ['bg-berry-100', 'bg-sun-100', 'bg-grape-100', 'bg-leaf-100'];
const confettiColors = ['#009B4D', '#FFCC00', '#7C5CD6', '#EF4F6B'];

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
};

const pickRandom = (pool: Word[], n: number) => {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

export default function WordPlay() {
  const { t, lang } = useI18n();
  const [all, setAll] = useState<Word[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [round, setRound] = useState<Word[]>([]);
  const [roundId, setRoundId] = useState(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useEffect(() => {
    import('../data/words').then((m) => setAll(m.words));
  }, []);

  const pool = useMemo(() => (category === 'all' ? all : all.filter((w) => w.c === category)), [all, category]);

  const newRound = useCallback(() => {
    setRound(pickRandom(pool, ROUND_SIZE));
    setFlipped(new Set());
    setRoundId((r) => r + 1);
  }, [pool]);

  useEffect(() => {
    if (pool.length) newRound();
  }, [pool, newRound]);

  const done = round.length > 0 && flipped.size === round.length;

  const flip = (i: number) => {
    if (!flipped.has(i)) speak(round[i].en);
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const chips = [{ key: 'all', emoji: '✨', label: lang === 'fa' ? 'همه' : 'All' }].concat(
    Object.entries(categories).map(([key, c]) => ({ key, emoji: c.emoji, label: c[lang] })),
  );

  return (
    <Section id="play" className="overflow-hidden bg-grape-50">
      <div className="dotted-bg absolute inset-0 opacity-60" />
      <div className="relative">
        <SectionHeading eyebrow={t.play.eyebrow} title={t.play.title} lead={t.play.lead} tone="grape" />

        {all.length > 0 && (
          <p className="mt-4 text-center text-sm font-bold text-grape-600">{t.play.bank(all.length)}</p>
        )}

        <div className="mt-8">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                aria-pressed={category === c.key}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition sm:px-4 sm:py-2 sm:text-sm ${
                  category === c.key
                    ? 'border-grape-500 bg-grape-500 text-white'
                    : 'border-transparent bg-surface text-ink/70 hover:border-grape-100'
                }`}
              >
                <span className="me-1.5">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid min-h-[20rem] grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {round.map((w, i) => {
            const isFlipped = flipped.has(i);
            const icon = w.e || categories[w.c]?.emoji || '✨';
            return (
              <motion.div
                key={`${roundId}-${w.en}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 220, damping: 20 }}
                className="[perspective:1000px]"
              >
                <motion.button
                  type="button"
                  onClick={() => flip(i)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                  className="card-flip relative aspect-[3/4] w-full cursor-pointer"
                  aria-label={isFlipped ? `${w.en} — ${w.fa}` : w.en}
                  aria-pressed={isFlipped}
                >
                  <div
                    className={`card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border-4 border-surface p-3 shadow-soft ${cardTones[i % cardTones.length]}`}
                  >
                    <span className={`text-5xl sm:text-6xl ${w.e ? '' : 'opacity-60'}`}>{icon}</span>
                    <span dir="ltr" className="font-display text-2xl leading-tight font-bold break-words text-ink sm:text-3xl">
                      {w.en}
                    </span>
                    <span className="text-xs font-semibold text-ink/50">{t.play.tapHint}</span>
                  </div>
                  <div
                    className="card-face absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl border-4 border-surface bg-surface p-3 shadow-soft"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <span dir="ltr" className="font-display text-xl font-bold text-leaf-600">
                      {w.en}
                    </span>
                    <span dir="rtl" className="text-2xl font-black text-ink">
                      {w.fa}
                    </span>
                    <span dir="ltr" className="text-xs leading-5 text-ink/60 sm:text-sm">
                      {w.s}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(`${w.en}. ${w.s}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          speak(`${w.en}. ${w.s}`);
                        }
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sun-500 px-3 py-1.5 text-xs font-bold text-night hover:bg-sun-600"
                    >
                      <Volume2 className="size-4" />
                      {t.play.listen}
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <Reveal className="relative mt-10 flex flex-col items-center gap-4">
          <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-surface shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-sun-500 to-grape-500"
              animate={{ width: `${round.length ? (flipped.size / round.length) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={done ? 'done' : flipped.size}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-lg font-bold"
            >
              {done ? t.play.done : t.play.score(flipped.size, round.length)}
            </motion.p>
          </AnimatePresence>
          <motion.button
            onClick={newRound}
            animate={done ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={done ? { duration: 1, repeat: Infinity } : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-soft transition ${
              done ? 'bg-grape-500 text-white' : 'bg-surface hover:text-grape-600'
            }`}
          >
            <Shuffle className="size-4" />
            {t.play.reset}
          </motion.button>

          <AnimatePresence>
            {done && (
              <div className="pointer-events-none absolute inset-x-0 -top-10 flex justify-center" aria-hidden="true">
                {Array.from({ length: 28 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute size-2.5 rounded-sm"
                    style={{ background: confettiColors[i % confettiColors.length] }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      x: Math.cos((i / 28) * Math.PI * 2) * (120 + (i % 4) * 40),
                      y: Math.sin((i / 28) * Math.PI * 2) * (80 + (i % 3) * 30) - 40,
                      opacity: 0,
                      rotate: 360,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </Section>
  );
}
