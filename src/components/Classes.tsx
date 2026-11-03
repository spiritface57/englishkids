import { CheckCircle2, MapPin, MonitorSmartphone, User, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading, TiltCard } from './ui';

const typeStyles = [
  {
    Icon: User,
    card: 'bg-surface',
    badge: 'bg-sun-100 text-sun-700',
    icon: 'bg-sun-500 !text-night',
    check: 'text-sun-500',
  },
  {
    Icon: Users,
    card: 'bg-surface',
    badge: 'bg-grape-100 text-grape-600',
    icon: 'bg-grape-500',
    check: 'text-grape-500',
  },
];
const modeIcons = [MonitorSmartphone, MapPin];

export default function Classes() {
  const { t } = useI18n();
  return (
    <Section id="classes">
      <SectionHeading eyebrow={t.classes.eyebrow} title={t.classes.title} lead={t.classes.lead} />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {t.classes.types.map((c, i) => {
          const s = typeStyles[i];
          return (
            <Reveal key={c.title} delay={i * 0.1}>
              <TiltCard
                max={3}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className={`h-full overflow-hidden rounded-[2rem] ${s.card} p-8 shadow-soft`}
              >
                <div className={`absolute -top-10 -end-10 size-36 rounded-full opacity-15 ${s.icon}`} />
                <div className="flex items-center justify-between">
                  <div className={`grid size-14 place-items-center rounded-2xl text-white ${s.icon}`}>
                    <s.Icon className="size-7" />
                  </div>
                  <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${s.badge}`}>{c.tag}</span>
                </div>
                <h3 className="mt-6 text-2xl font-black">{c.title}</h3>
                <p className="mt-3 leading-8 text-ink/70">{c.text}</p>
                <ul className="mt-6 space-y-3">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 font-semibold">
                      <CheckCircle2 className={`size-5 shrink-0 ${s.check}`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <a
                  href="#booking"
                  className="mt-8 inline-flex rounded-full bg-night px-6 py-3 font-bold text-white transition hover:bg-leaf-600"
                >
                  {t.nav.book}
                </a>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {t.classes.modes.map((m, i) => {
          const Icon = modeIcons[i];
          return (
            <Reveal key={m.title} delay={0.15 + i * 0.1}>
              <div className="flex items-center gap-5 rounded-3xl border-2 border-dashed border-leaf-200 bg-leaf-50 p-6">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf-500 text-white">
                  <Icon className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-leaf-700">{m.title}</h3>
                  <p className="mt-1 text-ink/70">{m.text}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
