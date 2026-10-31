import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '../i18n';
import { links } from '../content';
import { WhatsAppIcon } from './ui';

// Floating actions: back-to-top above, WhatsApp below.
export default function FloatingWhatsApp() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed end-5 bottom-5 z-40 flex flex-col items-end gap-3">
          <motion.button
            key="top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label={t.nav.toTop}
            title={t.nav.toTop}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ y: -3 }}
            className="grid size-12 place-items-center rounded-full border border-ink/10 bg-surface text-ink shadow-soft transition-colors hover:text-leaf-700"
          >
            <ArrowUp className="size-5" />
          </motion.button>

          <motion.a
            key="wa"
            href={links.whatsapp(t.contactSection.waDefault)}
            target="_blank"
            rel="noreferrer"
            aria-label={t.floatingWa}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.08 }}
            className="group relative flex items-center gap-2 rounded-full bg-[#25D366] p-4 text-white shadow-[0_12px_30px_-8px_rgb(37_211_102/0.7)]"
          >
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
            <WhatsAppIcon className="size-7" />
            <span className="hidden max-w-0 overflow-hidden font-bold whitespace-nowrap transition-all duration-300 group-hover:max-w-48 sm:inline">
              {t.floatingWa}
            </span>
          </motion.a>
        </div>
      )}
    </AnimatePresence>
  );
}
