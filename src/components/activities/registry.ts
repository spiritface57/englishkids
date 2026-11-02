import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { features, type Feature } from '../../features';

// The playground activities: each opens in a window at /play?activity=<slug>, and its code loads only when opened.
// Turn activities on/off in src/features.ts.

export type Activity = {
  key: Feature;
  slug: string;
  emoji: string;
  tone: string;
  fa: { title: string; text: string };
  en: { title: string; text: string };
  Component: LazyExoticComponent<ComponentType>;
};

const all: Activity[] = [
  {
    key: 'speak',
    slug: 'speak',
    emoji: '🎤',
    tone: 'bg-berry-100',
    fa: { title: 'بگو ببینم!', text: 'کلمه را بلند بگو و ستاره بگیر' },
    en: { title: 'Say it!', text: 'Say the word out loud and earn stars' },
    Component: lazy(() => import('./SpeakPractice')),
  },
  {
    key: 'sentenceBuilder',
    slug: 'sentences',
    emoji: '🧱',
    tone: 'bg-sun-100',
    fa: { title: 'جمله‌ساز', text: 'کلمه‌ها را به ترتیب درست بچین' },
    en: { title: 'Sentence builder', text: 'Put the words in the right order' },
    Component: lazy(() => import('./SentenceBuilder')),
  },
  {
    key: 'stories',
    slug: 'stories',
    emoji: '📖',
    tone: 'bg-leaf-100',
    fa: { title: 'قصه‌های خواندنی', text: 'گوش کن و همراه قصه بخوان' },
    en: { title: 'Read-along stories', text: 'Listen and read along' },
    Component: lazy(() => import('./Stories')),
  },
  {
    key: 'memory',
    slug: 'memory',
    emoji: '🧠',
    tone: 'bg-grape-100',
    fa: { title: 'بازی حافظه', text: 'تصویر و کلمه را جفت کن' },
    en: { title: 'Memory match', text: 'Match each picture with its word' },
    Component: lazy(() => import('./MemoryMatch')),
  },
  {
    key: 'wordSearch',
    slug: 'word-search',
    emoji: '🔍',
    tone: 'bg-sun-100',
    fa: { title: 'کلمه‌یاب', text: 'کلمه‌های پنهان را پیدا کن' },
    en: { title: 'Word search', text: 'Find the hidden words' },
    Component: lazy(() => import('./WordSearch')),
  },
  {
    key: 'hangman',
    slug: 'balloons',
    emoji: '🎈',
    tone: 'bg-berry-100',
    fa: { title: 'نجات بادکنک‌ها', text: 'قبل از پرواز بادکنک‌ها کلمه را حدس بزن' },
    en: { title: 'Save the balloons', text: 'Guess the word before the balloons fly away' },
    Component: lazy(() => import('./Hangman')),
  },
  {
    key: 'seasonal',
    slug: 'festivals',
    emoji: '🎉',
    tone: 'bg-leaf-100',
    fa: { title: 'کلمه‌های جشن‌ها', text: 'نوروز، یلدا، هالووین و کریسمس' },
    en: { title: 'Festival words', text: 'Nowruz, Yalda, Halloween and Christmas' },
    Component: lazy(() => import('./Seasonal')),
  },
  {
    key: 'stickerBook',
    slug: 'stickers',
    emoji: '🎖️',
    tone: 'bg-grape-100',
    fa: { title: 'دفترچه‌ی برچسب‌ها', text: 'برچسب جمع کن و گواهی‌نامه بگیر' },
    en: { title: 'Sticker book', text: 'Collect stickers and get a certificate' },
    Component: lazy(() => import('./StickerBook')),
  },
];

export const activities = all.filter((a) => features[a.key]);
export const activityHref = (a: Activity) => `/play?activity=${a.slug}`;
