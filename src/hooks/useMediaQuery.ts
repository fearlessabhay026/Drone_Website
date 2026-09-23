import { useCallback, useSyncExternalStore } from 'react';

/**
 * Media-query state that is safe to hydrate: the prerendered HTML is built
 * with `fallback`, React hydrates against that same value and then re-renders
 * with the real match, so server and client markup never disagree.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** Desktop gets the full composition; below this the layout is redesigned. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** True when the device has a real pointer, i.e. hover interactions make sense. */
export const useHasPointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
