import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Moon, Palette, Sun, X } from 'lucide-react';
import { applyPalette, palettes, savedPaletteId } from '../palettes';
import { useTheme } from '../theme';

// Trial tool for picking the site's colours: lists the trial palettes, applies one live, and flips light/dark.
// Shown in `npm run dev`, or on any build when the URL has ?palettes.

const original = {
  id: '',
  name: 'Original (current)',
  source: '',
  swatches: ['#009B4D', '#FFCC00', '#FAF5E9', '#7C5CD6', '#1F2A37'],
};
const options = [original, ...palettes];

export const showPaletteSwitcher = import.meta.env.DEV || new URLSearchParams(window.location.search).has('palettes');

function Swatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex shrink-0 overflow-hidden rounded-md border border-black/10">
      {colors.map((c) => (
        <span key={c} className="size-5" style={{ background: c }} />
      ))}
    </span>
  );
}

export default function PaletteSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(savedPaletteId);
  const { theme, toggle } = useTheme();

  const select = (id: string) => {
    applyPalette(id);
    setActive(id);
  };
  const index = Math.max(0, options.findIndex((o) => o.id === active));
  const step = (d: number) => select(options[(index + d + options.length) % options.length].id);

  return (
    <div dir="ltr" className="fixed start-5 bottom-5 z-40" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="mb-3 w-80 overflow-hidden rounded-2xl border border-ink/10 bg-surface text-ink shadow-soft"
          >
            <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-4 py-3">
              <span className="text-sm font-bold">Colour palettes ({index}/{palettes.length})</span>
              <div className="flex items-center gap-1">
                <button onClick={toggle} title="Light / dark" className="grid size-8 place-items-center rounded-full hover:bg-ink/10">
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
                <button onClick={() => step(-1)} title="Previous" className="grid size-8 place-items-center rounded-full hover:bg-ink/10">
                  <ChevronLeft className="size-4" />
                </button>
                <button onClick={() => step(1)} title="Next" className="grid size-8 place-items-center rounded-full hover:bg-ink/10">
                  <ChevronRight className="size-4" />
                </button>
                <button onClick={() => setOpen(false)} title="Close" className="grid size-8 place-items-center rounded-full hover:bg-ink/10">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {options.map((o, i) => (
                <li key={o.id || 'original'}>
                  {o.source && o.source !== options[i - 1].source && (
                    <p className="px-3 pt-3 pb-1 text-xs font-bold tracking-wide text-ink/50 uppercase">{o.source}</p>
                  )}
                  <button
                    onClick={() => select(o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm transition ${
                      o.id === active ? 'bg-leaf-100 font-bold' : 'hover:bg-ink/5'
                    }`}
                  >
                    <span className="w-5 text-xs text-ink/50">{i || '–'}</span>
                    <span className="flex-1">{o.name}</span>
                    <Swatches colors={o.swatches} />
                    <Check className={`size-4 ${o.id === active ? 'text-leaf-700' : 'invisible'}`} />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        title="Colour palettes"
        className="flex items-center gap-2 rounded-full border border-ink/10 bg-surface py-2 ps-2 pe-4 text-sm font-bold text-ink shadow-soft transition hover:-translate-y-0.5"
      >
        <span className="grid size-9 place-items-center rounded-full bg-leaf-500 text-white">
          <Palette className="size-5" />
        </span>
        {options[index].name}
      </button>
    </div>
  );
}
