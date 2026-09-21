import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion language: slow, weighted, and never bouncy. Every transition
 * on the site comes from this file so the whole page moves as one piece.
 */

export const ease = [0.16, 1, 0.3, 1] as const;

export const cinematic: Transition = { duration: 1.1, ease };
export const settle: Transition = { duration: 0.75, ease };
export const swift: Transition = { duration: 0.42, ease };

export const spring: Transition = {
  type: 'spring',
  stiffness: 90,
  damping: 20,
  mass: 0.9,
};

/** Fade and rise — the default entrance for text and metadata. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: cinematic },
};

export const riseSmall: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: settle },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: cinematic },
};

/** Parent that staggers its children's entrances. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Viewport config used by every scroll-triggered section. */
export const inView = { once: true, amount: 0.25 } as const;
export const inViewSoft = { once: true, amount: 0.15 } as const;
