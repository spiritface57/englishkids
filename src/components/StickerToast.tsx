import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n';
import { onSticker, stickers, type StickerId } from '../progress';

// Announces a newly earned sticker for a few seconds, wherever on the site it was earned.
export default function StickerToast() {
  const { lang } = useI18n();
  const [current, setCurrent] = useState<StickerId | null>(null);

  useEffect(() => onSticker(setCurrent), []);
  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCurrent(null), 3500);
    return () => clearTimeout(id);
  }, [current]);

  const sticker = stickers.find((s) => s.id === current);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4" role="status">
      <AnimatePresence>
        {sticker && (
          <motion.div
            key={sticker.id}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="flex items-center gap-3 rounded-full border-4 border-surface bg-sun-100 py-2 ps-2 pe-5 shadow-soft"
          >
            <motion.span
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 12 }}
              className="grid size-12 place-items-center rounded-full bg-surface text-3xl"
            >
              {sticker.emoji}
            </motion.span>
            <span>
              <span className="block text-xs font-bold text-sun-700">
                {lang === 'fa' ? 'برچسب جدید گرفتی! 🎉' : 'New sticker! 🎉'}
              </span>
              <span className="block font-black">{sticker[lang]}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
