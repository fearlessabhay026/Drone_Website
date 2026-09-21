import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import * as motionReact from 'motion/react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { bookingHref, projects } from '../data/site';
import { Figure } from './ui/Figure';
import { useDialog } from '../hooks/useDialog';
import { ProjectDialogContext } from '../hooks/useOpenProject';
import type { OpenProject } from '../hooks/useOpenProject';
import { ease, swift } from '../lib/motion';

const { motion, AnimatePresence } = motionReact;

/**
 * The portfolio's destination. Every "view project" affordance on the page
 * ends here: the photograph at full size, its metadata, and one way to start
 * a project of the same kind. It is a dialog rather than a route because the
 * site is a single page — when real project pages exist, these triggers
 * become links and this component can go.
 */
export function ProjectDialogProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback<OpenProject>((id) => {
    const next = projects.findIndex((project) => project.id === id);
    if (next >= 0) setIndex(next);
  }, []);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setIndex((current) =>
        current === null ? current : (current + delta + projects.length) % projects.length,
      ),
    [],
  );

  return (
    <ProjectDialogContext.Provider value={open}>
      {children}
      <ProjectDialog index={index} onClose={close} onStep={step} />
    </ProjectDialogContext.Provider>
  );
}

type ProjectDialogProps = {
  index: number | null;
  onClose: () => void;
  onStep: (delta: number) => void;
};

function ProjectDialog({ index, onClose, onStep }: ProjectDialogProps) {
  const ref = useDialog(index !== null, onClose);
  const project = index === null ? null : projects[index];

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title}, ${project.category} in ${project.location}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swift}
          className="fixed inset-0 z-70 flex items-center justify-center bg-ink/94 p-4 backdrop-blur-xl sm:p-6"
        >
          {/* Backdrop click target, kept behind everything interactive. */}
          <button
            type="button"
            aria-label="Close project"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />

          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease }}
            className="relative flex max-h-full w-full max-w-[72rem] flex-col gap-6 overflow-y-auto lg:flex-row lg:items-end lg:gap-10"
          >
            <div className="min-w-0 lg:flex-1">
              <Figure
                asset={project.image}
                priority
                sizes="(max-width: 1024px) 92vw, 60rem"
                className="aspect-[4/3] w-full rounded-xl sm:aspect-[16/10]"
              />
            </div>

            <div className="shrink-0 lg:w-72 lg:pb-2">
              <p className="text-meta text-[9px] text-ash">
                {project.index} / {project.year}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {project.title}
              </h2>
              <p className="text-meta mt-3 text-[9px] text-bone/65">
                {project.location} · {project.category}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-ash">{project.note}</p>

              <a
                href={bookingHref}
                className="text-meta group mt-7 flex w-fit items-center gap-3 rounded-full bg-bone px-6 py-3.5 text-[9px] text-ink transition-colors duration-300 hover:bg-white"
              >
                Start a project
                <ArrowRight
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </a>

              <div className="mt-8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStep(-1)}
                  aria-label="Previous project"
                  className="flex size-10 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:bg-bone hover:text-ink"
                >
                  <ArrowLeft size={14} strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onStep(1)}
                  aria-label="Next project"
                  className="flex size-10 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:bg-bone hover:text-ink"
                >
                  <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>
          </motion.article>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full border border-bone/15 bg-ink/60 text-bone backdrop-blur-md transition-colors hover:bg-bone hover:text-ink sm:top-6 sm:right-6"
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
