import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { subPages, type SubPage } from '../navigation';
import { Reveal } from './ui';

// Link cards to the site's pages (and optionally to booking), used on the home page and under "See also".

const booking = {
  fa: { title: 'رزرو مشاوره', text: 'برای کلاس خصوصی یا نیمه‌خصوصی با من هماهنگ کنید', cta: 'رزرو' },
  en: { title: 'Book a consultation', text: 'Arrange a private or semi-private class with me', cta: 'Book' },
};

export default function PageCards({ pages, withBooking = false }: { pages: SubPage[]; withBooking?: boolean }) {
  const { t, lang } = useI18n();
  const Arrow = lang === 'fa' ? ArrowLeft : ArrowRight;

  const cards = [
    ...pages.map((p, i) => ({
      href: p,
      emoji: subPages[p].emoji,
      title: t.nav[subPages[p].navKey],
      ...subPages[p][lang],
      featured: i === 0 && p === '/play',
    })),
    ...(withBooking ? [{ href: '/#booking', emoji: '📅', ...booking[lang], featured: false }] : []),
  ];

  return (
    <div className={`grid gap-4 sm:gap-6 ${cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      {cards.map((c, i) => (
        <Reveal key={c.href} delay={i * 0.08}>
          <motion.a
            href={c.href}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex h-full flex-col gap-2 rounded-[2rem] border-4 border-surface p-6 shadow-soft ${
              c.featured ? 'bg-grape-500 text-white' : 'bg-surface'
            }`}
          >
            <span className="text-4xl">{c.emoji}</span>
            <span className="mt-1 text-xl font-black">{c.title}</span>
            <span className={c.featured ? 'text-white/85' : 'text-ink/60'}>{c.text}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-3 font-bold">
              {c.cta}
              <Arrow className="size-4 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </span>
          </motion.a>
        </Reveal>
      ))}
    </div>
  );
}
