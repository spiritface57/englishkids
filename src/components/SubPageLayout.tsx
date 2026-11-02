import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useI18n } from '../i18n';
import { enabledSubPages, subPages, type SubPage } from '../navigation';
import PageCards from './PageCards';

// Frame for every sub-page: a breadcrumb at the top ("Home › Play & learn") and links to the other pages at the end.
export default function SubPageLayout({ page, children }: { page: SubPage; children: ReactNode }) {
  const { t, lang } = useI18n();
  const Sep = lang === 'fa' ? ChevronLeft : ChevronRight;

  return (
    <div className="pt-24">
      <nav aria-label="breadcrumb" className="px-5">
        <ol className="mx-auto flex max-w-6xl items-center gap-1.5 text-sm font-bold text-ink/60">
          <li>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-ink/5 hover:text-ink"
            >
              <Home className="size-4" />
              {t.nav.home}
            </a>
          </li>
          <li aria-hidden="true">
            <Sep className="size-4" />
          </li>
          <li aria-current="page" className="px-2 py-1 text-ink">
            {subPages[page].emoji} {t.nav[subPages[page].navKey]}
          </li>
        </ol>
      </nav>

      {children}

      <section className="border-t border-ink/10 px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-black">{t.nav.seeAlso}</h2>
          <PageCards pages={enabledSubPages.filter((p) => p !== page)} withBooking />
        </div>
      </section>
    </div>
  );
}
