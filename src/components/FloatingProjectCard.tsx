import * as motionReact from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { MotionValue } from 'motion/react';
import { Figure } from './ui/Figure';
import { heroProject } from '../data/site';
import { ease } from '../lib/motion';

const { motion } = motionReact;

type FloatingProjectCardProps = {
  /** Independent parallax offset for the photograph inside the card. */
  imageY: MotionValue<number>;
  onPrev?: () => void;
  onNext?: () => void;
};

/**
 * The hero's foreground object. The photograph deliberately overhangs the
 * card's top and left edges so the composition reads as layered depth rather
 * than a picture trapped in a rectangle.
 */
export function FloatingProjectCard({ imageY, onPrev, onNext }: FloatingProjectCardProps) {
  return (
    <div className="relative w-[min(92vw,58rem)]">
      {/* The card surface, sitting behind the photograph. */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 26 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1.35, ease, delay: 1.15 }}
        className="surface-glass shadow-cinematic relative rounded-[1.75rem] p-2.5 sm:rounded-[2rem] sm:p-3"
      >
        <div className="relative aspect-[16/11] w-full sm:aspect-[16/9]">
          {/* Photograph: offset up and left, breaking the card's bounds. */}
          <motion.div
            initial={{ y: 30, scale: 1.05, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease, delay: 1.42 }}
            style={{ y: imageY }}
            className="absolute inset-0 sm:-top-[9%] sm:h-[109%]"
          >
            <Figure
              asset={heroProject.image}
              priority
              sizes="(max-width: 640px) 92vw, 58rem"
              className="shadow-cinematic h-full w-full rounded-[1.4rem] sm:rounded-[1.6rem]"
            />
            {/* Keeps the caption legible against bright water. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-gradient-to-t from-ink/75 via-transparent to-transparent sm:rounded-[1.6rem]"
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 1.85 }}
              className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6"
            >
              <p className="text-meta text-bone/70">{heroProject.index}</p>
              <p className="mt-1.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {heroProject.title}
              </p>
              <p className="text-meta mt-1 text-[10px] text-bone/60">{heroProject.location}</p>
            </motion.div>
          </motion.div>

          {/* Metadata slab, overlapping the photograph's right edge. */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease, delay: 1.7 }}
            className="absolute top-3 right-3 hidden rounded-[1.1rem] border border-bone/10 bg-ink/45 px-4 py-3 backdrop-blur-md sm:block"
          >
            <p className="text-meta text-[9px] text-bone/55">{heroProject.eyebrow}</p>
            <p className="text-meta mt-2 text-[9px] text-bone/80">{heroProject.location}</p>
            <p className="text-meta mt-1 text-[9px] text-bone/80">{heroProject.altitude}</p>
          </motion.div>

          {/* Minimal circular controls. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 1.95 }}
            className="absolute right-3 bottom-3 flex items-center gap-2 sm:right-5 sm:bottom-5"
          >
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous project"
              className="flex size-9 items-center justify-center rounded-full border border-bone/20 bg-ink/40 text-bone backdrop-blur-md transition-colors duration-300 hover:bg-bone hover:text-ink sm:size-10"
            >
              <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next project"
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
