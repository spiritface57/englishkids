import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUp, CalendarHeart, Heart, Languages, Moon, Phone, Sparkles, Sun, Volume2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { contact, links } from '../content';
import { features } from '../features';
import { loadDailyWords, pick } from '../dailyWord';
import type { Word } from '../data/words';
import { canSpeak, speak } from './wordGame';
import { InstagramIcon, WhatsAppIcon } from './ui';
import Logo from './Logo';
import { enabledSubPages, subPages } from '../navigation';

// Letters floating faintly behind the footer, for a classroom-wall feel.
const letters = [
  { ch: 'A', className: 'start-[6%] top-24 text-leaf-500', delay: 0 },
  { ch: 'b', className: 'end-[8%] top-40 text-sun-500', delay: 1.2 },
  { ch: 'C', className: 'start-[42%] bottom-28 text-berry-500', delay: 0.6 },
  { ch: '★', className: 'end-[30%] top-16 text-grape-500', delay: 1.8 },
];

// Today's word, loaded only once the footer scrolls into view so it doesn't slow down the page.
function TodayWord() {
  const { t, dir } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '200px' });
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    loadDailyWords().then((list) => {
      if (alive && list.length) setWord(pick(list, new Date()));
    });
    return () => {
      alive = false;
    };
  }, [inView]);

  return (
    <div ref={ref} className="mt-6 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="flex items-center gap-2 text-xs font-bold text-white/50">
        <Sparkles className="size-4 text-sun-500" />
        {t.footer.todayWord}
      </p>
      {word ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl">{word.e}</span>
          <div className="min-w-0 flex-1">
            <p dir="ltr" className="text-start text-xl font-black">
              {word.en}
            </p>
            <p className="text-sm text-white/60">{word.fa}</p>
          </div>
          {canSpeak && (
            <button
              type="button"
              onClick={() => speak(word.en)}
              aria-label={t.footer.listen}
              title={t.footer.listen}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-500 text-night transition hover:scale-110"
            >
              <Volume2 className="size-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 h-12 animate-pulse rounded-2xl bg-white/10" />
      )}
      <a href="/play#words" className="mt-3 inline-block text-sm font-bold text-sun-500 hover:underline">
        {t.footer.todayWordMore} {dir === 'rtl' ? '←' : '→'}
      </a>
    </div>
  );
}

export default function Footer() {
  const { t, toggle: toggleLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();

  const groups = [
    {
      title: t.nav.pages,
      links: [
        { href: '/#top', label: t.nav.home },
        ...enabledSubPages.map((p) => ({ href: p as string, label: t.nav[subPages[p].navKey] })),
      ],
    },
    {
      title: t.nav.sections,
      links: (
        ['about', 'classes', 'gallery', ...(features.reviews ? (['reviews'] as const) : []), 'faq', 'contact'] as const
      ).map((id) => ({
        href: `#${id}`,
        label: t.nav[id],
      })),
    },
  ];

  const socials = [
    {
      href: links.whatsapp(t.contactSection.waDefault),
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      hover: 'hover:bg-[#25D366]',
    },
    { href: links.instagram, label: 'Instagram', icon: <InstagramIcon />, hover: 'hover:bg-[#dd2a7b]' },
    { href: links.tel, label: t.contactSection.call, icon: <Phone className="size-5" />, hover: 'hover:bg-leaf-500' },
  ];

  return (
    <footer className="relative mt-24 flow-root bg-night text-white">
      {/* Wavy top edge. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-full h-10 w-full text-night sm:h-16"
      >
        <path fill="currentColor" d="M0 48 C 180 8 360 8 540 40 S 900 80 1080 44 S 1320 8 1440 32 V80 H0 Z" />
      </svg>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {letters.map((l) => (
          <motion.span
            key={l.ch}
            className={`absolute text-7xl font-black opacity-10 select-none sm:text-8xl ${l.className}`}
            animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 6, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            {l.ch}
          </motion.span>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        {/* Call to action, lifted over the wave. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative -mt-12 mb-12 flex flex-col items-center gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-500 to-leaf-600 p-7 text-center shadow-soft sm:-mt-16 sm:p-10 md:flex-row md:text-start"
        >
          <div aria-hidden className="absolute -end-10 -top-10 size-40 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-12 start-1/3 size-32 rounded-full bg-sun-500/20" />
          <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-4xl">🎒</div>
          <div className="relative flex-1">
            <p className="text-2xl font-black sm:text-3xl">{t.footer.ctaTitle}</p>
            <p className="mt-2 text-white/85">{t.footer.ctaText}</p>
          </div>
          <div className="relative flex flex-wrap justify-center gap-3">
            <a
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-black text-leaf-700 shadow-soft transition hover:-translate-y-0.5"
            >
              <CalendarHeart className="size-5" />
              {t.hero.primary}
            </a>
            <a
              href={links.whatsapp(t.contactSection.waDefault)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold ring-1 ring-white/30 transition hover:bg-white/25"
            >
              <WhatsAppIcon />
              {t.hero.secondary}
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 lg:grid-cols-12">
          {/* Brand. */}
          <div className="col-span-2 lg:col-span-4">
            <Logo onDark className="h-14" />
            <p className="mt-4 max-w-sm leading-7 text-white/70">{t.footer.tagline}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
              <Heart className="size-4 fill-berry-500 text-berry-500" />
              {t.about.quote}
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className={`grid size-11 place-items-center rounded-full bg-white/10 transition hover:-translate-y-1 ${s.hover}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links. */}
          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title} className="lg:col-span-2">
              <p className="mb-4 font-black text-sun-500">{g.title}</p>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="inline-block text-white/75 transition hover:translate-x-1 hover:text-white rtl:hover:-translate-x-1"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact, class facts and today's word. */}
          <div className="col-span-2 lg:col-span-4">
            <p className="mb-4 font-black text-sun-500">{t.footer.contactTitle}</p>
            <ul className="space-y-3 text-white/80">
              <li>
                <a href={links.tel} className="inline-flex items-center gap-3 transition hover:text-white">
                  <Phone className="size-5 text-leaf-500" />
                  <span dir="ltr">{contact.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 transition hover:text-white"
                >
                  <InstagramIcon className="size-5 text-berry-500" />
                  <span dir="ltr">@{contact.instagram}</span>
                </a>
              </li>
            </ul>
            <ul className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              {[t.hero.age, ...t.hero.facts].map((f) => (
                <li key={f} className="rounded-full bg-white/10 px-3 py-1.5 text-white/80">
                  {f}
                </li>
              ))}
            </ul>
            {features.wordOfTheDay && <TodayWord />}
          </div>
        </div>

        {/* Bottom bar. */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-6 pb-24 text-sm text-white/50 sm:flex-row sm:justify-between sm:pb-8">
          <p>
            © {new Date().getFullYear()} {t.about.name} — {t.footer.rights}
            <span className="mx-2">·</span>
            <span className="inline-flex items-center gap-1">
              {t.footer.madeWith} <Heart className="size-3.5 fill-berry-500 text-berry-500" />
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 font-bold text-white/80 transition hover:bg-white/20"
            >
              <Languages className="size-4" />
              {t.nav.switchLang}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
              title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label={t.nav.toTop}
              title={t.nav.toTop}
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
