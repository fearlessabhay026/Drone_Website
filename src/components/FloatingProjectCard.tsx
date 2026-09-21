import * as motionReact from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { MotionValue } from 'motion/react';
import { Figure } from './ui/Figure';
import type { HeroSlide } from '../data/site';
import { ease } from '../lib/motion';

const { motion, AnimatePresence } = motionReact;

type FloatingProjectCardProps = {
  slide: HeroSlide;
  /** Independent parallax offset for the photograph inside the card. */
  imageY: MotionValue<number>;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * The hero's foreground object. The photograph deliberately overhangs the
 * card's top and left edges so the composition reads as layered depth rather
 * than a picture trapped in a rectangle.
 */
export function FloatingProjectCard({ slide, imageY, onPrev, onNext }: FloatingProjectCardProps) {
  return (
    <div
      id="hero-card"
      aria-live="polite"
      aria-atomic="true"
      className="relative w-[min(92vw,58rem,78svh)]"
    >
      {/* The card surface, sitting behind the photograph. */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.5 }}
        className="surface-glass shadow-cinematic relative rounded-[1.75rem] p-2.5 sm:rounded-[2rem] sm:p-3"
      >
        <div className="relative aspect-[16/11] w-full sm:aspect-[16/9]">
          {/* Parallax carrier, kept separate from the entrance so the two
              never write to the same transform. */}
          <motion.div style={{ y: imageY }} className="absolute inset-0 sm:-top-[9%] sm:h-[109%]">
            <motion.div
              initial={{ scale: 1.04, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease, delay: 0.62 }}
              className="relative h-full w-full"
            >
              <div className="shadow-cinematic relative h-full w-full overflow-hidden rounded-[1.4rem] sm:rounded-[1.6rem]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease }}
                    className="absolute inset-0"
                  >
                    <Figure asset={slide.image} priority sizes="(max-width: 640px) 92vw, 58rem" className="h-full w-full" />
                  </motion.div>
                </AnimatePresence>

                {/* Keeps the caption legible against bright water. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease, delay: 0.9 }}
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
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.85 }}
            className="absolute top-3 right-3 hidden rounded-[1.1rem] border border-bone/10 bg-ink/45 px-4 py-3 backdrop-blur-md sm:block"
          >
            <p className="text-meta text-[9px] text-bone/55">{slide.eyebrow}</p>
            <p className="text-meta mt-2 text-[9px] text-bone/80">{slide.location}</p>
            <p className="text-meta mt-1 text-[9px] text-bone/80">{slide.meta}</p>
          </motion.div>

          {/* Minimal circular controls. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.95 }}
            className="absolute right-3 bottom-3 flex items-center gap-2 sm:right-5 sm:bottom-5"
          >
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous project"
              aria-controls="hero-card"
              className="flex size-9 items-center justify-center rounded-full border border-bone/20 bg-ink/40 text-bone backdrop-blur-md transition-colors duration-300 hover:bg-bone hover:text-ink sm:size-10"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next project"
              aria-controls="hero-card"
              className="flex size-9 items-center justify-center rounded-full border border-bone/20 bg-ink/40 text-bone backdrop-blur-md transition-colors duration-300 hover:bg-bone hover:text-ink sm:size-10"
            >
              <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
