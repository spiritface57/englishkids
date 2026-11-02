import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from './content';

type I18n = { lang: Lang; t: Content; dir: 'rtl' | 'ltr'; toggle: () => void };

const I18nContext = createContext<I18n | null>(null);

const initialLang = (): Lang => {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'en' || fromUrl === 'fa') return fromUrl;
  const saved = localStorage.getItem('lang');
  return saved === 'en' ? 'en' : 'fa';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const dir = lang === 'fa' ? 'rtl' : 'ltr';
  const t = content[lang] as Content;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('lang', lang);
  }, [lang, dir]);

  const toggle = () => setLang((l) => (l === 'fa' ? 'en' : 'fa'));

  return <I18nContext.Provider value={{ lang, t, dir, toggle }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
