import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Why from './components/Why';
import Classes from './components/Classes';
import WordPlay from './components/WordPlay';
import Activities from './components/Activities';
import Gallery from './components/Gallery';
import Steps from './components/Steps';
import Booking from './components/Booking';
import Faq from './components/Faq';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Why />
        <Classes />
        <WordPlay />
        <Activities />
        <Gallery />
        <Steps />
        <Booking />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
