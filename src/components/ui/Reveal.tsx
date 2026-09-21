import { useRef } from 'react';
import type { ReactNode } from 'react';
import * as motionReact from 'motion/react';
import { cinematic } from '../../lib/motion';
import { useReducedMotion } from '../../hooks/useMediaQuery';

const { motion, useInView } = motionReact;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance the line travels, as a percentage of its own height. */
  distance?: string;
};

/**
 * Masked line reveal: the text slides up from behind a hard edge.
 *
 * The observer deliberately watches the *outer* wrapper, not the moving
 * element. The inner element starts translated fully below the wrapper's
 * overflow-hidden box, so the browser clips it to zero area — `whileInView`
 * on the inner element would never fire and the text would stay hidden.
 */
export function Reveal({ children, className = '', delay = 0, distance = '110%' }: RevealProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduced = useReducedMotion();

  // With motion reduced the line is simply present; it is never left parked
  // below the mask.
  if (reduced) {
    return <span className={`block ${className}`}>{children}</span>;
  }

  return (
    <span ref={ref} className={`block overflow-hidden ${className}`}>
      <motion.span
        initial={{ y: distance }}
        animate={inView ? { y: '0%' } : { y: distance }}
        transition={{ ...cinematic, delay }}
        className="block will-change-transform"
      >
        {children}
      </motion.span>
    </span>
  );
}
