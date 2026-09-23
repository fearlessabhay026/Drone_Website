import { useEffect } from 'react';
import { flight, measureSections, readScrollProgress } from './flightStore';

/**
 * Keeps `flight.progress` and the section map current.
 *
 * The scroll handler is passive and writes one number — no layout reads, no
 * state updates. Geometry is only re-measured on resize and when the document
 * height changes (images finishing, fonts swapping), not per scroll event.
 */
export function useFlightDriver() {
  useEffect(() => {
    const sync = () => {
      flight.progress = readScrollProgress();
    };

    const remeasure = () => {
      measureSections();
      sync();
    };

    remeasure();
    // Images and fonts settle after mount and change section offsets.
    const settle = window.setTimeout(remeasure, 600);
    const settleLate = window.setTimeout(remeasure, 2000);

    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', remeasure);

    const observer = new ResizeObserver(remeasure);
    observer.observe(document.body);

    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(settleLate);
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', remeasure);
      observer.disconnect();
    };
  }, []);
}
