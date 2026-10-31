import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpLeft, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { contact, links } from '../content';
import { InstagramIcon, Reveal, Section, SectionHeading } from './ui';
import g1 from '../assets/gallery/g1.jpg';
import g2 from '../assets/gallery/g2.jpg';
import g3 from '../assets/gallery/g3.jpg';
import g4 from '../assets/gallery/g4.jpg';

// Source photos are small (cropped from the Instagram poster), so tiles stay compact and uniform.
const photos = [g1, g2, g3, g4];

export default function Gallery() {
  const { t, dir } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Section id="gallery" className="bg-surface">
      <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.title} />

      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {photos.map((src, i) => (
          <Reveal key={src} delay={i * 0.08}>
            <motion.button
              type="button"
              onClick={() => setOpen(i)}
              whileHover={{ y: -6 }}
              className="group block aspect-square w-full overflow-hidden rounded-3xl bg-cream p-2 shadow-soft"
            >
              <motion.img
                layoutId={`photo-${i}`}
                src={src}
                alt={t.gallery.alt}
                loading="lazy"
                className="size-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
              />
            </motion.button>
          </Reveal>
        ))}

        <Reveal delay={photos.length * 0.08}>
          <motion.a
            href={links.instagram}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -6 }}
            className="relative flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] p-4 text-center text-white shadow-soft"
          >
            <InstagramIcon className="size-10" />
            <span className="text-sm leading-6 font-bold">{t.gallery.more}</span>
            <span dir="ltr" className="text-xs font-semibold opacity-90">
              @{contact.instagram}
            </span>
            <ArrowUpLeft className={`absolute top-4 end-4 size-5 opacity-80 ${dir === 'ltr' ? '-scale-x-100' : ''}`} />
          </motion.a>
        </Reveal>
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-night/80 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.img
              layoutId={`photo-${open}`}
              src={photos[open]}
              alt={t.gallery.alt}
              className="aspect-square w-full max-w-md rounded-3xl border-8 border-surface object-cover"
            />
            <button
              onClick={() => setOpen(null)}
              className="absolute top-5 end-5 grid size-12 place-items-center rounded-full bg-surface text-ink"
              aria-label={t.gallery.close}
            >
              <X />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
