import { lazy, Suspense } from 'react';
import { useI18n } from '../i18n';
import { features } from '../features';
import { enabledSubPages } from '../navigation';
import PageCards from './PageCards';
import { Section, SectionHeading } from './ui';

// A short "play & learn" strip on the home page: today's word plus links to the separate pages
// (games, level test, parents), so the home page stays short and light.

const WordOfTheDay = lazy(() => import('./activities/WordOfTheDay'));

const text = {
  fa: {
    eyebrow: 'بازی کنیم!',
    title: 'یادگیری با بازی، هر روز',
    lead: 'بازی‌های کلمه، قصه‌های خواندنی، تمرین تلفظ و کلی سرگرمی دیگر؛ رایگان و بدون ثبت‌نام.',
  },
  en: {
    eyebrow: "Let's play!",
    title: 'Learning through play, every day',
    lead: 'Word games, read-along stories, speaking practice and lots more: free, no sign-up.',
  },
};

export default function PlayTeaser() {
  const { lang } = useI18n();
  const s = text[lang];

  return (
    <Section id="play" className="overflow-hidden bg-grape-50">
      <div className="dotted-bg absolute inset-0 opacity-60" />
      <div className="relative">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} lead={s.lead} tone="grape" />

        {features.wordOfTheDay && (
          <div className="mx-auto mt-10 max-w-3xl">
            <Suspense>
              <WordOfTheDay />
            </Suspense>
          </div>
        )}

        <div className="mt-8">
          <PageCards pages={enabledSubPages} />
        </div>
      </div>
    </Section>
  );
}
