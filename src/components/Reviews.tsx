import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { Loader2, MessageSquareHeart, PenLine, Quote, Send, Star, X } from 'lucide-react';
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
  lang: string;
  createdAt: string;
};

const FIRST_SHOWN = 6;
const cardTones = ['bg-leaf-100', 'bg-sun-100', 'bg-berry-100', 'bg-grape-100'];

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
        body: JSON.stringify({ name, child, rating, text, consent, website, lang, turnstileToken: captchaToken }),
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

export default function Reviews() {
  const { t, lang } = useI18n();
  const r = t.reviews;
  const { params } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '400px' });
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showAll, setShowAll] = useState(false);
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
  const average = list.length ? list.reduce((sum, x) => sum + x.rating, 0) / list.length : 0;
  const shown = showAll ? list : list.slice(0, FIRST_SHOWN);
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

      <div ref={ref} className="mt-10 flex flex-col items-center gap-4">
        {list.length > 0 && (
          <p className="inline-flex items-center gap-3 rounded-full bg-surface px-5 py-2 font-bold shadow-soft">
            <Stars value={Math.round(average)} />
            {r.average(average.toLocaleString(lang, { maximumFractionDigits: 1 }), list.length)}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-7 py-3 font-black text-white shadow-pop transition hover:-translate-y-0.5"
        >
          <PenLine className="size-5" />
          {r.write}
        </button>
      </div>

      {reviews === null ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-ink/5" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Reveal className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-dashed border-ink/15 p-8 text-center text-ink/60">
          <MessageSquareHeart className="mx-auto size-10 text-berry-500" />
          <p className="mt-3 leading-8">{r.empty}</p>
        </Reveal>
      ) : (
        <>
          <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {shown.map((review, i) => (
              <motion.figure
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className={`relative mb-5 break-inside-avoid rounded-3xl p-6 ${cardTones[i % cardTones.length]}`}
              >
                <Quote className="absolute end-5 top-5 size-8 text-ink/10" />
                <Stars value={review.rating} className="size-4" />
                <blockquote dir="auto" className="mt-3 leading-8 whitespace-pre-line text-ink/85">
                  {review.text}
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface font-black text-leaf-600">
                    {review.name.trim().charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span dir="auto" className="block truncate font-black">
                      {review.name}
                    </span>
                    <span className="block text-xs text-ink/55">
                      {review.child && <bdi>{review.child} · </bdi>}
                      {date(review.createdAt)}
                    </span>
                  </span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          {list.length > FIRST_SHOWN && !showAll && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-leaf-500"
              >
                {r.more} ({(list.length - FIRST_SHOWN).toLocaleString(lang)})
              </button>
            </div>
          )}
        </>
      )}

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
