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
      aria-labelledby="statement-heading"
      className="relative h-[280svh] lg:h-[320svh]"
    >
      <motion.div
        style={{ backgroundColor: background }}
        className="sticky top-0 flex h-[100svh] items-center overflow-hidden"
      >
        <Grain />

        <div className="relative mx-auto flex w-full max-w-[112rem] flex-col justify-center px-4 sm:px-6">
          {/* Oversized type: the composition, not a heading above one. */}
          <h2
            id="statement-heading"
            className="text-display text-edge relative z-10 text-[clamp(3rem,15vw,12rem)] text-bone"
          >
            {WORDS.map((word, index) => (
              <Reveal key={word} delay={index * 0.07}>
                {word}
              </Reveal>
            ))}
          </h2>

          {/* Floating plate, sitting over the type. */}
          <motion.div
            style={{ y: plateY, rotate: plateRotate }}
            className="pointer-events-none absolute top-1/2 right-4 z-20 w-[min(62vw,34rem)] -translate-y-1/2 sm:right-8 lg:right-[8%]"
          >
            <div className="shadow-cinematic relative aspect-[4/3] w-full overflow-hidden rounded-xl">
              {statementStates.map((state, index) => (
                <motion.div
                  key={state.id}
                  className="absolute inset-0"
                  animate={{ opacity: active === index ? 1 : 0, scale: active === index ? 1 : 1.04 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Figure
                    asset={state.image}
                    sizes="(max-width: 640px) 62vw, 34rem"
                    className="h-full w-full"
                  />
                </motion.div>
              ))}
              <div aria-hidden className="absolute inset-0 ring-1 ring-bone/15 ring-inset" />
            </div>

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

          {/* State index */}
          <ol
            className="absolute top-1/2 right-4 z-30 hidden -translate-y-[13rem] gap-3 lg:right-[3%] lg:flex lg:flex-col"
            aria-label="Visual states"
          >
            {statementStates.map((state, index) => (
              <li key={state.id} className="flex items-center justify-end gap-3">
                <span
                  aria-hidden
                  className={`h-px transition-all duration-700 ${
                    active === index ? 'w-7 bg-bone' : 'w-3 bg-bone/25'
                  }`}
                />
                <span
                  className={`text-meta text-[9px] transition-colors duration-700 ${
                    active === index ? 'text-bone' : 'text-bone/35'
                  }`}
                >
                  {state.index} {state.label}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-meta absolute right-4 bottom-8 z-30 hidden text-right text-[9px] leading-[2] text-bone/50 sm:block lg:right-[3%]">
            New perspectives.
            <br />
            Same planet.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
