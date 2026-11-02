import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

// The initial class is set by the inline script in index.html before first paint.
const current = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

// Every useTheme() instance (navbar, palette switcher) listens for this so they stay in sync.
const EVENT = 'themechange';

const setMetaColor = (theme: Theme) =>
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0E1512' : '#009B4D');

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current);

  useEffect(() => {
    setMetaColor(current());
    const sync = () => setTheme(current());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = () => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setMetaColor(next);
    localStorage.setItem('theme', next);
    window.dispatchEvent(new Event(EVENT));
  };

  return { theme, toggle };
}
