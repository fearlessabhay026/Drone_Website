import * as motionReact from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '../data/site';
import { Figure } from './ui/Figure';
import { cinematic, inViewSoft } from '../lib/motion';

const { motion } = motionReact;

const ASPECT: Record<Project['layout'], string> = {
  wide: 'aspect-[4/3] lg:aspect-[16/11]',
  offset: 'aspect-[4/5]',
  full: 'aspect-[4/3] sm:aspect-[21/9]',
  split: 'aspect-[4/3] lg:aspect-[5/4]',
};

type ProjectCardProps = {
  project: Project;
  /** Entrance delay, so a row of cards staggers. */
  delay?: number;
  sizes?: string;
};

/**
 * One portfolio entry. Hover enriches it on pointer devices; on touch the
 * same information is simply always visible, so nothing is hidden behind an
 * interaction that cannot happen.
 */
export function ProjectCard({ project, delay = 0, sizes }: ProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inViewSoft}
      transition={{ ...cinematic, delay }}
      className="group relative"
    >
      <a
        href={`#${project.id}`}
        aria-label={`${project.title} — ${project.category} in ${project.location}`}
        data-cursor="view"
        data-cursor-label={`View\nproject`}
        className="block focus-visible:outline-offset-8"
      >
        <div className={`relative overflow-hidden rounded-xl ${ASPECT[project.layout]}`}>
          <Figure
            asset={project.image}
            sizes={sizes}
            className="h-full w-full"
            imgClassName="transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />

          {/* Accent wash keyed to the project's own imagery. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-60"
            style={{ background: project.accent }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
          />

          <span className="text-meta absolute top-4 left-4 text-[9px] text-bone/70 sm:top-5 sm:left-5">
            {project.index}
          </span>

          <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                {/* Title shifts on hover; metadata is always present on touch. */}
                <h3 className="font-display text-2xl font-semibold tracking-tight transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 sm:text-3xl">
                  {project.title}
                </h3>
                <p className="text-meta mt-2 text-[9px] text-bone/65">
                  {project.location} · {project.category}
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-bone/0 opacity-0 transition-all duration-700 group-hover:text-bone/70 group-hover:opacity-100 max-lg:hidden">
                  {project.note}
                </p>
              </div>
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-bone/25 text-bone transition-colors duration-500 group-hover:bg-bone group-hover:text-ink"
              >
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </div>
      </a>
    </motion.article>
  );
}
