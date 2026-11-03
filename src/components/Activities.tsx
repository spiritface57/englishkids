import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading, TiltCard } from './ui';

// One style per item in content.ts → activities (story hour, drama & role-play, songs & rhymes).
// Cards start neutral; the one in focus (hover, keyboard, or the middle of the screen on phones) takes its colour.
const styles = [
  { emoji: '📚', on: 'bg-berry-100 ring-berry-500/30', dot: 'bg-berry-500' },
  { emoji: '🎭', on: 'bg-sun-100 ring-sun-500/30', dot: 'bg-sun-500' },
  { emoji: '🎵', on: 'bg-leaf-100 ring-leaf-500/30', dot: 'bg-leaf-500' },
];

export default function Activities() {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  // Touch screens have no hover: the card crossing the middle of the screen is the active one.
  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const i = cards.current.indexOf(e.target as HTMLDivElement);
          if (e.isIntersecting) setActive(i);
          else setActive((a) => (a === i ? null : a));
        }),
      { rootMargin: '-40% 0px -40% 0px' },
    );
    cards.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Section>
      <SectionHeading eyebrow={t.activities.eyebrow} title={t.activities.title} lead={t.activities.lead} tone="sun" />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {t.activities.items.map((a, i) => {
          const s = styles[i];
          const on = active === i;
          return (
            <Reveal key={a.title} delay={i * 0.1} className="h-full">
              <TiltCard
                ref={(el: HTMLDivElement | null) => {
                  cards.current[i] = el;
                }}
                tabIndex={0}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                animate={{ y: on ? -8 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`h-full rounded-[2rem] p-8 text-center ring-8 transition-[background-color,box-shadow] duration-500 outline-none focus-visible:ring-leaf-500/50 ${
                  on ? `${s.on} shadow-soft` : 'bg-surface ring-ink/5'
                }`}
              >
                <motion.div
                  className="mx-auto grid size-24 place-items-center rounded-full bg-cream text-5xl shadow-soft"
                  animate={on ? { rotate: [0, -12, 12, 0], scale: 1.12 } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {s.emoji}
                </motion.div>
                <h3 className="mt-6 text-2xl font-black">{a.title}</h3>
                <p className="mt-3 leading-7 text-ink/70">{a.text}</p>
                <motion.span
                  aria-hidden
                  className={`mx-auto mt-6 block h-1.5 rounded-full ${s.dot}`}
                  animate={{ width: on ? 64 : 16, opacity: on ? 1 : 0.35 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                />
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
