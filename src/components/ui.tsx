import { motion, useSpring, type HTMLMotionProps, type Variants } from 'motion/react';
import { useRef, type PointerEvent, type ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
      {...props}
    />
  );
}

// A card that tilts slightly towards the mouse, with a soft light following the pointer.
// Only for a mouse: on touch screens it stays still (tilting under a finger feels odd).
export function TiltCard({
  max = 5,
  className = '',
  children,
  onPointerMove,
  onPointerLeave,
  ref: outerRef,
  ...props
}: Omit<HTMLMotionProps<'div'>, 'children' | 'ref'> & {
  max?: number;
  children?: ReactNode;
  ref?: (el: HTMLDivElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const spring = { stiffness: 220, damping: 22 };
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    rotateY.set((x - 0.5) * 2 * max);
    rotateX.set(-(y - 0.5) * 2 * max);
    el.style.setProperty('--spot-x', `${x * 100}%`);
    el.style.setProperty('--spot-y', `${y * 100}%`);
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={(el: HTMLDivElement | null) => {
        ref.current = el;
        outerRef?.(el);
      }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={move}
      onPointerLeave={leave}
      className={`group/tilt relative ${className}`}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        style={{
          background:
            'radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklab, var(--color-surface) 45%, transparent), transparent 60%)',
        }}
      />
    </motion.div>
  );
}

type Tone = 'leaf' | 'sun' | 'grape';

const eyebrowTone: Record<Tone, string> = {
  leaf: 'bg-leaf-100 text-leaf-700',
  sun: 'bg-sun-100 text-sun-700',
  grape: 'bg-grape-100 text-grape-600',
};

const headingPop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 18 } },
};
const headingRise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease } },
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = 'leaf',
  align = 'center',
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  tone?: Tone;
  align?: 'center' | 'start';
}) {
  // The badge pops in, then the title and the lead rise one after the other.
  return (
    <motion.div
      className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
    >
      <motion.span
        variants={headingPop}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${eyebrowTone[tone]}`}
      >
        <motion.span
          className="text-base"
          variants={{
            hidden: { rotate: -90, scale: 0 },
            show: { rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 12, delay: 0.15 } },
          }}
        >
          ★
        </motion.span>
        {eyebrow}
      </motion.span>
      <motion.h2 variants={headingRise} className="mt-4 text-3xl leading-tight font-black text-balance sm:text-4xl">
        {title}
      </motion.h2>
      {lead && (
        <motion.p variants={headingRise} className="mt-4 text-lg leading-8 text-ink/70 text-pretty">
          {lead}
        </motion.p>
      )}
    </motion.div>
  );
}

export function Section({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`relative px-5 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function WhatsAppIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.67 2.77 9.38 9.38 0 0 1 2.77 6.68c0 5.2-4.24 9.43-9.46 9.43m8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.7l6.08-1.6a11.36 11.36 0 0 0 5.43 1.38h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.33-8.04" />
    </svg>
  );
}

export function InstagramIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
