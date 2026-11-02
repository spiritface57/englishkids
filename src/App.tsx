import { lazy, Suspense, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Why from './components/Why';
import Classes from './components/Classes';
import PlayTeaser from './components/PlayTeaser';
import Activities from './components/Activities';
import Gallery from './components/Gallery';
import Steps from './components/Steps';
import Booking from './components/Booking';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import PaletteSwitcher, { showPaletteSwitcher } from './components/PaletteSwitcher';
import StickerToast from './components/StickerToast';
import { features } from './features';
import { useI18n } from './i18n';
import { usePage, useScrollOnNavigate, type Page } from './router';
import { useProfiles } from './profiles';
import { subPages } from './navigation';

// Sub-pages load on demand, so the home page stays light and switched-off features are never downloaded.
const PlayPage = lazy(() => import('./pages/PlayPage'));
const LevelTestPage = lazy(() => import('./pages/LevelTestPage'));
const ParentsPage = lazy(() => import('./pages/ParentsPage'));

function Home() {
  return (
    <>
      <Hero />
      <About />
      <Why />
      <Classes />
      <PlayTeaser />
      <Activities />
      <Gallery />
      <Steps />
      <Booking />
      <Faq />
      <Contact />
    </>
  );
}

export default function App() {
  const { t } = useI18n();
  const requested = usePage();
  // A switched-off page falls back to the home page.
  const page: Page =
    (requested === '/level-test' && !features.levelTest) || (requested === '/parents' && !features.parentsCorner)
      ? '/'
      : requested;
  useScrollOnNavigate();
  // Switching child re-mounts the pages, so every game reads that child's progress.
  const { active: profile } = useProfiles();

  useEffect(() => {
    document.title = page === '/' ? t.meta.title : `${t.nav[subPages[page].navKey]} | ${t.meta.title}`;
  }, [page, t]);

  return (
    <>
      <Navbar />
      <main key={profile}>
        {page === '/' && <Home />}
        <Suspense fallback={<div className="min-h-screen" />}>
          {page === '/play' && <PlayPage />}
          {page === '/level-test' && <LevelTestPage />}
          {page === '/parents' && <ParentsPage />}
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp />
      <StickerToast />
      {showPaletteSwitcher && <PaletteSwitcher />}
    </>
  );
}
