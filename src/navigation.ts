import { features } from './features';
import type { Page } from './router';

// The site's pages in one place: used by the navbar, page titles, breadcrumbs, the home page cards, the
// "See also" links at the end of each sub-page and the footer.

// /brand (the logo stamper) is a tool for the teacher, not linked from the menus.
export type SubPage = Exclude<Page, '/' | '/brand'>;

type Info = {
  emoji: string;
  enabled: boolean;
  navKey: 'playPage' | 'levelTest' | 'parents'; // label in content.ts → nav
  fa: { text: string; cta: string };
  en: { text: string; cta: string };
};

export const subPages: Record<SubPage, Info> = {
  '/play': {
    emoji: '🎮',
    enabled: true,
    navKey: 'playPage',
    fa: { text: 'کارت‌های کلمه، آزمون، قصه‌ها، تلفظ و بازی‌های حافظه و کلمه‌یابی', cta: 'برویم بازی!' },
    en: { text: 'Word cards, quizzes, stories, speaking, memory and word search games', cta: "Let's play!" },
  },
  '/level-test': {
    emoji: '🧭',
    enabled: features.levelTest,
    navKey: 'levelTest',
    fa: { text: 'سطح زبان فرزندتان را در ۳ دقیقه ببینید؛ رایگان', cta: 'شروع آزمون' },
    en: { text: "See your child's English level in 3 minutes, for free", cta: 'Start the test' },
  },
  '/parents': {
    emoji: '👨‍👩‍👧',
    enabled: features.parentsCorner,
    navKey: 'parents',
    fa: { text: 'راهنمای تمرین در خانه و کاربرگ‌های قابل چاپ', cta: 'خواندن نکته‌ها' },
    en: { text: 'Tips for practising at home and printable worksheets', cta: 'Read the tips' },
  },
};

export const enabledSubPages = (Object.keys(subPages) as SubPage[]).filter((p) => subPages[p].enabled);
