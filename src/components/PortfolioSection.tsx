import { ArrowRight } from 'lucide-react';
import { projects } from '../data/site';
import { ProjectCard } from './ProjectCard';
import { useOpenProject } from '../hooks/useOpenProject';
import { SectionLabel } from './ui/SectionLabel';
import { Reveal } from './ui/Reveal';

/**
 * Deliberately asymmetric: a wide opener, a tall offset counterweight, a
 * full-bleed cinematic frame, then a split with room for type. Never a grid
 * of equal thirds.
 */
export function PortfolioSection() {
  const [coast, city, desert, estate] = projects;
  const openProject = useOpenProject();

  return (
    <section id="work" aria-labelledby="work-heading" className="relative px-4 py-24 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-[112rem]">
        <header className="mb-14 lg:mb-20">
          <div className="flex items-center justify-between gap-6">
            <SectionLabel>Our portfolio</SectionLabel>
            <button
              type="button"
              onClick={() => openProject(coast.id)}
              aria-haspopup="dialog"
              className="text-meta group flex cursor-pointer items-center gap-2 text-[9px] text-ash transition-colors hover:text-bone"
            >
              View all
              <ArrowRight
                size={12}
                strokeWidth={1.5}
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </button>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h2
              id="work-heading"
              className="text-display text-edge text-[clamp(2.75rem,8vw,7rem)] lg:col-span-7"
            >
              <Reveal>Selected</Reveal>
              <Reveal delay={0.08}>Work</Reveal>
            </h2>
            <p className="max-w-md text-balance text-ash lg:col-span-4 lg:col-start-9">
              Aerial photography and cinematography created from a different perspective.
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <ProjectCard project={coast} sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>

          {/* Offset vertically so the row never reads as a tidy pair. */}
          <div className="lg:col-span-4 lg:mt-24">
            <ProjectCard project={city} delay={0.1} sizes="(max-width: 1024px) 100vw, 30vw" />
          </div>

          <div className="lg:col-span-12 lg:mt-10">
            <ProjectCard project={desert} sizes="100vw" />
          </div>

          <div className="lg:col-span-7 lg:mt-10">
            <ProjectCard project={estate} sizes="(max-width: 1024px) 100vw, 52vw" />
          </div>

          <div className="flex flex-col justify-end pb-2 lg:col-span-4 lg:col-start-9 lg:mt-10">
            <p className="text-meta text-[9px] text-ash">{estate.index} / Notes</p>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-bone/80">{estate.note}</p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ash">
              Every project is scouted, flown and graded in-house, so the final frames carry one
              consistent point of view.
            </p>
            <button
              type="button"
              onClick={() => openProject(estate.id)}
              aria-haspopup="dialog"
              className="text-meta group mt-8 flex w-fit cursor-pointer items-center gap-3 rounded-full border border-bone/20 px-5 py-3 text-[9px] transition-colors duration-500 hover:bg-bone hover:text-ink"
            >
              Explore the archive
              <ArrowRight
                size={12}
                strokeWidth={1.5}
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
