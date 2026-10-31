import { Quote } from 'lucide-react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading } from './ui';
import leila from '../assets/leila.jpg';

export default function About() {
  const { t } = useI18n();
  return (
    <Section id="about">
      <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2.5rem] bg-grape-100" />
          <img src={leila} alt={t.about.name} className="aspect-[4/5] w-full rounded-[2rem] border-8 border-surface object-cover object-top shadow-soft" />
          <div className="absolute -bottom-6 start-6 end-6 rounded-2xl bg-surface p-4 shadow-soft">
            <Quote className="size-6 text-sun-500" />
            <p className="mt-1 font-bold leading-7">{t.about.quote}</p>
          </div>
        </Reveal>

        <div>
          <SectionHeading eyebrow={t.about.eyebrow} title={t.about.name} tone="grape" align="start" />
          <Reveal delay={0.1}>
            <p className="mt-3 text-xl font-bold text-leaf-700">{t.about.role}</p>
            {t.about.paragraphs.map((p) => (
              <p key={p.slice(0, 20)} className="mt-5 text-lg leading-9 text-ink/75">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
