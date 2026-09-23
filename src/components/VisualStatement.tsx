import { useRef, useState } from 'react';
import * as motionReact from 'motion/react';
import { statementStates } from '../data/site';
import { Figure } from './ui/Figure';
import { Grain } from './ui/Grain';
import { Reveal } from './ui/Reveal';
import { useReducedMotion } from '../hooks/useMediaQuery';

const { motion, useScroll, useTransform, useMotionValueEvent } = motionReact;

const WORDS = ['See', 'What', 'Others', 'Miss.'];

/**
 * The experimental highlight. Scrolling drives a single sticky frame through
 * three visual states — the background colour, the floating plate and the
 * index all transition together, which is this site's reading of the
 * reference's colour-change behaviour.
 *
 * Below `lg` the plate does not float over the type: at phone widths it
 * covered the headline completely and the section read as an accident. It
 * stacks underneath instead, keeping the same parts in the same order.
 */
export function VisualStatement() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Hold each state, then blend into the next.
  const background = useTransform(
    scrollYProgress,
    [0, 0.3, 0.42, 0.68, 0.8, 1],
    [
      statementStates[0].background,
      statementStates[0].background,
      statementStates[1].background,
      statementStates[1].background,
      statementStates[2].background,
      statementStates[2].background,
    ],
  );

  const plateY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const plateRotate = useTransform(scrollYProgress, [0, 1], [-2.5, reduced ? -2.5 : 2]);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = value < 0.36 ? 0 : value < 0.74 ? 1 : 2;
    setActive((current) => (current === next ? current : next));
  });

  return (
    <section
      ref={ref}
      data-flight="statement"
      aria-labelledby="statement-heading"
      className="relative h-[280svh] lg:h-[320svh]"
    >
      {/* Pinned in two layers so the drone crosses between the colour field
          and the type, rather than over the top of it. */}
      <motion.div
        style={{ backgroundColor: background }}
        className="sticky top-0 z-[1] h-[100svh] overflow-hidden"
      >
        <Grain />
      </motion.div>

      <div className="sticky top-0 z-10 -mt-[100svh] flex h-[100svh] items-center overflow-hidden">
        <div className="relative mx-auto flex w-full max-w-[112rem] flex-col justify-center gap-10 px-4 sm:px-6 lg:block">
          {/* Oversized type: the composition, not a heading above one. */}
          <h2
            id="statement-heading"
            className="text-display text-edge relative z-10 text-[clamp(2.75rem,14vw,12rem)] text-bone"
          >
            {WORDS.map((word, index) => (
              <Reveal key={word} delay={index * 0.07}>
                {word}
              </Reveal>
            ))}
          </h2>

          {/* Floating plate. Over the type on desktop, beneath it on phones. */}
          <motion.div
            style={{ y: plateY }}
            className="pointer-events-none relative z-20 w-[min(76vw,24rem)] self-end sm:w-[min(58vw,26rem)] lg:absolute lg:top-1/2 lg:right-[13%] lg:w-[min(44vw,32rem)] lg:-translate-y-1/2"
          >
            {/* Only the plate tilts — a tilted caption reads as a bug. */}
            <motion.div
              style={{ rotate: plateRotate }}
              className="shadow-cinematic relative aspect-[4/3] w-full overflow-hidden rounded-xl"
            >
              {statementStates.map((state, index) => (
                <motion.div
                  key={state.id}
                  className="absolute inset-0"
                  animate={{ opacity: active === index ? 1 : 0, scale: active === index ? 1 : 1.04 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Figure
                    asset={state.image}
                    sizes="(max-width: 1024px) 60vw, 32rem"
                    className="h-full w-full"
                  />
                </motion.div>
              ))}
              <div aria-hidden className="absolute inset-0 ring-1 ring-bone/15 ring-inset" />
            </motion.div>

            <motion.p
              key={statementStates[active].id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-meta mt-4 text-[9px] text-bone/60"
            >
              {statementStates[active].caption}
            </motion.p>
          </motion.div>

          {/* State index: a row under the plate on phones, a rail on desktop. */}
          <ol
            className="z-30 flex flex-wrap items-center gap-x-5 gap-y-2 lg:absolute lg:top-1/2 lg:right-[3%] lg:flex-col lg:items-end lg:gap-3 lg:-translate-y-[13rem]"
            aria-label="Visual states"
          >
            {statementStates.map((state, index) => (
              <li key={state.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`h-px transition-all duration-700 ${
                    active === index ? 'w-7 bg-bone' : 'w-3 bg-bone/25'
                  }`}
                />
                <span
                  className={`text-meta text-[9px] transition-colors duration-700 ${
                    active === index ? 'text-bone' : 'text-bone/55'
                  }`}
                >
                  {state.index} {state.label}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-meta absolute right-4 bottom-8 z-30 hidden text-right text-[9px] leading-[2] text-bone/50 lg:right-[3%] lg:block">
            New perspectives.
            <br />
            Same planet.
          </p>
        </div>
      </div>
    </section>
  );
}
