import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useI18n } from '../i18n';
import { Reveal, Section, SectionHeading } from './ui';

export default function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq">
      <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} tone="grape" />
      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {t.faq.items.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className={`rounded-3xl border-2 bg-surface transition-colors ${isOpen ? 'border-leaf-500' : 'border-transparent shadow-soft'}`}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start text-lg font-bold"
                >
                  {f.q}
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${isOpen ? 'bg-leaf-500 text-white' : 'bg-leaf-100 text-leaf-700'}`}
                  >
                    <Plus className="size-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 leading-8 text-ink/70">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
