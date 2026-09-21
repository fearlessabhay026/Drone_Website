import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PortfolioSection } from './components/PortfolioSection';
import { ServicesSection } from './components/ServicesSection';
import { FeaturedProject } from './components/FeaturedProject';
import { AboutSection } from './components/AboutSection';
import { VisualStatement } from './components/VisualStatement';
import { ClientsSection } from './components/ClientsSection';
import { Testimonials } from './components/Testimonials';
import { BookingCTA } from './components/BookingCTA';
import { Footer } from './components/Footer';
import { Cursor } from './components/ui/Cursor';
import * as motionReact from 'motion/react';

const { MotionConfig } = motionReact;

export default function App() {
  return (
    // `reducedMotion="user"` makes motion snap transform animations to their
    // end state for anyone who asks for less movement, while opacity still
    // fades.
    <MotionConfig reducedMotion="user">
      <a
        href="#work"
        className="text-meta sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-bone focus:px-5 focus:py-3 focus:text-ink"
      >
        Skip to content
      </a>

      <Cursor />
      <Navbar />

      <main>
        <Hero />
        <PortfolioSection />
        <ServicesSection />
        <FeaturedProject />
        <AboutSection />
        <VisualStatement />
        <ClientsSection />
        <Testimonials />
        <BookingCTA />
      </main>

      <Footer />
    </MotionConfig>
  );
}
