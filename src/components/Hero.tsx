import { useRef } from 'react';
import * as motionReact from 'motion/react';
import { media } from '../data/media';
import { projects } from '../data/site';
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
 */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const k = reduced ? 0 : 1;
  // Background drifts slowest, type fastest — classic parallax ordering.
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140 * k]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1 + 0.14 * k]);
  const typeY = useTransform(scrollYProgress, [0, 1], [0, -240 * k]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, 90 * k]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 1 - 0.14 * k]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, reduced ? 1 : 0.2]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -40 * k]);
  const chromeY = useTransform(scrollYProgress, [0, 1], [0, 60 * k]);

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 sm:px-6"
    >
      {/* Layer 1 — the aerial plate */}
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease }}
        className="absolute inset-0"
      >
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-[-8%]">
          <Figure
            asset={media.heroBackground}
            priority
            sizes="100vw"
            className="h-full w-full"
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-ink/65 via-ink/45 to-ink"
        />
        <Grain />
      </motion.div>

      {/* Layer 2 — oversized type, partly obscured by the card */}
      <motion.h1
        style={{ y: typeY }}
        className="text-display pointer-events-none absolute inset-x-0 top-[13%] z-10 px-4 text-center text-[clamp(3.25rem,18.5vw,17rem)] text-bone/92 sm:top-[11%]"
      >
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '108%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.5, ease, delay: 0.45 }}
            className="block will-change-transform"
          >
            Aerial
          </motion.span>
        </span>
        <span className="block overflow-hidden">
          <motion.span
            initial={{ y: '108%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.5, ease, delay: 0.6 }}
            className="block will-change-transform"
          >
            Stories
          </motion.span>
        </span>
      </motion.h1>

      {/* Layer 3 — the floating object */}
      <motion.div
        style={{ y: cardY, scale: cardScale, opacity: cardOpacity }}
        className="relative z-20 mt-[8.5rem] flex w-full justify-center sm:mt-[8rem] lg:mt-[10.5rem]"
      >
        <FloatingProjectCard imageY={imageY} />
      </motion.div>

      {/* Layer 4 — hero chrome */}
      <motion.div
        style={{ y: chromeY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease, delay: 2.05 }}
        className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 px-5 pb-6 sm:px-8 sm:pb-8"
      >
        <span className="text-meta hidden text-[9px] text-ash sm:block">Scroll to explore</span>

        <ol className="mx-auto flex items-center gap-3" aria-label="Featured projects">
          {projects.map((project, index) => (
            <li key={project.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className={`h-px transition-all duration-500 ${
                  index === 0 ? 'w-8 bg-bone' : 'w-4 bg-bone/25'
                }`}
              />
              <span className={`text-meta text-[9px] ${index === 0 ? 'text-bone' : 'text-ash/60'}`}>
                {project.index}
              </span>
            </li>
          ))}
        </ol>

        <span className="text-meta hidden max-w-[9rem] text-right text-[9px] leading-relaxed text-ash sm:block">
          A different
          <br />
          perspective
        </span>
      </motion.div>
    </section>
  );
}
