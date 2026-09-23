import { useRef } from 'react';
import * as motionReact from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { featuredProject, projects } from '../data/site';
import { Figure } from './ui/Figure';
import { Grain } from './ui/Grain';
import { useOpenProject } from '../hooks/useOpenProject';
import { MagneticButton } from './ui/MagneticButton';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { inViewSoft, stagger, rise } from '../lib/motion';

const { motion, useScroll, useTransform } = motionReact;

/** Full-bleed cinematic interlude between the portfolio and the studio. */
export function FeaturedProject() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const openProject = useOpenProject();
  const featured = projects.find((project) => project.id === featuredProject.projectId);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // The plate creeps forward through the whole time it is on screen.
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.16]);
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);

  return (
    <section
      ref={ref}
      data-flight="featured"
      aria-labelledby="featured-heading"
      className="relative flex min-h-[86svh] items-end overflow-hidden lg:min-h-[100svh]"
    >
      <motion.div style={{ scale, y }} className="absolute inset-[-6%] z-[1]">
        <Figure asset={featuredProject.image} sizes="100vw" className="h-full w-full" />
      </motion.div>

      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-ink via-ink/55 to-ink/35" />
      <Grain className="z-[1]" />

      <motion.div
        variants={stagger(0.1, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={inViewSoft}
        className="relative z-10 mx-auto w-full max-w-[112rem] px-4 pb-16 sm:px-6 lg:pb-24"
      >
        <motion.p variants={rise} className="text-meta text-[9px] text-bone/70">
          Project {featured?.index}
        </motion.p>

        <motion.h2
          id="featured-heading"
          variants={rise}
          className="text-display text-edge mt-5 text-[clamp(3rem,10vw,9rem)]"
        >
          {featuredProject.title}
        </motion.h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <motion.p variants={rise} className="text-meta text-[9px] text-bone/70">
              {featuredProject.location}
            </motion.p>
            <motion.p variants={rise} className="mt-5 max-w-md text-balance leading-relaxed text-ash">
              {featuredProject.description}
            </motion.p>
            <motion.div variants={rise} className="mt-9">
              <MagneticButton
                onClick={() => featured && openProject(featured.id)}
                ariaHasPopup="dialog"
                className="text-meta group inline-flex cursor-pointer items-center gap-3 rounded-full bg-bone px-6 py-3.5 text-[9px] text-ink transition-colors duration-300 hover:bg-white"
              >
                {featuredProject.cta}
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
            {featuredProject.markers.map((marker) => (
              <li key={marker}>{marker}</li>
            ))}
          </motion.ul>
        </div>

        <motion.ol
          variants={rise}
          className="mt-12 flex items-center gap-4 border-t border-bone/10 pt-6"
          aria-label="Project index"
        >
          {projects.map((project) => (
            <li
              key={project.id}
              className={`text-meta text-[9px] ${
                project.id === featuredProject.projectId ? 'text-bone' : 'text-ash/45'
              }`}
            >
              {project.index}
            </li>
          ))}
        </motion.ol>
      </motion.div>
    </section>
  );
}
