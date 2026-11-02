import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading } from './ui';

// One style per item in content.ts → activities (story hour, drama & role-play, songs & rhymes).
const styles = [
  { emoji: '📚', bg: 'bg-berry-100', ring: 'ring-berry-500/20' },
  { emoji: '🎭', bg: 'bg-sun-100', ring: 'ring-sun-500/20' },
  { emoji: '🎵', bg: 'bg-leaf-100', ring: 'ring-leaf-500/20' },
];

export default function Activities() {
  const { t } = useI18n();
  return (
    <Section>
      <SectionHeading eyebrow={t.activities.eyebrow} title={t.activities.title} lead={t.activities.lead} tone="sun" />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {t.activities.items.map((a, i) => (
          <Reveal key={a.title} delay={i * 0.1}>
            <motion.div
              whileHover={{ y: -6 }}
              className={`group h-full rounded-[2rem] ${styles[i].bg} p-8 text-center ring-8 ${styles[i].ring}`}
            >
              <motion.div
                className="mx-auto grid size-24 place-items-center rounded-full bg-surface text-5xl shadow-soft"
                whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                {styles[i].emoji}
              </motion.div>
              <h3 className="mt-6 text-2xl font-black">{a.title}</h3>
              <p className="mt-3 leading-7 text-ink/70">{a.text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
