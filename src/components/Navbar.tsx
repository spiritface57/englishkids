import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import {
  CalendarHeart,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  House,
  Images,
  Languages,
  Menu,
  MessageSquareHeart,
  Moon,
  Phone,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import Logo from './Logo';
import { usePage } from '../router';
import { enabledSubPages, subPages, type SubPage } from '../navigation';
import { features } from '../features';
import { links } from '../content';
import { WhatsAppIcon } from './ui';

// Home-page sections that the menu links to (links from a sub-page go back to the home page).
const homeSections = ['about', 'classes', 'gallery', 'reviews', 'faq', 'contact'] as const;
type SectionId = (typeof homeSections)[number];
const sectionIcons: Record<SectionId, LucideIcon> = {
  about: UserRound,
  classes: GraduationCap,
  gallery: Images,
  reviews: MessageSquareHeart,
  faq: CircleHelp,
  contact: Phone,
};
// The desktop bar: about, classes, [Learn ▾ the pages], reviews, FAQ, contact. Gallery is in the mobile menu and footer.
const desktopSections = new Set<SectionId>(['about', 'classes', 'reviews', 'faq', 'contact']);

const shownSections = homeSections.filter((id) => id !== 'reviews' || features.reviews);

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative rounded-full px-2 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors xl:px-3 ${
        active ? 'text-leaf-700' : 'text-ink/70 hover:text-ink'
      }`}
    >
      {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-leaf-100" />}
      {children}
    </a>
  );
}

// "Learn ▾": the site's pages with a line about each. Opens on hover or click, closes on Escape or a click outside.
function LearnMenu({ active }: { active: string }) {
  const { t, lang } = useI18n();
  const page = usePage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const current = enabledSubPages.includes(active as SubPage);

  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        timer.current = setTimeout(() => setOpen(false), 150);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative inline-flex items-center gap-1 rounded-full px-2 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors xl:px-3 ${
          current ? 'text-leaf-700' : 'text-ink/70 hover:text-ink'
        }`}
      >
        {current && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-leaf-100" />}
        {t.nav.learn}
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute start-1/2 top-full w-[23rem] -translate-x-1/2 pt-3 rtl:translate-x-1/2">
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="rounded-3xl bg-surface p-2 shadow-soft ring-1 ring-ink/5"
            >
              {enabledSubPages.map((p) => (
                <li key={p}>
                  <a
                    href={p}
                    aria-current={active === p ? 'page' : undefined}
                    className={`flex items-start gap-3 rounded-2xl p-3 transition ${
                      active === p ? 'bg-leaf-100' : 'hover:bg-leaf-50'
                    }`}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream text-2xl">
                      {subPages[p].emoji}
                    </span>
                    <span>
                      <span className="block font-black">{t.nav[subPages[p].navKey]}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-ink/60">{subPages[p][lang].text}</span>
                    </span>
                  </a>
                </li>
              ))}
            </motion.ul>
          </div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Navbar() {
  const { t, lang, dir, toggle } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [spied, setSpied] = useState<string>('');
  const page = usePage();
  // On the home page the section in view is highlighted; on a sub-page, that page.
  const active = page === '/' ? spied : page;
  // Reading progress along the bottom of the bar.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

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

  // The mobile panel: Escape closes it and the page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const iconButton =
    'grid size-10 place-items-center rounded-full border border-ink/10 bg-surface transition hover:border-leaf-500 hover:text-leaf-700';
  const sectionLink = (id: SectionId) => (
    <li key={id}>
      <NavLink href={`#${id}`} active={active === id}>
        {t.nav[id]}
      </NavLink>
    </li>
  );
  const closeMenu = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <nav
        className={`relative mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-300 ${
          scrolled || page !== '/' ? 'bg-surface/85 shadow-soft backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <a href="/#top" className="shrink-0" aria-label={`${t.nav.home}: Miss Leila — English for Kids`}>
          <Logo className="h-10 sm:h-11" />
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {sectionLink('about')}
          {sectionLink('classes')}
          {enabledSubPages.length > 0 && <LearnMenu active={active} />}
          {shownSections.filter((id) => desktopSections.has(id) && id !== 'about' && id !== 'classes').map(sectionLink)}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title={t.nav.switchLang}
            aria-label={t.nav.switchLang}
            className={`relative ${iconButton}`}
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
            className={`overflow-hidden ${iconButton} hover:border-sun-500 hover:text-sun-500`}
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
            href="/#booking"
            className="hidden items-center gap-2 rounded-full bg-sun-500 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-night shadow-[0_8px_20px_-8px_rgb(255_204_0/0.8)] transition hover:-translate-y-0.5 hover:bg-sun-600 sm:inline-flex"
          >
            <CalendarHeart className="size-4" />
            {t.nav.book}
          </a>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface text-ink shadow-soft lg:hidden"
            aria-label={t.nav.menu}
            aria-expanded={open}
          >
            <Menu className="size-5" />
          </button>
        </div>

        {(scrolled || page !== '/') && (
          <motion.span
            aria-hidden
            style={{ scaleX: progress }}
            className="absolute inset-x-5 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-leaf-500 to-sun-500 rtl:origin-right rtl:bg-gradient-to-l"
          />
        )}
      </nav>

      {/* Mobile: a side panel with every section, the pages as cards, and the ways to get in touch. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-night/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.menu}
              className="fixed inset-y-0 end-0 z-[60] flex w-[min(22rem,88vw)] flex-col bg-cream shadow-2xl lg:hidden"
              initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
                <Logo className="h-10" />
                <button onClick={closeMenu} aria-label={t.nav.closeMenu} className={iconButton}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <ul>
                  {(
                    [
                      { id: 'home', href: '/#top', label: t.nav.home, Icon: House },
                      ...shownSections.map((id) => ({ id, href: `#${id}`, label: t.nav[id], Icon: sectionIcons[id] })),
                    ] as const
                  ).map(({ id, href, label, Icon }) => {
                    const current = active === id || (id === 'home' && page === '/' && !spied);
                    return (
                      <li key={id}>
                        <a
                          href={href}
                          onClick={closeMenu}
                          aria-current={current ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold transition ${
                            current ? 'bg-leaf-100 text-leaf-700' : 'hover:bg-surface'
                          }`}
                        >
                          <span
                            className={`grid size-9 place-items-center rounded-xl ${current ? 'bg-surface' : 'bg-surface/70'}`}
                          >
                            <Icon className="size-[18px]" />
                          </span>
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>

                {enabledSubPages.length > 0 && (
                  <>
                    <p className="mt-5 mb-2 px-3 text-xs font-bold text-ink/45">{t.nav.learn}</p>
                    <ul className="space-y-2">
                      {enabledSubPages.map((p) => (
                        <li key={p}>
                          <a
                            href={p}
                            onClick={closeMenu}
                            aria-current={active === p ? 'page' : undefined}
                            className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition ${
                              active === p
                                ? 'border-leaf-500 bg-leaf-50'
                                : 'border-transparent bg-surface hover:border-leaf-200'
                            }`}
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream text-2xl">
                              {subPages[p].emoji}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-black">{t.nav[subPages[p].navKey]}</span>
                              <span className="block text-xs leading-5 text-ink/55">{subPages[p][lang].text}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="space-y-2 border-t border-ink/5 p-4">
                <a
                  href="/#booking"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-sun-500 px-4 py-3 font-bold text-night"
                >
                  <CalendarHeart className="size-5" />
                  {t.nav.book}
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={links.whatsapp(t.contactSection.waDefault)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3 text-sm font-bold text-white"
                  >
                    <WhatsAppIcon className="size-4" />
                    {t.contactSection.whatsapp}
                  </a>
                  <a
                    href={links.tel}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-surface px-3 py-3 text-sm font-bold ring-1 ring-ink/10"
                  >
                    <Phone className="size-4" />
                    {t.contactSection.call}
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
