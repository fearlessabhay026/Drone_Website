import { ArrowUpRight } from 'lucide-react';
import { advicty } from '../data/site';

/**
 * Skyframe is not a real studio. This says so, up front, for as long as the
 * hero is on screen; the footer repeats it for the rest of the page.
 *
 * A slim pill under the navigation on phones and tablets; on desktop, where
 * the headline fills the top of the frame, a badge in the bottom-left corner.
 *
 * Plain markup rather than a motion entrance, so it is in the very first
 * paint of the prerendered page.
 */
export function ConceptNotice() {
  return (
    <a
      href={advicty.href}
      target="_blank"
      rel="noopener"
      className="text-meta surface-glass group absolute top-[4.75rem] left-1/2 z-20 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-bone/12 px-4 py-2.5 text-[9px] leading-snug text-bone/80 transition-colors duration-300 hover:text-bone sm:top-[5.75rem] lg:top-auto lg:bottom-8 lg:left-8 lg:max-w-[21rem] lg:translate-x-0 lg:items-end lg:rounded-2xl lg:py-3 lg:leading-relaxed"
    >
      <span>
        Concept site by Advicty
        <span className="hidden lg:inline">
          {' '}
          — built to show what an aerial studio’s site can look like.
        </span>{' '}
        <span className="text-bone">Want one?</span>
      </span>
      <ArrowUpRight
        size={11}
        strokeWidth={1.5}
        aria-hidden
        className="shrink-0 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}
