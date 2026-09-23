import * as motionReact from 'motion/react';
import { useReducedMotion } from '../hooks/useMediaQuery';

const { motion, useScroll, useSpring } = motionReact;

/**
 * A hairline on the right edge that fills as the story advances.
 *
 * With the hero's arrows gone, scroll is the only way through the sequence,
 * so there needs to be *some* signal that there is further to go. It is one
 * pixel wide and driven by a transform, so it costs nothing and reads as
 * punctuation rather than a scrollbar.
 */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-1/2 right-4 z-40 hidden h-[28svh] w-px -translate-y-1/2 bg-bone/12 lg:block"
    >
      <motion.div
        style={{ scaleY, transformOrigin: 'top' }}
        className="h-full w-full bg-bone/70"
      />
    </div>
  );
}
