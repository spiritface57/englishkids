import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { features } from '../features';
import { goBackOr, useLocation } from '../router';
import { activities, activityHref } from './activities/registry';
import { Reveal, Section, SectionHeading } from './ui';

// "Learning playground": a grid of activities. The open activity is part of the URL (/play?activity=stories), so it
// can be linked to, and the browser's back button closes it.

const WordOfTheDay = lazy(() => import('./activities/WordOfTheDay'));

const text = {
  fa: {
    eyebrow: 'زمین بازی یادگیری',
    title: 'هر روز یک ماجراجویی تازه با انگلیسی',
    lead: 'بازی کن، حرف بزن، قصه بخوان و برچسب جمع کن. همه‌چیز همین‌جا و رایگان!',
    close: 'بستن',
  },
  en: {
    eyebrow: 'Learning playground',
    title: 'A new English adventure every day',
    lead: 'Play, speak, read stories and collect stickers. All right here, for free!',
    close: 'Close',
  },
};

export default function Playground() {
  const { lang } = useI18n();
  const s = text[lang];
  const { params } = useLocation();
  const open = activities.find((a) => a.slug === params.get('activity')) ?? null;
  const close = () => goBackOr('/play');

  // Esc closes the window; the page behind does not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const loading = (
    <div className="grid min-h-40 place-items-center">
      <Loader2 className="size-8 animate-spin text-grape-500" />
    </div>
  );

  return (
    <Section id="playground" className="bg-cream">
      <SectionHeading eyebrow={s.eyebrow} title={s.title} lead={s.lead} tone="sun" />

      {features.wordOfTheDay && (
        <div id="word-of-the-day" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
          <Suspense fallback={loading}>
            <WordOfTheDay />
          </Suspense>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {activities.map((a, i) => (
          <Reveal key={a.key} delay={i * 0.05}>
            <motion.a
              href={activityHref(a)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              className={`flex h-full w-full flex-col items-center gap-2 rounded-[2rem] border-4 border-surface p-5 text-center shadow-soft ${a.tone}`}
            >
              <span className="text-5xl">{a.emoji}</span>
              <span className="text-lg font-black">{a[lang].title}</span>
              <span className="text-sm text-ink/60">{a[lang].text}</span>
            </motion.a>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center bg-night/70 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={open[lang].title}
              initial={{ y: 30, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-cream shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
                <span className="text-3xl">{open.emoji}</span>
                <h3 className="flex-1 text-xl font-black">{open[lang].title}</h3>
                <button
                  onClick={close}
                  aria-label={s.close}
                  className="grid size-10 place-items-center rounded-full hover:bg-ink/10"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 sm:p-7">
                <Suspense fallback={loading}>
                  <open.Component key={open.slug} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
