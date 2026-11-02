import { useEffect, useState } from 'react';
import { kidStorage } from './profiles';

// Stickers children collect across the site's games. Saved only in this browser, per child profile (no accounts,
// nothing sent anywhere).

export const stickers = [
  { id: 'cards-round', emoji: '🃏', fa: 'همه‌ی کارت‌ها', en: 'All cards flipped' },
  { id: 'quiz-first', emoji: '🎯', fa: 'اولین آزمون', en: 'First quiz' },
  { id: 'quiz-perfect', emoji: '💯', fa: 'آزمون بی‌نقص', en: 'Perfect quiz' },
  { id: 'quiz-hard', emoji: '🔥', fa: 'قهرمان سطح سخت', en: 'Hard-level hero' },
  { id: 'level-test', emoji: '🧭', fa: 'تعیین سطح', en: 'Level test done' },
  { id: 'speak-first', emoji: '🎤', fa: 'اولین کلمه‌ی گفته‌شده', en: 'First word spoken' },
  { id: 'speak-star', emoji: '🌟', fa: 'ستاره‌ی تلفظ', en: 'Speaking star' },
  { id: 'sentence-5', emoji: '🧱', fa: 'جمله‌ساز', en: 'Sentence builder' },
  { id: 'story-read', emoji: '📖', fa: 'قصه‌خوان', en: 'Story reader' },
  { id: 'memory-win', emoji: '🧠', fa: 'حافظه‌ی قوی', en: 'Memory master' },
  { id: 'wordsearch-win', emoji: '🔍', fa: 'کارآگاه کلمه', en: 'Word detective' },
  { id: 'hangman-win', emoji: '🎈', fa: 'نجات بادکنک', en: 'Balloon saver' },
  { id: 'wotd-3', emoji: '📅', fa: '۳ روز پشت سر هم', en: '3-day streak' },
  { id: 'wotd-7', emoji: '🏅', fa: '۷ روز پشت سر هم', en: '7-day streak' },
  { id: 'seasonal', emoji: '🎉', fa: 'جشن کلمه‌ها', en: 'Festival words' },
  { id: 'worksheet', emoji: '🖨️', fa: 'کاربرگ', en: 'Worksheet printed' },
] as const;

export type StickerId = (typeof stickers)[number]['id'];

const KEY = 'stickers';
const EVENT = 'sticker-awarded';

const read = (): StickerId[] => {
  try {
    return JSON.parse(kidStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
};

// Gives a sticker once; returns true when it is new. A toast announces new stickers (see StickerToast).
export function awardSticker(id: StickerId) {
  const owned = read();
  if (owned.includes(id)) return false;
  kidStorage.setItem(KEY, JSON.stringify([...owned, id]));
  window.dispatchEvent(new CustomEvent<StickerId>(EVENT, { detail: id }));
  return true;
}

// Counts how often something happened (e.g. words spoken correctly); returns the new count.
export function bump(counter: string) {
  const key = `count:${counter}`;
  const n = (Number(kidStorage.getItem(key)) || 0) + 1;
  kidStorage.setItem(key, String(n));
  return n;
}

export function useStickers() {
  const [owned, setOwned] = useState<StickerId[]>(read);
  useEffect(() => {
    const sync = () => setOwned(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return owned;
}

// Calls back with each newly awarded sticker.
export function onSticker(callback: (id: StickerId) => void) {
  const handler = (e: Event) => callback((e as CustomEvent<StickerId>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
