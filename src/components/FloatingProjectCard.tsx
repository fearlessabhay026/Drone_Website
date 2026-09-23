import * as motionReact from 'motion/react';
import type { MotionValue } from 'motion/react';
import { Figure } from './ui/Figure';
import type { HeroSlide } from '../data/site';
import { ease } from '../lib/motion';

const { motion, useTransform } = motionReact;

type FloatingProjectCardProps = {
  slide: HeroSlide;
  index: number;
  total: number;
  /**
   * Continuous distance from the active slide: 0 is front and centre,
   * positive is still to come, negative has already passed.
   */
  offset: MotionValue<number>;
  /** Independent parallax offset for the photograph inside the card. */
  imageY: MotionValue<number>;
  /** Gates the entrance until the drone has settled. */
  revealed: boolean;
  /** Depth-of-field on the off-centre cards. Desktop only — `filter: blur`
   *  forces its own compositing layer and is not worth it on a phone. */
  depthBlur: boolean;
};

/**
 * The hero's foreground object. The photograph deliberately overhangs the
 * card's top edge so the composition reads as layered depth rather than a
 * picture trapped in a rectangle.
 *
 * Slides are stacked and driven by scroll rather than swapped by buttons:
 * the next card rises out of depth as the current one lifts away, so the
 * sequence reads as one continuous move instead of a carousel step.
 */
export function FloatingProjectCard({
  slide,
  index,
  total,
  offset,
  imageY,
  revealed,
  depthBlur,
}: FloatingProjectCardProps) {
  // Upcoming cards wait further back; passed cards lift away and dissolve.
  const opacity = useTransform(offset, [-0.85, -0.42, 0, 0.42, 0.85], [0, 1, 1, 1, 0]);
  const scale = useTransform(offset, [-1, 0, 1], [1.07, 1, 0.9]);
  const y = useTransform(offset, [-1, 0, 1], ['-16%', '0%', '14%']);
  const blur = useTransform(offset, [-1, -0.3, 0, 0.3, 1], [5, 0, 0, 0, 5]);
  const filter = useTransform(blur, (value) => `blur(${value.toFixed(2)}px)`);

  // The first card sits in flow and gives the stack its height; the rest
  // overlay it. It is also the one the entrance sequence reveals.
  const isFirst = index === 0;

  return (
    <motion.div
      style={depthBlur ? { opacity, scale, y, filter } : { opacity, scale, y }}
      className={`${
        isFirst ? 'relative' : 'absolute inset-x-0 top-0'
      } flex justify-center will-change-transform`}
    >
      <div
        className="relative w-[min(92vw,58rem,78svh)]"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${total}: ${slide.title}`}
      >
        {/* The card surface, sitting behind the photograph. */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={revealed ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.94, opacity: 0, y: 20 }}
          transition={{ duration: 1, ease, delay: revealed && isFirst ? 0.26 : 0 }}
          className="surface-glass shadow-cinematic relative rounded-[1.75rem] p-2.5 sm:rounded-[2rem] sm:p-3"
        >
          <div className="relative aspect-[16/11] w-full sm:aspect-[16/9]">
            {/* Parallax carrier, kept separate from the entrance so the two
                never write to the same transform. */}
            <motion.div style={{ y: imageY }} className="absolute inset-0 sm:-top-[9%] sm:h-[109%]">
              <motion.div
                initial={{ scale: 1.04, opacity: 0 }}
                animate={revealed ? { scale: 1, opacity: 1 } : { scale: 1.04, opacity: 0 }}
                transition={{ duration: 1.1, ease, delay: revealed && isFirst ? 0.44 : 0 }}
                className="relative h-full w-full"
              >
                <div className="shadow-cinematic relative h-full w-full overflow-hidden rounded-[1.4rem] sm:rounded-[1.6rem]">
                  <Figure
                    asset={slide.image}
                    priority={isFirst}
                    sizes="(max-width: 640px) 92vw, 58rem"
                    className="h-full w-full"
                  />

                  {/* Keeps the caption legible against bright water. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.7, ease, delay: revealed && isFirst ? 0.66 : 0 }}
                  className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6"
                >
                  <p className="text-meta text-bone/70">{slide.eyebrow}</p>
                  <p className="mt-1.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {slide.title}
                  </p>
                  <p className="text-meta mt-1 text-[10px] text-bone/60">{slide.location}</p>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Metadata slab, overlapping the photograph's right edge. */}
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: 14 }}
              transition={{ duration: 0.8, ease, delay: revealed && isFirst ? 0.78 : 0 }}
              className="absolute top-3 right-3 hidden rounded-[1.1rem] border border-bone/10 bg-ink/45 px-4 py-3 backdrop-blur-md sm:block"
            >
              <p className="text-meta text-[9px] text-bone/55">{slide.eyebrow}</p>
              <p className="text-meta mt-2 text-[9px] text-bone/80">{slide.location}</p>
              <p className="text-meta mt-1 text-[9px] text-bone/80">{slide.meta}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
