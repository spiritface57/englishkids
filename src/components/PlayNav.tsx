import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { features } from '../features';
import { useLocation } from '../router';
import { activities, activityHref } from './activities/registry';

// The play page's own menu: word cards, quiz, word of the day and every activity, always one tap away.
// It sticks under the main navbar. On wider screens all items wrap into view; on phones it is one row you swipe,
// with faded edges as a hint and the selected item scrolled into view.

const text = {
  fa: { label: 'بخش‌های بازی', cards: 'کارت‌های کلمه', quiz: 'آزمون', wotd: 'کلمه‌ی روز' },
  en: { label: 'Play sections', cards: 'Word cards', quiz: 'Quiz', wotd: 'Word of the day' },
};

// Fades both ends of the swipeable row (phones only); mask direction does not depend on rtl/ltr.
const edgeFade =
  '[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]';

export default function PlayNav() {
  const { lang } = useI18n();
  const s = text[lang];
  const { params } = useLocation();
  const activity = params.get('activity');
  const game = params.get('game') === 'quiz' ? 'quiz' : 'cards';
  const activeRef = useRef<HTMLAnchorElement>(null);

  const items = [
    { id: 'cards', href: '/play?game=cards#words', emoji: '🃏', label: s.cards, active: !activity && game === 'cards' },
    { id: 'quiz', href: '/play?game=quiz#words', emoji: '🏆', label: s.quiz, active: !activity && game === 'quiz' },
    ...(features.wordOfTheDay
      ? [{ id: 'wotd', href: '/play#word-of-the-day', emoji: '📅', label: s.wotd, active: false }]
      : []),
    ...activities.map((a) => ({
      id: a.slug,
      href: activityHref(a),
      emoji: a.emoji,
      label: a[lang].title,
      active: activity === a.slug,
    })),
  ];
  const activeId = items.find((it) => it.active)?.id;

  // Keep the selected item visible in the swipeable row (only scrolls the row, not the page).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeId]);

  return (
    <nav aria-label={s.label} className="sticky top-[4.6rem] z-40 mt-4 px-3">
      <div className="mx-auto max-w-6xl rounded-2xl bg-surface/90 shadow-soft backdrop-blur-md">
        <ul
          className={`flex gap-1.5 overflow-x-auto p-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible ${edgeFade}`}
        >
          {items.map((it) => (
            <li key={it.id} className="shrink-0">
              <a
                ref={it.active ? activeRef : undefined}
                href={it.href}
                aria-current={it.active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap transition ${
                  it.active ? 'bg-grape-500 text-white' : 'text-ink/70 hover:bg-grape-50 hover:text-grape-600'
                }`}
              >
                <span>{it.emoji}</span>
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
