import type { Word } from './data/words';

// One word per local calendar day, the same for everyone (picked from a hash of the date).
// Shared by the word-of-the-day activity and the footer.

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const shiftDay = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// FNV-1a: small, stable string hash.
const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};
export const pick = (list: Word[], d: Date) => list[hash(dayKey(d)) % list.length];

// Words with an emoji, in plain code-unit order so every browser and language setting sorts the same way.
export const loadDailyWords = () =>
  import('./data/words').then(({ words }) =>
    words.filter((w) => w.e).sort((a, b) => (a.en < b.en ? -1 : a.en > b.en ? 1 : 0)),
  );
