import { useEffect, useRef } from 'react';

// Cloudflare Turnstile widget (bot protection for the booking form). The token it produces is checked by the worker.

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      language?: string;
      theme?: 'auto' | 'light' | 'dark';
      size?: 'normal' | 'flexible' | 'compact';
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | undefined;

const loadScript = () =>
  (scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = undefined;
      reject(new Error('turnstile_load_failed'));
    };
    document.head.appendChild(s);
  }));

export default function Turnstile({ siteKey, lang, onToken }: { siteKey: string; lang: string; onToken: (token: string) => void }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !el.current || !window.turnstile) return;
        id = window.turnstile.render(el.current, {
          sitekey: siteKey,
          language: lang,
          theme: 'auto',
          size: 'flexible',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [siteKey, lang, onToken]);

  return <div ref={el} className="min-h-[65px]" />;
}
