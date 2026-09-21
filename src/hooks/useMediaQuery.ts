import { useEffect, useState } from 'react';

export function useMediaQuery(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? fallback : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    // Only correct the initial guess if it actually disagrees, so this never
    // schedules a render on every mount. Subscribing to matchMedia is the
    // textbook external-system effect, so the lint rule does not apply.
    // oxlint-disable-next-line react/set-state-in-effect
    setMatches((current) => (current === mql.matches ? current : mql.matches));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Desktop gets the full composition; below this the layout is redesigned. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** True when the device has a real pointer, i.e. hover interactions make sense. */
export const useHasPointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
