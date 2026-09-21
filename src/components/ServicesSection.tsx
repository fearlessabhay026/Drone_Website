import * as motionReact from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { services } from '../data/site';
import { media } from '../data/media';
import { Figure } from './ui/Figure';
import { SectionLabel } from './ui/SectionLabel';
import { Reveal } from './ui/Reveal';
import { cinematic, inViewSoft } from '../lib/motion';

const { motion } = motionReact;

/**
 * Large numbered rows rather than cards. The rows fill from the left on
 * hover, which keeps the section quiet until it is addressed.
 */
export function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative border-t border-bone/8 px-4 py-24 sm:px-6 lg:py-36"
    >
      <div className="mx-auto max-w-[112rem]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <SectionLabel>Our services</SectionLabel>
            <h2
              id="services-heading"
              className="text-display text-edge mt-8 text-[clamp(2.5rem,7vw,6rem)]"
            >
              <Reveal>From above,</Reveal>
              <Reveal delay={0.08}>differently.</Reveal>
            </h2>
          </div>
          <p className="max-w-sm text-ash lg:col-span-4 lg:col-start-9 lg:pt-3">
            Professional aerial solutions for modern creators, brands and businesses.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <ul className="lg:col-span-8">
            {services.map((service, index) => (
              <motion.li
                key={service.index}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={inViewSoft}
                transition={{ ...cinematic, delay: index * 0.06 }}
                className="border-t border-bone/10 last:border-b"
              >
                <a
                  href="#contact"
                  className="group relative flex items-center gap-5 overflow-hidden py-7 sm:gap-8 sm:py-9"
                >
                  {/* Wipe that fills the row from the left. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left scale-x-0 bg-bone transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                  <span className="text-display relative shrink-0 text-2xl text-ash/50 transition-colors duration-500 group-hover:text-ink/45 sm:text-3xl">
                    {service.index}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold tracking-tight transition-colors duration-500 group-hover:text-ink sm:text-2xl">
                      {service.title}
                    </span>
                    <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-ash transition-colors duration-500 group-hover:text-ink/70">
                      {service.description}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="relative shrink-0 text-bone transition-all duration-500 group-hover:translate-x-1 group-hover:text-ink"
                  >
                    <ArrowRight size={18} strokeWidth={1.5} />
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>

          <div className="lg:col-span-4 lg:col-start-9">
            <Figure
              asset={media.servicesAccent}
              sizes="(max-width: 1024px) 100vw, 28vw"
              className="aspect-[3/4] w-full rounded-xl"
            />
            <p className="text-meta mt-6 text-[9px] leading-[2] text-ash">
              Perspective
              <br />
              creates
              <br />
              possibilities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
