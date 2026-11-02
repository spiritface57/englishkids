import type { CSSProperties } from 'react';
import logoSvg from '../assets/brand/logo-themed.svg?raw';

// The logo drawn inline, coloured by CSS variables (--logo-*, see index.css), so it follows the colour palette and
// light/dark mode. `onDark` is for places that are always dark (the footer). Regenerate with `npm run brand`.
const onDarkColors = { '--logo-name': '#FFFFFF', '--logo-tag': 'var(--color-sun-500)' } as CSSProperties;

export default function Logo({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Miss Leila — English for Kids"
      className={`inline-block [&>svg]:h-full [&>svg]:w-auto ${className}`}
      style={onDark ? onDarkColors : undefined}
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  );
}
