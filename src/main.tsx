import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/vazirmatn';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './index.css';
import { I18nProvider } from './i18n';
import App from './App';
import { applyPalette, savedPaletteId } from './palettes';
import { showPaletteSwitcher } from './components/PaletteSwitcher';

// Re-apply the palette picked in the trial switcher before first render (no flash of the original colours).
if (showPaletteSwitcher) applyPalette(savedPaletteId());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <App />
      </I18nProvider>
    </MotionConfig>
  </StrictMode>,
);
