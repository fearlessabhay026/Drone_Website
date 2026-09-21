import { useEffect, useState } from 'react';
import * as motionReact from 'motion/react';
import { useHasPointer, useReducedMotion } from '../../hooks/useMediaQuery';

const { motion, useMotionValue, useSpring, AnimatePresence } = motionReact;

/**
 * A single follower dot that expands into a "View project" label over
 * anything marked `data-cursor="view"`. Pointer devices only.
 */
export function Cursor() {
  const hasPointer = useHasPointer();
  const reduced = useReducedMotion();
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 38, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 420, damping: 38, mass: 0.5 });

  useEffect(() => {
    if (!hasPointer || reduced) return;

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = (event.target as HTMLElement)?.closest?.('[data-cursor]');
      setLabel(target ? (target as HTMLElement).dataset.cursorLabel ?? 'View project' : null);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [hasPointer, reduced, x, y]);

  if (!hasPointer || reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] mix-blend-difference"
      style={{ x: sx, y: sy }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bone"
        animate={label ? { width: 108, height: 108 } : { width: 10, height: 10 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <AnimatePresence>
          {label ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="text-meta px-2 text-center text-[9px] whitespace-pre-line text-ink"
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
