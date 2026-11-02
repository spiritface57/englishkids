import { motion } from 'motion/react';
import {
  BookOpenText,
  Heart,
  Laptop,
  MessageCircleMore,
  MessagesSquare,
  Puzzle,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
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
  { Icon: Heart, tone: 'text-berry-500', bg: 'bg-berry-100', tilt: -2.5 },
  { Icon: Star, tone: 'text-sun-600', bg: 'bg-sun-100', tilt: 2 },
  { Icon: BookOpenText, tone: 'text-leaf-600', bg: 'bg-leaf-100', tilt: -2 },
  { Icon: MessagesSquare, tone: 'text-grape-500', bg: 'bg-grape-100', tilt: 2.5 },
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
                <div
                  className={`grid size-14 place-items-center rounded-2xl ${tone} transition group-hover:scale-110 group-hover:-rotate-6`}
                >
                  <Icon className="size-7" />
                </div>
                <h3 className="mt-5 text-xl font-black">{it.title}</h3>
                <p className="mt-2 leading-7 text-ink/70">{it.text}</p>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      {/* Benefits as playful pastel "stickers", slightly tilted like they were stuck on by hand. */}
      <div className="mt-16">
        <p className="text-center text-lg font-black">★ {t.benefits.eyebrow}</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {t.benefits.items.map((b, i) => {
            const { Icon, tone, bg, tilt } = benefitIcons[i];
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, scale: 0.85, rotate: 0 }}
                whileInView={{ opacity: 1, scale: 1, rotate: tilt }}
                whileHover={{ rotate: 0, y: -6, scale: 1.03 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 200, damping: 16 }}
                className={`flex flex-col items-center rounded-3xl border-4 border-surface p-5 text-center shadow-soft sm:p-6 ${bg}`}
              >
                <div className={`grid size-16 place-items-center rounded-full bg-surface shadow-soft ${tone}`}>
                  <Icon className="size-8" fill="currentColor" strokeWidth={1.5} />
                </div>
                <p className="mt-4 text-lg font-black sm:text-xl">{b.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink/70 sm:text-base">{b.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
