import { useRef } from 'react';
import type { ReactNode } from 'react';
import * as motionReact from 'motion/react';
import { useHasPointer } from '../../hooks/useMediaQuery';
import { spring } from '../../lib/motion';

const { motion, useMotionValue, useSpring } = motionReact;

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** How far the button may drift toward the cursor, in pixels. */
  strength?: number;
  ariaLabel?: string;
  ariaHasPopup?: 'dialog';
};

/**
 * A button that leans very slightly toward the pointer. The effect is
 * disabled on touch devices, where it has no meaning and costs work.
 *
 * The offset lives in motion values rather than React state, so a mouse
 * moving across the button animates on the compositor instead of
 * re-rendering the component sixty times a second.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className = '',
  strength = 6,
  ariaLabel,
  ariaHasPopup,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const hasPointer = useHasPointer();

  const x = useSpring(useMotionValue(0), spring);
  const y = useSpring(useMotionValue(0), spring);

  const handleMove = (event: React.MouseEvent) => {
    if (!hasPointer || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const shared = {
    ref: ref as never,
    className,
    onMouseMove: handleMove,
    onMouseLeave: reset,
    onBlur: reset,
    style: { x, y },
    'aria-label': ariaLabel,
    'aria-haspopup': ariaHasPopup,
  };

  if (href) {
    return (
      <motion.a href={href} {...shared}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} {...shared}>
      {children}
    </motion.button>
  );
}
