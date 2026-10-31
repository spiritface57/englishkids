import { motion } from 'motion/react';
import { useI18n } from '../i18n';
import { Section, SectionHeading } from './ui';

const tones = ['bg-sun-500', 'bg-grape-500', 'bg-leaf-500'];

export default function Steps() {
  const { t, lang } = useI18n();
  return (
    <Section>
      <SectionHeading eyebrow={t.steps.eyebrow} title={t.steps.title} tone="grape" />
      <div className="relative mt-16 grid gap-10 md:grid-cols-3">
        <svg className="absolute top-8 inset-x-[16%] hidden h-4 w-[68%] md:block" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
          <motion.line
            x1="0"
            y1="2"
            x2="100"
            y2="2"
            stroke="#BFE0A8"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          />
        </svg>
        {t.steps.items.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className="relative text-center"
          >
            <div className={`relative mx-auto grid size-16 place-items-center rounded-2xl ${tones[i]} text-2xl font-black text-white shadow-soft`}>
              {(i + 1).toLocaleString(lang)}
            </div>
            <h3 className="mt-5 text-xl font-black">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-xs leading-7 text-ink/70">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
