import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowDown, CalendarHeart, Check, Send } from 'lucide-react';
import { useI18n } from '../i18n';
import { links } from '../content';
import { WhatsAppIcon } from './ui';
import HeroArt from './HeroArt';

export default function Hero() {
  const { t, dir } = useI18n();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const near = { x: useTransform(sx, (v) => v * 18), y: useTransform(sy, (v) => v * 18) };
  const far = { x: useTransform(sx, (v) => v * -10), y: useTransform(sy, (v) => v * -10) };

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
  const item = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <section id="top" onPointerMove={onMove} className="relative overflow-hidden px-5 pt-32 pb-20 sm:pt-36 lg:pb-28">
      <div className="dotted-bg absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="absolute -top-40 -end-40 -z-10 size-[34rem] rounded-full bg-leaf-100/70 blur-3xl" />
      <div className="absolute top-60 -start-40 -z-10 size-[26rem] rounded-full bg-sun-100/70 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-4 py-2 text-sm font-bold text-white shadow-pop"
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-white" />
            </span>
            {t.hero.badge}
          </motion.span>

          <motion.h1 variants={item} className="mt-6 text-5xl leading-[1.15] font-black sm:text-6xl lg:text-7xl">
            <span className="block text-ink">{t.hero.titleTop}</span>
            <span className="relative inline-block text-leaf-500">
              {t.hero.titleBottom}
              <svg viewBox="0 0 300 20" className="absolute -bottom-3 start-0 h-4 w-full text-sun-500" aria-hidden="true">
                <motion.path
                  d="M4 14 Q 75 2 150 10 T 296 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.div variants={item} className="mt-7 inline-flex items-center gap-3 rounded-full bg-surface px-5 py-2 shadow-soft">
            <span className="text-2xl">🧒</span>
            <span className="text-lg font-black text-leaf-700">{t.hero.age}</span>
          </motion.div>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-8 text-ink/75 sm:text-xl sm:leading-9">
            {t.hero.lead}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <a
              href="#booking"
              className="group inline-flex items-center gap-2 rounded-full bg-sun-500 px-7 py-4 text-lg font-bold text-night shadow-[0_14px_30px_-12px_rgb(255_204_0/0.9)] transition hover:-translate-y-0.5 hover:bg-sun-600"
            >
              <CalendarHeart className="size-5 transition group-hover:rotate-12" />
              {t.hero.primary}
            </a>
            <a
              href={links.whatsapp(t.contactSection.waDefault)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-leaf-500 bg-surface px-7 py-4 text-lg font-bold text-leaf-700 transition hover:-translate-y-0.5 hover:bg-leaf-50"
            >
              <WhatsAppIcon />
              {t.hero.secondary}
            </a>
          </motion.div>

          <motion.ul variants={item} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {t.hero.facts.map((f) => (
              <li key={f} className="flex items-center gap-2 font-semibold text-ink/80">
                <span className="grid size-6 place-items-center rounded-full bg-leaf-100 text-leaf-700">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroArt near={near} far={far} />
        </motion.div>
      </div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-28 start-[45%] hidden text-sun-500 lg:block"
        animate={{ x: dir === 'rtl' ? [0, -40, 0] : [0, 40, 0], y: [0, -16, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Send className={`size-10 ${dir === 'rtl' ? '-scale-x-100' : ''}`} />
      </motion.div>

      <a
        href="#about"
        aria-label="Scroll"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-ink/40 transition hover:text-leaf-600 lg:block"
      >
        <motion.span className="block" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ArrowDown />
        </motion.span>
      </a>
    </section>
  );
}
