import { useRef } from 'react';
import * as motionReact from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { booking } from '../data/site';
import { Figure } from './ui/Figure';
import { Grain } from './ui/Grain';
import { MagneticButton } from './ui/MagneticButton';
import { SectionLabel } from './ui/SectionLabel';
import { Reveal } from './ui/Reveal';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { inViewSoft, rise, stagger } from '../lib/motion';

const { motion, useScroll, useTransform } = motionReact;

/** The conclusion of the visual story. */
export function BookingCTA() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -80]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 1.12, 1]);

  return (
    <section
      id="contact"
      data-flight="contact"
      aria-labelledby="cta-heading"
      className="relative flex min-h-[92svh] items-end overflow-hidden"
    >
      <motion.div style={{ y, scale }} className="absolute inset-[-8%] z-[1]">
        <Figure asset={booking.image} sizes="100vw" className="h-full w-full" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-ink via-ink/60 to-ink/40" />
      <Grain className="z-[1]" />

      <motion.div
        variants={stagger(0.09, 0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={inViewSoft}
        className="relative z-10 mx-auto w-full max-w-[112rem] px-4 pb-16 sm:px-6 lg:pb-24"
      >
        <motion.div variants={rise}>
          <SectionLabel>{booking.eyebrow}</SectionLabel>
        </motion.div>

        <h2 id="cta-heading" className="text-display text-edge mt-8 text-[clamp(3rem,11vw,10rem)]">
          {booking.title.map((line, index) => (
            <Reveal key={line} delay={index * 0.08}>
              {line}
            </Reveal>
          ))}
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <motion.p variants={rise} className="max-w-md text-balance leading-relaxed text-ash">
              {booking.body}
            </motion.p>

            <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-3">
              <MagneticButton
                href={booking.primary.href}
                className="text-meta group inline-flex items-center gap-3 rounded-full bg-bone px-7 py-4 text-[9px] text-ink transition-colors duration-300 hover:bg-white"
              >
                {booking.primary.label}
                <ArrowRight
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </MagneticButton>
              <MagneticButton
                href={booking.secondary.href}
                className="text-meta group inline-flex items-center gap-3 rounded-full border border-bone/25 px-7 py-4 text-[9px] text-bone transition-colors duration-300 hover:bg-bone/10"
              >
                {booking.secondary.label}
                <ArrowRight
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </MagneticButton>
            </motion.div>
          </div>

          <motion.ul
            variants={rise}
            className="text-meta hidden gap-1.5 text-right text-[9px] leading-[2] text-ash lg:col-span-3 lg:col-start-10 lg:flex lg:flex-col"
          >
            {booking.markers.map((marker) => (
              <li key={marker}>{marker}</li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}
