import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  GalleryHorizontal,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  MessageSquareHeart,
  PenLine,
  Quote,
  Send,
  Star,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { links, turnstileSiteKey } from '../content';
import { useLocation } from '../router';
import { Reveal, Section, SectionHeading, WhatsAppIcon } from './ui';
import Turnstile from './Turnstile';

// Parents' reviews. New reviews go to the teacher by email and only appear here once she approves them
// (see worker/reviews.ts). Send parents https://englishkids.ir/?review=write#reviews to open the form directly.

type Review = {
  id: string;
  name: string;
  child: string;
  rating: number;
  text: string;
  lang: 'fa' | 'en'; // the language it was written in
  translation?: {
    lang: 'fa' | 'en';
    name: string;
    child: string;
    text: string;
  };
  createdAt: string;
};

// Six reviews a page; "show all" switches to big pages (the cap keeps a long list from becoming one endless page).
const PAGE_SIZE = 6;
const ALL_PAGE_SIZE = 50;

function Stars({ value, className = 'size-5' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-sun-500" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= value ? 'fill-current' : 'text-ink/15'}`} />
      ))}
    </span>
  );
}

const inputCls =
  'w-full rounded-2xl border-2 border-ink/10 bg-surface px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-leaf-500 focus:ring-4 focus:ring-leaf-100';

type Status = 'idle' | 'sending' | 'thanks' | 'failed';

function ReviewForm({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const [name, setName] = useState('');
  const [child, setChild] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot, must stay empty
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0); // bump to get a fresh widget (tokens are single-use)
  const onToken = useCallback((token: string) => setCaptchaToken(token), []);

  const waText = () => `${r.waIntro}\n${'★'.repeat(rating)}\n${text}\n— ${name}${child ? ` (${child})` : ''}`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || !rating || text.trim().length < 10 || !consent) {
      setError(r.required);
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      setError(r.captchaRequired);
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          child,
          rating,
          text,
          consent,
          website,
          lang,
          turnstileToken: captchaToken,
        }),
      });
      if (res.ok) setStatus('thanks');
      else if (res.status === 403 || res.status === 429) {
        setError(res.status === 403 ? r.captchaFailed : r.rateLimited);
        setStatus('idle');
      } else setStatus('failed');
    } catch {
      setStatus('failed');
    }
    setCaptchaToken('');
    setCaptchaKey((k) => k + 1);
  };

  if (status === 'thanks' || status === 'failed') {
    return (
      <div className="py-6 text-center" role="status">
        <div
          className={`mx-auto grid size-20 place-items-center rounded-full ${status === 'thanks' ? 'bg-leaf-100 text-leaf-600' : 'bg-sun-100 text-sun-700'}`}
        >
          {status === 'thanks' ? <MessageSquareHeart className="size-10" /> : <WhatsAppIcon className="size-10" />}
        </div>
        {status === 'thanks' && <h3 className="mt-5 text-2xl font-black">{r.thanksTitle}</h3>}
        <p className="mx-auto mt-3 max-w-sm leading-8 text-ink/70">{status === 'thanks' ? r.thanksText : r.failed}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {status === 'failed' && (
            <a
              href={links.whatsapp(waText())}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white"
            >
              <WhatsAppIcon />
              {r.viaWhatsapp}
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-leaf-500"
          >
            {r.close}
          </button>
        </div>
      </div>
    );
  }

  const shown = hover || rating;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-2xl font-black">{r.formTitle}</h3>
        <p className="mt-1 text-sm text-ink/60">{r.formLead}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink/80">
          {r.rating}
          <span className="text-berry-500"> *</span>
        </legend>
        <div className="flex gap-1" dir="ltr" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={r.star(n)}
              aria-pressed={rating === n}
              className="rounded-full p-1 transition hover:scale-115 focus-visible:ring-4 focus-visible:ring-sun-200 focus-visible:outline-none"
            >
              <Star className={`size-9 ${n <= shown ? 'fill-sun-500 text-sun-500' : 'text-ink/20'}`} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink/80">
            {r.name}
            <span className="text-berry-500"> *</span>
          </span>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={r.namePlaceholder}
            maxLength={60}
            autoComplete="name"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink/80">{r.child}</span>
          <input
            className={inputCls}
            value={child}
            onChange={(e) => setChild(e.target.value)}
            placeholder={r.childPlaceholder}
            maxLength={40}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 flex justify-between text-sm font-bold text-ink/80">
          <span>
            {r.text}
            <span className="text-berry-500"> *</span>
          </span>
          <span className="font-normal text-ink/40">{(600 - text.length).toLocaleString(lang)}</span>
        </span>
        <textarea
          className={`${inputCls} min-h-32 resize-y`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={r.textPlaceholder}
          maxLength={600}
          dir="auto"
        />
      </label>

      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-leaf-500"
        />
        {r.consent}
      </label>

      {turnstileSiteKey && <Turnstile key={captchaKey} siteKey={turnstileSiteKey} lang={lang} onToken={onToken} />}

      {error && (
        <p role="alert" className="rounded-2xl bg-berry-100 px-4 py-3 text-sm font-bold text-berry-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-7 py-3 font-black text-white shadow-pop transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === 'sending' ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5 rtl:-scale-x-100" />
          )}
          {r.submit}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-ink/30"
        >
          {r.cancel}
        </button>
      </div>
    </form>
  );
}

// One accent per card (avatar + quote mark), on a calm white surface so a row of reviews reads as one set.
const accents = [
  {
    avatar: 'bg-leaf-100 text-leaf-700',
    quote: 'text-leaf-500/15',
    bar: 'bg-leaf-500',
  },
  {
    avatar: 'bg-sun-100 text-sun-700',
    quote: 'text-sun-500/25',
    bar: 'bg-sun-500',
  },
  {
    avatar: 'bg-berry-100 text-berry-600',
    quote: 'text-berry-500/15',
    bar: 'bg-berry-500',
  },
  {
    avatar: 'bg-grape-100 text-grape-600',
    quote: 'text-grape-500/15',
    bar: 'bg-grape-500',
  },
];
const CLAMP_AT = 220; // characters; in fixed-height layouts longer reviews get "read more", which scrolls inside the card

// Visitors pick how the reviews are laid out; the choice is remembered on their device.
type View = 'grid' | 'masonry' | 'carousel';
const VIEWS: { id: View; Icon: typeof LayoutGrid }[] = [
  { id: 'carousel', Icon: GalleryHorizontal },
  { id: 'grid', Icon: LayoutGrid },
  { id: 'masonry', Icon: LayoutDashboard },
];
const VIEW_KEY = 'reviewsView';
const savedView = (): View => {
  const v = localStorage.getItem(VIEW_KEY);
  return v === 'grid' || v === 'masonry' ? v : 'carousel';
};

// Shown in the language of the site side when a translation exists, labelled, with a button for the original.
function ReviewCard({
  review,
  index,
  date,
  fixed,
  className = '',
}: {
  review: Review;
  index: number;
  date: string;
  fixed: boolean; // same height as its neighbours (grid, carousel) or as tall as its text (masonry)
  className?: string;
}) {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const translated = review.lang !== lang && review.translation?.lang === lang;
  const [original, setOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shown = translated && !original ? review.translation! : review;
  const long = fixed && shown.text.length > CLAMP_AT;
  const accent = accents[index % accents.length];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.08 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg ${fixed ? 'h-full' : ''} ${className}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} aria-hidden />
      <Quote
        className={`pointer-events-none absolute end-4 top-4 size-14 rtl:-scale-x-100 ${accent.quote}`}
        aria-hidden
      />

      <div className="flex items-center gap-2">
        <Stars value={review.rating} className="size-4" />
        <span className="sr-only">{r.star(review.rating)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-leaf-50 px-2 py-0.5 text-[0.7rem] font-bold text-leaf-700">
          <BadgeCheck className="size-3.5" />
          {r.verified}
        </span>
      </div>

      <blockquote
        dir="auto"
        className={`relative mt-4 text-[0.95rem] leading-8 whitespace-pre-line text-ink/80 ${!fixed ? '' : expanded ? 'h-40 overflow-y-auto overscroll-contain pe-2' : 'h-40 line-clamp-5'}`}
      >
        {shown.text}
      </blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
          className="mt-1 self-start text-sm font-bold text-leaf-700 underline-offset-4 hover:underline"
        >
          {expanded ? r.readLess : r.readMore}
        </button>
      )}

      {translated && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-ink/50">
          <Languages className="size-3.5" />
          {original ? r.original : r.translatedFrom[review.lang]}
          <button
            type="button"
            onClick={() => setOriginal((o) => !o)}
            className="font-bold text-leaf-700 underline-offset-2 hover:underline"
          >
            {original ? r.showTranslation : r.showOriginal}
          </button>
        </p>
      )}

      <span className="min-h-5 flex-1" aria-hidden />
      <figcaption className="flex items-center gap-3 border-t border-ink/5 pt-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-black ${accent.avatar}`}>
          {shown.name.trim().charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span dir="auto" className="block truncate font-black">
            {shown.name}
          </span>
          {shown.child && <bdi className="block truncate text-xs text-ink/55">{shown.child}</bdi>}
        </span>
        <span className="shrink-0 text-xs text-ink/40">{date}</span>
      </figcaption>
    </motion.figure>
  );
}

// Score, rating breakdown and the call to write, in one panel above the cards.
function Summary({ list, onWrite }: { list: Review[]; onWrite: () => void }) {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const average = list.reduce((sum, x) => sum + x.rating, 0) / list.length;
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    n,
    c: list.filter((x) => Math.round(x.rating) === n).length,
  }));
  const num = (x: number, digits = 0) =>
    x.toLocaleString(lang, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <Reveal className="mx-auto mt-10 grid max-w-4xl items-center gap-6 rounded-[2rem] border border-ink/5 bg-surface p-6 shadow-soft sm:p-8 md:grid-cols-[auto_1fr_auto] md:gap-10">
      <div className="text-center md:text-start">
        <p className="flex items-baseline justify-center gap-2 md:justify-start">
          <span className="text-5xl font-black tracking-tight">{num(average, 1)}</span>
          <span className="text-sm font-bold text-ink/45">{r.outOf}</span>
        </p>
        <div className="mt-2">
          <Stars value={Math.round(average)} />
        </div>
        <p className="mt-1 text-sm text-ink/55">{r.count(list.length)}</p>
      </div>

      <ul className="space-y-1.5 md:border-s md:border-ink/5 md:ps-10">
        {counts.map(({ n, c }) => (
          <li key={n} className="flex items-center gap-3 text-xs text-ink/55" aria-label={r.ratingRow(num(n), num(c))}>
            <span className="inline-flex w-7 items-center gap-0.5 font-bold" aria-hidden>
              {num(n)}
              <Star className="size-3 fill-sun-500 text-sun-500" />
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5" aria-hidden>
              <motion.span
                className="block h-full rounded-full bg-sun-500"
                initial={{ width: 0 }}
                whileInView={{ width: `${(c / list.length) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: (5 - n) * 0.06 }}
              />
            </span>
            <span className="w-6 text-end tabular-nums" aria-hidden>
              {num(c)}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onWrite}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-500 px-7 py-3 font-black text-white shadow-pop transition hover:-translate-y-0.5"
      >
        <PenLine className="size-5" />
        {r.write}
      </button>
    </Reveal>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const r = useI18n().t.reviews;
  return (
    <div
      role="radiogroup"
      aria-label={r.viewLabel}
      className="inline-flex gap-1 rounded-full bg-surface p-1 shadow-soft"
    >
      {VIEWS.map(({ id, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={view === id}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
            view === id ? 'bg-leaf-500 text-white shadow-sm' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <Icon className="size-4" />
          <span className="hidden sm:inline">{r.views[id]}</span>
          <span className="sr-only sm:hidden">{r.views[id]}</span>
        </button>
      ))}
    </div>
  );
}

// Starts with one page of cards and adds the next page as the visitor nears the end of the track,
// so a long list never puts hundreds of cards on the page at once.
function Carousel({ list, date }: { list: Review[]; date: (iso: string) => string }) {
  const { t } = useI18n();
  const r = t.reviews;
  const track = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(PAGE_SIZE);
  const [edge, setEdge] = useState({ start: true, end: false });
  const more = count < list.length;

  // scrollLeft is negative in RTL, so work with distances from either edge.
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const fromStart = Math.abs(el.scrollLeft);
    const toEnd = el.scrollWidth - el.clientWidth - fromStart;
    setEdge({ start: fromStart < 8, end: toEnd < 8 });
    if (toEnd < el.clientWidth * 0.5) setCount((c) => Math.min(c + PAGE_SIZE, list.length));
  }, [list.length]);

  useEffect(measure, [measure, count]);

  // One screenful per click; in RTL the next cards are to the left.
  const go = (step: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: step * el.clientWidth * (rtl ? -1 : 1), behavior: 'smooth' });
  };
  const arrow =
    'grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink/70 shadow-soft transition hover:bg-leaf-500 hover:text-white disabled:pointer-events-none disabled:opacity-40';
  const slide = 'flex w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]';

  return (
    <div className="mt-6">
      <div
        ref={track}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pt-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.slice(0, count).map((review, i) => (
          // The wrapper is stretched to the tallest slide, so every card in the track gets one height.
          <div key={review.id} className={slide}>
            <ReviewCard review={review} index={i} date={date(review.createdAt)} fixed className="w-full" />
          </div>
        ))}
        {more && (
          <div className={slide} aria-hidden>
            <div className="min-h-80 w-full animate-pulse rounded-3xl bg-ink/5" />
          </div>
        )}
      </div>
      <div className="flex justify-center gap-3">
        <button type="button" onClick={() => go(-1)} disabled={edge.start} aria-label={r.prev} className={arrow}>
          <ChevronLeft className="size-5 rtl:-scale-x-100" />
        </button>
        <button type="button" onClick={() => go(1)} disabled={edge.end && !more} aria-label={r.next} className={arrow}>
          <ChevronRight className="size-5 rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}

// 1 … 4 5 6 … 12: always the first and last page, plus the pages next to the current one.
function pageItems(page: number, count: number): (number | null)[] {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]));
}

function Pager({ page, count, onPage }: { page: number; count: number; onPage: (n: number) => void }) {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const num = (n: number) => n.toLocaleString(lang);
  const step =
    'grid size-10 place-items-center rounded-full bg-surface text-ink/70 shadow-soft transition hover:bg-leaf-500 hover:text-white disabled:pointer-events-none disabled:opacity-40';
  return (
    <nav aria-label={r.pages} className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label={r.prevPage}
        className={step}
      >
        <ChevronLeft className="size-5 rtl:-scale-x-100" />
      </button>
      {pageItems(page, count).map((n, i) =>
        n === null ? (
          <span key={`gap${i}`} className="px-1 text-ink/40" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            aria-label={r.page(num(n))}
            aria-current={n === page ? 'page' : undefined}
            className={`grid size-10 place-items-center rounded-full text-sm font-bold tabular-nums transition ${
              n === page ? 'bg-leaf-500 text-white shadow-pop' : 'bg-surface text-ink/70 shadow-soft hover:bg-leaf-50'
            }`}
          >
            {num(n)}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === count}
        aria-label={r.nextPage}
        className={step}
      >
        <ChevronRight className="size-5 rtl:-scale-x-100" />
      </button>
    </nav>
  );
}

export default function Reviews() {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const { params } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '400px' });
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(savedView);
  const changeView = (v: View) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };
  const [open, setOpen] = useState(() => params.get('review') === 'write');

  useEffect(() => {
    if (params.get('review') === 'write') setOpen(true);
  }, [params]);

  // Loaded only when the section comes near, so the home page itself stays fast.
  useEffect(() => {
    if (!inView) return;
    let alive = true;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : { reviews: [] }))
      .then((data: { reviews?: Review[] }) => alive && setReviews(data.reviews ?? []))
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, [inView]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const list = reviews ?? [];
  const perPage = showAll ? ALL_PAGE_SIZE : PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * perPage;
  const shown = list.slice(start, start + perPage);
  const num = (n: number) => n.toLocaleString(lang);
  // New page: bring the top of the list back into view if the visitor has scrolled past it.
  const goTo = (n: number) => {
    setPage(n);
    const top = listTop.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const togglePageSize = () => {
    setShowAll((x) => !x);
    goTo(1);
  };
  // "آبان ۱۴۰۵" / "November 2026" (ICU's fa-IR order puts the year first).
  const date = (iso: string) => {
    const parts = new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    }).formatToParts(new Date(iso));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === type)?.value ?? '';
    return `${part('month')} ${part('year')}`;
  };

  return (
    <Section id="reviews">
      <SectionHeading eyebrow={r.eyebrow} title={r.title} lead={r.lead} tone="sun" />

      <div ref={ref}>
        {list.length > 0 ? (
          <Summary list={list} onWrite={() => setOpen(true)} />
        ) : (
          reviews !== null && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-7 py-3 font-black text-white shadow-pop transition hover:-translate-y-0.5"
              >
                <PenLine className="size-5" />
                {r.write}
              </button>
            </div>
          )
        )}

        {reviews === null ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-ink/5" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <Reveal className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center text-ink/60">
            <MessageSquareHeart className="mx-auto size-10 text-berry-500" />
            <p className="mt-3 leading-8">{r.empty}</p>
          </Reveal>
        ) : (
          <>
            <div
              ref={listTop}
              className="mt-10 flex scroll-mt-28 flex-col-reverse items-center justify-between gap-3 sm:flex-row"
            >
              <p className="text-sm text-ink/55" aria-live="polite">
                {view === 'carousel'
                  ? r.count(list.length)
                  : r.range(num(start + 1), num(start + shown.length), num(list.length))}
              </p>
              <ViewSwitch view={view} onChange={changeView} />
            </div>
            {view === 'carousel' ? (
              <Carousel list={list} date={date} />
            ) : view === 'masonry' ? (
              <div className="mt-6 columns-1 gap-6 sm:columns-2 lg:columns-3">
                {shown.map((review, i) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    index={i}
                    date={date(review.createdAt)}
                    fixed={false}
                    className="mb-6 break-inside-avoid"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((review, i) => (
                  <ReviewCard key={review.id} review={review} index={i} date={date(review.createdAt)} fixed />
                ))}
              </div>
            )}
            {view !== 'carousel' && (pageCount > 1 || list.length > PAGE_SIZE) && (
              <div className="mt-8 flex flex-col items-center gap-4">
                {pageCount > 1 && <Pager page={current} count={pageCount} onPage={goTo} />}
                {list.length > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={togglePageSize}
                    className="rounded-full border-2 border-ink/10 px-6 py-2.5 text-sm font-bold transition hover:border-leaf-500"
                  >
                    {showAll ? r.showFewer : r.showAll(num(list.length))}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-night/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={r.formTitle}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-[2rem] bg-cream p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={r.close}
                className="absolute end-4 top-4 grid size-10 place-items-center rounded-full bg-ink/5 transition hover:bg-ink/10"
              >
                <X className="size-5" />
              </button>
              <ReviewForm onClose={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
