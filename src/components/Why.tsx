import { motion } from 'motion/react';
import { BookOpenText, Heart, Laptop, MessageCircleMore, MessagesSquare, Puzzle, ShieldCheck, Star, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading } from './ui';

const whyIcons = [
  { Icon: Puzzle, tone: 'bg-sun-100 text-sun-700' },
  { Icon: MessageCircleMore, tone: 'bg-grape-100 text-grape-600' },
  { Icon: Users, tone: 'bg-leaf-100 text-leaf-700' },
  { Icon: Laptop, tone: 'bg-grape-100 text-grape-600' },
  { Icon: ShieldCheck, tone: 'bg-sun-100 text-sun-700' },
];

const benefitIcons = [
  { Icon: Heart, tone: 'text-berry-500' },
  { Icon: Star, tone: 'text-sun-500' },
  { Icon: BookOpenText, tone: 'text-leaf-500' },
  { Icon: MessagesSquare, tone: 'text-grape-500' },
];

export default function Why() {
  const { t } = useI18n();
  return (
    <Section className="bg-surface">
      <SectionHeading eyebrow={t.why.eyebrow} title={t.why.title} tone="sun" />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {t.why.items.map((it, i) => {
          const { Icon, tone } = whyIcons[i];
          return (
            <Reveal key={it.title} delay={i * 0.06} className={i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group h-full rounded-3xl border border-ink/5 bg-cream p-7 transition-shadow hover:shadow-soft"
              >
                <div className={`grid size-14 place-items-center rounded-2xl ${tone} transition group-hover:scale-110 group-hover:-rotate-6`}>
                  <Icon className="size-7" />
                </div>
                <h3 className="mt-5 text-xl font-black">{it.title}</h3>
                <p className="mt-2 leading-7 text-ink/70">{it.text}</p>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-16 relative overflow-hidden rounded-[2rem] bg-band p-8 text-white sm:p-10">
        <p className="text-center text-lg font-bold text-white/85">★ {t.benefits.eyebrow}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.benefits.items.map((b, i) => {
            const { Icon, tone } = benefitIcons[i];
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 200, damping: 16 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`grid size-16 place-items-center rounded-full bg-surface ${tone} shadow-lg ring-4 ring-white/15`}>
                  <Icon className="size-8" fill="currentColor" strokeWidth={1.5} />
                </div>
                <p className="mt-4 text-xl font-black">{b.title}</p>
                <p className="mt-1 text-white/85">{b.text}</p>
              </motion.div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
