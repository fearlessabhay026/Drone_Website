import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as motionReact from 'motion/react';
import { useHasPointer } from '../../hooks/useMediaQuery';
import { spring } from '../../lib/motion';

const { motion } = motionReact;

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** How far the button may drift toward the cursor, in pixels. */
  strength?: number;
  ariaLabel?: string;
};

/**
 * A button that leans very slightly toward the pointer. The effect is
 * disabled on touch devices, where it has no meaning and costs work.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  className = '',
  strength = 6,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const hasPointer = useHasPointer();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (event: React.MouseEvent) => {
    if (!hasPointer || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setOffset({ x: dx * strength, y: dy * strength });
  };

  const reset = () => setOffset({ x: 0, y: 0 });

  const shared = {
    ref: ref as never,
    className,
    onMouseMove: handleMove,
    onMouseLeave: reset,
    onBlur: reset,
    animate: { x: offset.x, y: offset.y },
    transition: spring,
    'aria-label': ariaLabel,
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
