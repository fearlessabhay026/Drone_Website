import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as motionReact from 'motion/react';
import { media } from '../data/media';
import { heroSlides } from '../data/site';
import { Figure } from './ui/Figure';
import { Grain } from './ui/Grain';
import { FloatingProjectCard } from './FloatingProjectCard';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { ease } from '../lib/motion';

const { motion, useScroll, useTransform } = motionReact;

/**
 * Full-viewport opening composition: oversized type behind a floating
 * project card, over a cinematic aerial plate. Three layers move at three
 * different rates on scroll, which is what produces the depth.
 *
 * The composition is sized against the viewport's *height* as well as its
 * width — `--hero-type` and the card both cap against `svh`. Without that,
 * a short wide window (1440x900, 1024x768) grew the card past the type and
 * swallowed the headline whole.
 */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [slide, setSlide] = useState(0);

  const step = useCallback((delta: number) => {
    setSlide((current) => (current + delta + heroSlides.length) % heroSlides.length);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const k = reduced ? 0 : 1;
  // Background drifts slowest, type fastest — classic parallax ordering.
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140 * k]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.14 * k]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -180 * k]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 70 * k]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 1 - 0.12 * k]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, reduced ? 1 : 0.2]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40 * k]);
  const chromeY = useTransform(scrollYProgress, [0, 1], [0, 60 * k]);
  const chromeOpacity = useTransform(scrollYProgress, [0, 0.45], [1, reduced ? 1 : 0]);

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      style={{ '--hero-type': 'max(3.25rem, min(18.5vw, 17rem, 21svh))' } as CSSProperties}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-22 pb-26 sm:px-6"
    >
      {/* Layer 1 — the aerial plate */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease }}
        className="absolute inset-0"
      >
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-[-8%]">
          <Figure asset={media.heroBackground} priority sizes="100vw" className="h-full w-full" />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-ink/65 via-ink/45 to-ink"
        />
        <Grain />
      </motion.div>

      {/* Layer 2 — oversized type, its lower edge slipping behind the card */}
      <motion.h1
        style={{ y: typeY }}
        className="text-display pointer-events-none relative z-10 text-center text-[length:var(--hero-type)] text-bone/92"
      >
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '108%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.1, ease, delay: 0.18 }}
            className="block will-change-transform"
          >
            Aerial
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '108%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.1, ease, delay: 0.3 }}
            className="block will-change-transform"
          >
            Stories
          </motion.span>
        </span>
      </motion.h1>

      {/* Layer 3 — the floating object, pulled up over the headline's last line */}
      <motion.div
        style={{ y: cardY, scale: cardScale, opacity: cardOpacity }}
        className="relative z-20 mt-[calc(var(--hero-type)*-0.28)] flex w-full justify-center"
      >
        <FloatingProjectCard
          slide={heroSlides[slide]}
          imageY={imageY}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      </motion.div>

      {/* Layer 4 — hero chrome */}
      <motion.div
        style={{ y: chromeY, opacity: chromeOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-5 pb-6 sm:px-8 sm:pb-8"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="text-meta hidden text-[9px] text-ash sm:block"
        >
          Scroll to explore
        </motion.span>

        <motion.ol
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="mx-auto flex items-center gap-3"
          aria-label="Featured projects"
        >
          {heroSlides.map((item, index) => {
            const active = index === slide;
            const label = String(index + 1).padStart(2, '0');
            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`h-px transition-all duration-500 ${
                    active ? 'w-8 bg-bone' : 'w-4 bg-bone/25'
                  }`}
                />
                <span
                  className={`text-meta text-[9px] transition-colors duration-500 ${
                    active ? 'text-bone' : 'text-ash/60'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </motion.ol>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="text-meta hidden max-w-[9rem] text-right text-[9px] leading-relaxed text-ash sm:block"
        >
          A different
          <br />
          perspective
        </motion.span>
      </motion.div>
    </section>
  );
}
