import * as motionReact from 'motion/react';
import { about } from '../data/site';
import { Figure } from './ui/Figure';
import { SectionLabel } from './ui/SectionLabel';
import { inViewSoft, rise, stagger } from '../lib/motion';

const { motion } = motionReact;

/** Editorial split: portrait left, statement and figures right. */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative px-4 py-24 sm:px-6 lg:py-36"
    >
      <div className="mx-auto grid max-w-[112rem] gap-10 lg:grid-cols-12 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inViewSoft}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <Figure
            asset={about.image}
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="aspect-[4/5] w-full rounded-xl lg:aspect-[4/5]"
          />
        </motion.div>

        <motion.div
          variants={stagger(0.09, 0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewSoft}
          className="flex flex-col justify-center lg:col-span-6 lg:col-start-7"
        >
          <motion.div variants={rise}>
            <SectionLabel>{about.eyebrow}</SectionLabel>
          </motion.div>

          {/* The one serif moment on the page — it earns the emphasis. */}
          <motion.blockquote
            variants={rise}
            id="about-heading"
            className="mt-8 font-serif text-[clamp(1.9rem,4.4vw,3.4rem)] leading-[1.12] tracking-tight text-balance text-bone"
          >
            {about.statement}
          </motion.blockquote>

          {about.body.map((paragraph) => (
            <motion.p
              key={paragraph.slice(0, 24)}
              variants={rise}
              className="mt-6 max-w-xl leading-relaxed text-ash"
            >
              {paragraph}
            </motion.p>
          ))}

          <motion.dl
            variants={rise}
            className="mt-12 grid grid-cols-3 gap-6 border-t border-bone/10 pt-8"
          >
            {about.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="text-display block text-[clamp(1.75rem,4vw,2.75rem)]">
                    {stat.value}
                  </span>
                  <span className="text-meta mt-2 block text-[9px] text-ash">{stat.label}</span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  );
}
