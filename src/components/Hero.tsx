import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as motionReact from 'motion/react';
import { media } from '../data/media';
import { heroSlides } from '../data/site';
import { Figure } from './ui/Figure';
import { Grain } from './ui/Grain';
import { FloatingProjectCard } from './FloatingProjectCard';
import { useIsDesktop, useReducedMotion } from '../hooks/useMediaQuery';
import { useHasArrived } from '../three/flightStore';
import { ease } from '../lib/motion';

const { motion, useScroll, useTransform, useMotionValueEvent } = motionReact;

type Num = motionReact.MotionValue<number>;

const SLIDES = heroSlides.length;

/**
 * The opening sequence.
 *
 * The section is deliberately taller than the viewport and pins a single
 * frame: scrolling through it advances the project cards one at a time,
 * which replaced the old prev/next arrows. Nothing is jacked — the page
 * scrolls normally, the pinned frame just reads that scroll.
 *
 * Content waits for `useHasArrived()`, which the drone flips when it settles
 * (and a timeout flips regardless, so the page never depends on WebGL).
 */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const revealed = useHasArrived();
  const [active, setActive] = useState(0);

  // Progress across the pinned run, 0 at the first card, 1 at the last.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Progress of the section leaving, for the parallax handoff to the page.
  const { scrollYProgress: exit } = useScroll({ target: ref, offset: ['end end', 'end start'] });

  const k = reduced ? 0 : 1;

  // Continuous slide position; each card reads its own distance from this.
  const slidePos = useTransform(scrollYProgress, [0, 1], [0, SLIDES - 1]);

  useMotionValueEvent(slidePos, 'change', (value) => {
    const next = Math.max(0, Math.min(SLIDES - 1, Math.round(value)));
    setActive((current) => (current === next ? current : next));
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, 90 * k]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.12 * k]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -140 * k]);
  const typeOpacity = useTransform(scrollYProgress, [0, 0.45, 1], [1, 1, reduced ? 1 : 0.32]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -30 * k]);
  const exitY = useTransform(exit, [0, 1], [0, 70 * k]);
  const exitOpacity = useTransform(exit, [0, 1], [1, reduced ? 1 : 0.1]);

  return (
    <section
      ref={ref}
      id="top"
      data-flight="hero"
      aria-label="Introduction"
      style={
        {
          '--hero-type': 'max(3.25rem, min(18.5vw, 17rem, 21svh))',
          // One pinned frame plus a scroll run per additional card.
          height: `calc(100svh + ${SLIDES - 1} * var(--hero-step))`,
          '--hero-step': isDesktop ? '68svh' : '58svh',
        } as CSSProperties
      }
      className="relative"
    >
      {/*
        The hero is pinned in two separate layers so the drone can fly
        *between* them. `position: sticky` creates a stacking context, so a
        single pinned wrapper would put all its contents on one z-plane and
        the fixed canvas would paint over the whole hero, card included.

        Backdrop sits below the canvas (z-1), content above it (z-10).
      */}
      <div className="sticky top-0 z-[1] h-[100svh] overflow-hidden">
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
      </div>

      <div className="sticky top-0 z-10 -mt-[100svh] flex h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-22 pb-26 sm:px-6">
        {/*
          Layer 2 — oversized type. It sits at z-10, *under* the drone layer's
          z-5 canvas? No: the canvas is fixed at z-5 and this is z-10, so the
          drone passes behind the headline and emerges beside it. That is the
          art direction, and it also guarantees the type stays readable.
        */}
        <motion.h1
          style={{ y: typeY, opacity: typeOpacity }}
          className="text-display pointer-events-none relative text-center text-[length:var(--hero-type)] text-bone/92"
        >
          {['Aerial', 'Stories'].map((word, index) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                initial={{ y: '108%' }}
                animate={revealed ? { y: '0%' } : { y: '108%' }}
                transition={{ duration: 1.1, ease, delay: revealed ? 0.04 + index * 0.1 : 0 }}
                className="block will-change-transform"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        {/* Layer 3 — the stacked cards, pulled up over the headline's last line */}
        <motion.div
          style={{ y: exitY, opacity: exitOpacity }}
          className="relative mt-[calc(var(--hero-type)*-0.28)] w-full"
        >
          <SlideStack
            slidePos={slidePos}
            imageY={imageY}
            revealed={revealed}
            depthBlur={isDesktop && !reduced}
          />
        </motion.div>

        {/* Layer 4 — hero chrome, now also the scroll progress indicator */}
        <HeroChrome active={active} revealed={revealed} />
      </div>
    </section>
  );
}

type SlideStackProps = {
  slidePos: Num;
  imageY: Num;
  revealed: boolean;
  depthBlur: boolean;
};

function SlideStack({ slidePos, imageY, revealed, depthBlur }: SlideStackProps) {
  // The first card is in flow and sets the height; the others overlay it.
  return (
    <div className="relative">
      {heroSlides.map((slide, index) => (
        <SlideLayer
          key={slide.id}
          slide={slide}
          index={index}
          slidePos={slidePos}
          imageY={imageY}
          revealed={revealed}
          depthBlur={depthBlur}
        />
      ))}
    </div>
  );
}

function SlideLayer({
  slide,
  index,
  slidePos,
  imageY,
  revealed,
  depthBlur,
}: {
  slide: (typeof heroSlides)[number];
  index: number;
} & Omit<SlideStackProps, never>) {
  // Distance from the active slide, which is all the card needs to know.
  const offset = useTransform(slidePos, (value) => value - index);
  return (
    <FloatingProjectCard
      slide={slide}
      index={index}
      total={SLIDES}
      offset={offset}
      imageY={imageY}
      revealed={revealed}
      depthBlur={depthBlur}
    />
  );
}

function HeroChrome({ active, revealed }: { active: number; revealed: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.8, ease, delay: revealed ? 0.9 : 0 }}
      className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-6 sm:px-8 sm:pb-8"
    >
      <span className="text-meta hidden text-[9px] text-ash sm:block">Scroll to explore</span>

      {/* Scroll progress: the only navigation affordance the sequence has. */}
      <ol className="mx-auto flex items-center gap-3" aria-label="Featured projects">
        {heroSlides.map((item, index) => {
          const isActive = index === active;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`h-px transition-all duration-500 ${
                  isActive ? 'w-8 bg-bone' : 'w-4 bg-bone/25'
                }`}
              />
              <span
                className={`text-meta text-[9px] transition-colors duration-500 ${
                  isActive ? 'text-bone' : 'text-ash/60'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
                <span className="sr-only">{isActive ? ` — ${item.title}, current` : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <span className="text-meta hidden max-w-[9rem] text-right text-[9px] leading-relaxed text-ash sm:block">
        A different
        <br />
        perspective
      </span>
    </motion.div>
  );
}
