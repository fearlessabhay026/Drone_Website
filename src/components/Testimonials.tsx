import { useState } from 'react';
import * as motionReact from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { testimonials } from '../data/site';
import { SectionLabel } from './ui/SectionLabel';
import { inViewSoft } from '../lib/motion';

const { motion, AnimatePresence } = motionReact;

/** One quote, held large. Not a wall of small cards. */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const current = testimonials[index];

  const go = (step: number) => {
    setDirection(step);
    setIndex((value) => (value + step + testimonials.length) % testimonials.length);
  };

  return (
    <section
      aria-labelledby="testimonial-heading"
      className="relative border-t border-bone/8 px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-[112rem]">
        <div className="flex items-center justify-between gap-6">
          <SectionLabel>Client testimonial</SectionLabel>
          <p className="text-meta text-[9px] text-ash" aria-live="polite">
            {String(index + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
          </p>
        </div>

        <h2 id="testimonial-heading" className="sr-only">
          What clients say
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inViewSoft}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:items-end lg:gap-10"
        >
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.blockquote
                key={index}
                initial={{ opacity: 0, y: direction * 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction * -26 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-[clamp(1.75rem,4.6vw,3.6rem)] leading-[1.14] tracking-tight text-balance text-bone"
              >
                <span aria-hidden className="mr-1 text-ash/50">
                  “
                </span>
                {current.quote}
                <span aria-hidden className="text-ash/50">
                  ”
                </span>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="flex items-end justify-between gap-6 lg:col-span-3 lg:col-start-10 lg:flex-col lg:items-start">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figcaption
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 lg:border-l lg:border-bone/15 lg:pl-6"
              >
                {/* A monogram rather than a stock face — nobody is invented here. */}
                <span
                  aria-hidden
                  className="text-meta flex size-11 shrink-0 items-center justify-center rounded-full border border-bone/20 text-[10px] text-bone/80"
                >
                  {current.initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-bone">{current.name}</span>
                  <span className="text-meta mt-1 block text-[9px] text-ash">{current.role}</span>
                </span>
              </motion.figcaption>
            </AnimatePresence>

            <div className="flex shrink-0 items-center gap-2 lg:mt-8">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className="flex size-10 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:bg-bone hover:text-ink"
              >
                <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className="flex size-10 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:bg-bone hover:text-ink"
              >
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
