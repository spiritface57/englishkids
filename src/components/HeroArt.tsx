import { motion, type MotionValue } from 'motion/react';
import { useI18n } from '../i18n';

// Letters that rise out of the open book: [char, x, color class, delay]
const letters: [string, number, string, number][] = [
  ['A', 120, 'fill-leaf-500', 0],
  ['b', 165, 'fill-sun-500', 1.1],
  ['C', 205, 'fill-grape-500', 0.5],
  ['d', 245, 'fill-berry-500', 1.6],
  ['E', 285, 'fill-leaf-600', 0.8],
];

const float = (delay: number, distance = 10) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const, delay },
});

function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const s = size;
  return (
    <motion.path
      d={`M${x} ${y - s}Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y}Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s}Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y}Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`}
      className="fill-sun-500"
      style={{ transformOrigin: `${x}px ${y}px` }}
      animate={{ scale: [0.6, 1, 0.6], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2.4, repeat: Infinity, delay }}
    />
  );
}

export default function HeroArt({ near, far }: { near: { x: MotionValue<number>; y: MotionValue<number> }; far: { x: MotionValue<number>; y: MotionValue<number> } }) {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-md">
      <motion.div style={far} className="absolute inset-0 -z-10">
        <div className="absolute inset-6 rotate-6 rounded-[3rem] bg-leaf-500" />
        <div className="absolute inset-6 -rotate-3 rounded-[3rem] bg-sun-400/80" />
      </motion.div>

      <div className="relative overflow-hidden rounded-[2.75rem] border-8 border-surface bg-surface shadow-soft">
        <svg viewBox="0 0 400 440" className="block w-full" role="img" aria-label={t.hero.artCaption}>
          <circle cx="200" cy="200" r="160" className="fill-leaf-50" />
          <circle cx="200" cy="200" r="120" className="fill-leaf-100/60" />

          {/* globe: English as a window to the world */}
          <g transform="translate(318 78)">
            <motion.g animate={{ rotate: [0, 8, 0, -8, 0] }} transition={{ duration: 8, repeat: Infinity }}>
              <circle r="30" className="fill-surface stroke-leaf-500" strokeWidth="4" />
              <ellipse rx="13" ry="30" fill="none" className="stroke-leaf-500" strokeWidth="3" />
              <path d="M-30 0H30M-26 -14H26M-26 14H26" fill="none" className="stroke-leaf-500" strokeWidth="3" />
            </motion.g>
          </g>

          {/* pencil */}
          <g transform="translate(62 96) rotate(-35)">
            <rect x="-9" y="-46" width="18" height="70" rx="3" className="fill-sun-500" />
            <rect x="-9" y="-52" width="18" height="10" rx="3" className="fill-berry-500" />
            <path d="M-9 24L0 42L9 24Z" className="fill-sun-100" />
            <path d="M-3 36L0 42L3 36Z" className="fill-ink" />
          </g>

          <Sparkle x={92} y={186} size={11} delay={0} />
          <Sparkle x={300} y={170} size={14} delay={0.8} />
          <Sparkle x={250} y={58} size={9} delay={1.5} />

          {/* letters rising from the book */}
          {letters.map(([ch, x, cls, delay]) => (
            <motion.text
              key={ch}
              x={x}
              y={300}
              textAnchor="middle"
              className={`font-display ${cls}`}
              style={{ fontSize: 44, fontWeight: 700 }}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: [-10, -150, -190], opacity: [0, 1, 0], scale: [0.6, 1.1, 0.9], rotate: [0, -8, 8] }}
              transition={{ duration: 3.6, repeat: Infinity, delay, ease: 'easeOut' }}
            >
              {ch}
            </motion.text>
          ))}

          {/* open book */}
          <path d="M200 338C158 318 104 316 52 330V232C104 218 158 220 200 240Z" className="fill-leaf-600" />
          <path d="M200 338C242 318 296 316 348 330V232C296 218 242 220 200 240Z" className="fill-leaf-600" />
          <path d="M200 326C160 306 112 304 64 316V220C112 206 160 208 200 228Z" className="fill-surface stroke-leaf-500" strokeWidth="4" strokeLinejoin="round" />
          <path d="M200 326C240 306 288 304 336 316V220C288 206 240 208 200 228Z" className="fill-surface stroke-leaf-500" strokeWidth="4" strokeLinejoin="round" />
          <path d="M200 228V326" className="stroke-leaf-500" strokeWidth="4" strokeLinecap="round" />
          <g className="stroke-ink/15" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M88 246C120 238 152 240 180 252" />
            <path d="M88 266C120 258 152 260 180 272" />
            <path d="M88 286C120 278 140 280 160 288" />
            <path d="M220 252C248 240 280 238 312 246" />
            <path d="M220 272C248 260 280 258 312 266" />
            <path d="M240 288C260 280 280 278 312 286" />
          </g>
        </svg>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-surface/90 px-4 py-3 text-center backdrop-blur">
          <p className="text-lg font-black text-leaf-700">{t.hero.artCaption}</p>
        </div>
      </div>

      <motion.div style={near} className="pointer-events-none absolute inset-0">
        <motion.div {...float(0)} className="absolute -top-6 -start-6">
          <div className="grid size-14 -rotate-12 place-items-center rounded-2xl bg-leaf-500 font-display text-3xl font-bold text-white shadow-soft sm:size-16">A</div>
        </motion.div>
        <motion.div {...float(0.8, 14)} className="absolute top-1/3 -end-4">
          <div className="grid size-14 rotate-12 place-items-center rounded-2xl bg-sun-500 font-display text-3xl font-bold text-night shadow-soft sm:size-16">B</div>
        </motion.div>
        <motion.div {...float(1.6)} className="absolute bottom-24 -start-8">
          <div className="grid size-14 rotate-6 place-items-center rounded-2xl bg-grape-500 font-display text-3xl font-bold text-white shadow-soft sm:size-16">C</div>
        </motion.div>
        <motion.div
          dir="ltr"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ opacity: { delay: 1 }, scale: { delay: 1, type: 'spring' }, y: { duration: 3, repeat: Infinity, delay: 1.5 } }}
          className="absolute -top-8 end-6 rounded-2xl rounded-ee-sm bg-sun-500 px-4 py-2 font-display text-xl font-semibold text-night shadow-soft"
        >
          {t.hero.helloBubble}
        </motion.div>
        <motion.div
          dir="ltr"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{ opacity: { delay: 1.4 }, scale: { delay: 1.4, type: 'spring' }, y: { duration: 3.4, repeat: Infinity, delay: 2 } }}
          className="absolute top-[38%] -start-10 rounded-2xl rounded-es-sm bg-leaf-500 px-4 py-2 font-display text-lg font-semibold text-white shadow-soft"
        >
          How are you? 😊
        </motion.div>
      </motion.div>
    </div>
  );
}
