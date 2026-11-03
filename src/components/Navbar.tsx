import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Languages, Menu, Moon, Sun, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import Logo from './Logo';
import { usePage } from '../router';
import { enabledSubPages, subPages } from '../navigation';
import { features } from '../features';

// Home-page sections that the menu links to (links from a sub-page go back to the home page).
const homeSections = ['about', 'classes', 'gallery', 'reviews', 'faq', 'contact'] as const;
// Shown in the desktop bar; the mobile menu shows everything.
const desktopSections = new Set<string>(['about', 'classes', 'reviews', 'contact']);

export default function Navbar() {
  const { t, lang, toggle } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [spied, setSpied] = useState<string>('');
  const page = usePage();
  // On the home page the section in view is highlighted; on a sub-page, that page.
  const active = page === '/' ? spied : page;

  // Menu order: about, classes, the pages, gallery, reviews, FAQ, contact.
  const section = (id: (typeof homeSections)[number]) => ({
    id,
    href: `#${id}`,
    label: t.nav[id],
    desktop: desktopSections.has(id),
  });
  const items = [
    section('about'),
    section('classes'),
    ...enabledSubPages.map((p) => ({
      id: p as string,
      href: p as string,
      label: t.nav[subPages[p].navKey],
      desktop: true,
    })),
    section('gallery'),
    ...(features.reviews ? [section('reviews')] : []),
    section('faq'),
    section('contact'),
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    if (page !== '/') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSpied(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    homeSections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [page]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-300 ${
          scrolled || page !== '/' ? 'bg-surface/85 shadow-soft backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <a href="/#top" className="shrink-0" aria-label={`${t.nav.home}: Miss Leila — English for Kids`}>
          <Logo className="h-10 sm:h-11" />
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {items
            .filter((it) => it.desktop)
            .map((it) => (
              <li key={it.id}>
                <a
                  href={it.href}
                  aria-current={active === it.id ? 'page' : undefined}
                  className={`relative rounded-full px-2 py-2 text-[15px] xl:px-3 font-semibold whitespace-nowrap transition-colors ${
                    active === it.id ? 'text-leaf-700' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {active === it.id && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-leaf-100" />
                  )}
                  {it.label}
                </a>
              </li>
            ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title={t.nav.switchLang}
            aria-label={t.nav.switchLang}
            className="relative grid size-10 place-items-center rounded-full border border-ink/10 bg-surface transition hover:border-leaf-500 hover:text-leaf-700"
          >
            <Languages className="size-5" />
            <span className="absolute -end-1 -bottom-1 rounded-full bg-leaf-500 px-1 text-[10px] leading-4 font-black text-white">
              {lang === 'fa' ? 'EN' : 'فا'}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
            aria-label={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
            className="grid size-10 place-items-center overflow-hidden rounded-full border border-ink/10 bg-surface transition hover:border-sun-500 hover:text-sun-500"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ y: 16, rotate: -90, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                exit={{ y: -16, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <a
            href="#booking"
            className="hidden rounded-full bg-sun-500 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-night shadow-[0_8px_20px_-8px_rgb(255_204_0/0.8)] transition hover:-translate-y-0.5 hover:bg-sun-600 sm:inline-flex"
          >
            {t.nav.book}
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-soft lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-h-[calc(100vh-6rem)] max-w-6xl overflow-y-auto rounded-2xl bg-surface p-3 shadow-soft lg:hidden"
          >
            <a
              href="/#top"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold hover:bg-leaf-50"
            >
              {t.nav.home}
            </a>
            {items.map((it) => (
              <a
                key={it.id}
                href={it.href}
                onClick={() => setOpen(false)}
                aria-current={active === it.id ? 'page' : undefined}
                className={`block rounded-xl px-4 py-3 font-semibold ${
                  active === it.id ? 'bg-leaf-100 text-leaf-700' : 'hover:bg-leaf-50'
                }`}
              >
                {it.label}
              </a>
            ))}
            <a
              href="#booking"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-sun-500 px-4 py-3 text-center font-bold text-night"
            >
              {t.nav.book}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
