import { useEffect, useRef, useState } from 'react';

// Minimal client-side routing for the few pages of the site (no library needed).
// Normal <a href> links keep working: same-site page links switch pages without a reload, and "#section" links
// from a sub-page go to that section on the home page. Cloudflare serves index.html for every path (wrangler.toml).
// Query parameters carry in-page state that should be linkable, e.g. /play?activity=stories or /play?game=quiz.

export const pages = ['/', '/play', '/level-test', '/parents'] as const;
export type Page = (typeof pages)[number];

const currentPage = (): Page => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return (pages as readonly string[]).includes(path) ? (path as Page) : '/';
};

// `visit` counts navigations, so clicking the same #section link again scrolls to it again.
let visits = 0;
const read = () => ({ page: currentPage(), search: window.location.search, hash: window.location.hash, visit: visits });

// `internal` marks history entries made by the site, so "close" can go back instead of leaving the site.
export function navigate(url: string, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({ internal: true }, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Goes back when the previous entry is ours (e.g. closing an activity opened from the page), else replaces the URL.
export function goBackOr(url: string) {
  if ((window.history.state as { internal?: boolean } | null)?.internal) window.history.back();
  else navigate(url, { replace: true });
}

export function useLocation() {
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const sync = () => {
      visits++;
      setLoc(read());
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return { ...loc, params: new URLSearchParams(loc.search) };
}

export const usePage = () => useLocation().page;

// Handles clicks on links anywhere in the page (installed once from main.tsx).
export function installLinkHandling() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) {
      if (currentPage() !== '/') {
        e.preventDefault();
        navigate(`/${href}`);
      }
      return;
    }
    const url = new URL(a.href);
    if (url.origin !== window.location.origin || !(pages as readonly string[]).includes(url.pathname)) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
}

// After navigating: go to the #section if there is one (it may still be loading); on a new page without one, go to
// the top. Changes of the query only (opening an activity) keep the scroll position.
export function useScrollOnNavigate() {
  const { page, search, hash, visit } = useLocation();
  const lastPage = useRef<Page | null>(null);
  useEffect(() => {
    const pageChanged = lastPage.current !== page;
    lastPage.current = page;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) {
      if (pageChanged) window.scrollTo({ top: 0 });
      return;
    }
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 40) {
        clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
    return () => clearInterval(timer);
  }, [page, search, hash, visit]);
}
