import { useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarHeart, Loader2, PartyPopper, Send } from 'lucide-react';
import { useI18n } from '../i18n';
import { content, links, turnstileSiteKey, type Content, type Lang } from '../content';
import { Reveal, Section, WhatsAppIcon } from './ui';
import Turnstile from './Turnstile';

type ClassType = 'private' | 'semi' | 'unsure';
type Mode = 'online' | 'inperson' | 'either';

type Form = {
  parentName: string;
  phone: string;
  childName: string;
  childAge: string;
  classType: ClassType;
  mode: Mode;
  days: number[];
  timeFrom: string; // 'HH:MM' or '' for any time
  timeTo: string;
  notes: string;
  website: string; // honeypot, must stay empty
};

const empty: Form = {
  parentName: '',
  phone: '',
  childName: '',
  childAge: '',
  classType: 'unsure',
  mode: 'either',
  days: [],
  timeFrom: '',
  timeTo: '',
  notes: '',
  website: '',
};

const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const normalizePhone = (s: string) => toLatinDigits(s).replace(/[\s\-()]/g, '');
const isValidPhone = (s: string) => /^(\+?\d{8,15}|0\d{9,11})$/.test(normalizePhone(s));

// Half-hour slots from 08:00 to 21:00.
const timeSlots = Array.from({ length: 27 }, (_, i) => {
  const minutes = 8 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

const formatTime = (slot: string, lang: string) =>
  lang === 'fa' ? slot.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : slot;

type Status = 'idle' | 'sending' | 'success' | 'fallback';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
        active ? 'border-leaf-500 bg-leaf-500 text-white shadow-pop' : 'border-ink/10 bg-surface text-ink/70 hover:border-leaf-200'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-ink/80">
        {label}
        {required && <span className="text-berry-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-2xl border-2 border-ink/10 bg-surface px-4 py-3 text-base outline-none transition placeholder:text-ink/35 focus:border-leaf-500 focus:ring-4 focus:ring-leaf-100';

export default function Booking() {
  const { t, lang } = useI18n();
  const b = t.booking;
  const [form, setForm] = useState<Form>(empty);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0); // bump to get a fresh widget (tokens are single-use)

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Keep the range valid: clear the end time if it is no longer after the start.
      if (key === 'timeFrom' && next.timeTo && next.timeFrom && next.timeTo <= next.timeFrom) next.timeTo = '';
      return next;
    });
  const toggleDay = (d: number) =>
    set('days', form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d].sort());

  const timeRange = (bt: Content['booking'], lng: Lang) => {
    const { timeFrom: from, timeTo: to } = form;
    if (!from && !to) return '';
    if (from && to) return `${bt.from} ${formatTime(from, lng)} ${bt.to} ${formatTime(to, lng)}`;
    return from ? `${bt.from} ${formatTime(from, lng)}` : `${bt.to} ${formatTime(to, lng)}`;
  };

  // Class details (everything except contact info and notes), labelled in the given language.
  const detailRows = (bt: Content['booking'], lng: Lang): [string, string][] => [
    [bt.childName, form.childName],
    [bt.childAge, form.childAge],
    [bt.classType, bt.classTypes[form.classType]],
    [bt.mode, bt.modes[form.mode]],
    [bt.days, form.days.map((d) => bt.dayNames[d]).join('، ')],
    [bt.time, timeRange(bt, lng)],
  ];

  const summary = () => {
    const rows: [string, string][] = [
      [b.parentName, form.parentName],
      [b.phone, normalizePhone(form.phone)],
      ...detailRows(b, lang),
      [b.notes, form.notes],
    ];
    return rows.filter(([, v]) => v.trim()).map(([k, v]) => `• ${k}: ${v}`).join('\n');
  };

  const waLink = () => links.whatsapp(`${b.waIntro}\n${summary()}`);

  const valid = () => {
    if (!form.parentName.trim() || !isValidPhone(form.phone)) {
      setError(b.required);
      return false;
    }
    setError('');
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid()) return;
    if (turnstileSiteKey && !captchaToken) {
      setError(b.captchaRequired);
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: normalizePhone(form.phone),
          lang,
          summary: summary(),
          details: detailRows(content.fa.booking, 'fa'), // the notification email is always in Persian
          turnstileToken: captchaToken,
        }),
      });
      if (res.status === 403) {
        setError(b.captchaFailed);
        setStatus('idle');
      } else {
        setStatus(res.ok ? 'success' : 'fallback');
      }
    } catch {
      setStatus('fallback');
    }
    setCaptchaToken('');
    setCaptchaKey((k) => k + 1);
  };

  return (
    <Section id="booking" className="bg-band">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -start-20 size-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -end-10 size-96 rounded-full bg-white/5" />
        <div className="absolute top-20 end-[12%] size-16 rotate-12 rounded-2xl bg-sun-400/80" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="text-white lg:sticky lg:top-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
            <CalendarHeart className="size-4" />
            {b.eyebrow}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-black sm:text-4xl">{b.title}</h2>
          <p className="mt-4 text-lg leading-8 text-white/85">{b.lead}</p>
          <a
            href={links.whatsapp(t.contactSection.waDefault)}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-surface px-6 py-3 font-bold text-leaf-700 transition hover:-translate-y-0.5"
          >
            <WhatsAppIcon />
            {t.hero.secondary}
          </a>
        </div>

        <Reveal className="rounded-[2rem] bg-cream p-6 shadow-2xl sm:p-9">
          <AnimatePresence mode="wait">
            {status === 'success' || status === 'fallback' ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center"
                role="status"
              >
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                  className={`mx-auto grid size-20 place-items-center rounded-full ${status === 'success' ? 'bg-leaf-100 text-leaf-600' : 'bg-sun-100 text-sun-700'}`}
                >
                  {status === 'success' ? <PartyPopper className="size-10" /> : <WhatsAppIcon className="size-10" />}
                </motion.div>
                {status === 'success' && <h3 className="mt-6 text-2xl font-black">{b.successTitle}</h3>}
                <p className="mx-auto mt-3 max-w-md leading-8 text-ink/70">
                  {status === 'success' ? b.successText : b.fallbackText}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <a
                    href={waLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
                  >
                    <WhatsAppIcon />
                    {b.viaWhatsapp}
                  </a>
                  <button
                    onClick={() => {
                      setForm(empty);
                      setStatus('idle');
                    }}
                    className="rounded-full border-2 border-ink/10 px-6 py-3 font-bold transition hover:border-leaf-500"
                  >
                    {b.newRequest}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} noValidate exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={b.parentName} required>
                    <input
                      className={inputCls}
                      value={form.parentName}
                      onChange={(e) => set('parentName', e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </Field>
                  <Field label={b.phone} required>
                    <input
                      className={inputCls}
                      dir="ltr"
                      type="tel"
                      inputMode="tel"
                      placeholder={b.phonePlaceholder}
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </Field>
                  <Field label={b.childName}>
                    <input className={inputCls} value={form.childName} onChange={(e) => set('childName', e.target.value)} />
                  </Field>
                  <Field label={b.childAge}>
                    <select className={inputCls} value={form.childAge} onChange={(e) => set('childAge', e.target.value)}>
                      <option value="">—</option>
                      {b.ageOptions.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-ink/80">{b.classType}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(b.classTypes) as ClassType[]).map((k) => (
                      <Chip key={k} active={form.classType === k} onClick={() => set('classType', k)}>
                        {b.classTypes[k]}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-ink/80">{b.mode}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(b.modes) as Mode[]).map((k) => (
                      <Chip key={k} active={form.mode === k} onClick={() => set('mode', k)}>
                        {b.modes[k]}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-ink/80">{b.days}</legend>
                  <div className="flex flex-wrap gap-2">
                    {b.dayNames.map((d, i) => (
                      <Chip key={d} active={form.days.includes(i)} onClick={() => toggleDay(i)}>
                        {d}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-ink/80">{b.time}</legend>
                  <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    {(['timeFrom', 'timeTo'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2">
                        <span className="shrink-0 text-sm font-bold text-ink/60">{key === 'timeFrom' ? b.from : b.to}</span>
                        <select className={inputCls} value={form[key]} onChange={(e) => set(key, e.target.value)}>
                          <option value="">{b.anyTime}</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot} disabled={key === 'timeTo' && !!form.timeFrom && slot <= form.timeFrom}>
                              {formatTime(slot, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label={b.notes}>
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-y`}
                    placeholder={b.notesPlaceholder}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </Field>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                />

                {turnstileSiteKey && <Turnstile key={captchaKey} siteKey={turnstileSiteKey} lang={lang} onToken={setCaptchaToken} />}

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl bg-berry-100 px-4 py-3 font-semibold text-berry-500"
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-sun-500 px-7 py-4 text-lg font-bold text-night shadow-[0_14px_30px_-12px_rgb(255_204_0/0.9)] transition hover:bg-sun-600 disabled:opacity-70"
                  >
                    {status === 'sending' ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 rtl:-scale-x-100" />}
                    {status === 'sending' ? b.sending : b.submit}
                  </button>
                  <a
                    href={waLink()}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!valid()) e.preventDefault();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] px-6 py-4 font-bold text-[#128C7E] transition hover:bg-[#25D366]/10"
                  >
                    <WhatsAppIcon />
                    {b.viaWhatsapp}
                  </a>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </Section>
  );
}
