import { useSyncExternalStore } from 'react';

/**
 * Shared flight state.
 *
 * Scroll progress and section geometry are plain mutable fields, read from
 * inside the render loop. They deliberately do NOT live in React state: the
 * drone updates every frame, and putting that in state would re-render the
 * page's whole component tree on every scroll event.
 *
 * Only `arrived` is reactive — it flips once, when the entrance finishes.
 */

type Range = { start: number; end: number };

const listeners = new Set<() => void>();

export const flight = {
  /** Document scroll progress, 0..1. Written by the scroll listener. */
  progress: 0,
  /** Measured section ranges in page-progress space. */
  ranges: new Map<string, Range>(),
  /** True once the entrance flight has handed the page over to the content. */
  arrived: false,
  /** True when the 3D layer is actually running (not blocked/failed/off). */
  active: false,
  /**
   * Centre of the navigation's dock anchor, in CSS pixels. The drone flies
   * here once the hero is done and holds station beside the wordmark.
   */
  dock: { x: 0, y: 0, measured: false },
  /** Scrollable page height in px, so durations can be set in screens. */
  scrollable: 0,
  /**
   * True once the drone has committed to the dock. The canvas is normally
   * behind the page's content, but the navigation bar is opaque when
   * scrolled, so the layer has to come forward to sit beside the wordmark.
   */
  docked: false,
};

function notify() {
  for (const listener of listeners) listener();
}

export function markArrived() {
  if (flight.arrived) return;
  flight.arrived = true;
  notify();
}

export function markActive() {
  if (flight.active) return;
  flight.active = true;
  notify();
}

export function setDocked(value: boolean) {
  if (flight.docked === value) return;
  flight.docked = value;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Whether the hero is cleared to reveal. The 3D layer flips this when the
 * drone settles; a caller-side timeout guarantees it flips regardless, so
 * content is never hostage to WebGL loading, failing, or being unsupported.
 */
export function useHasArrived() {
  return useSyncExternalStore(
    subscribe,
    () => flight.arrived,
    () => true, // server/no-JS: content is simply present
  );
}

export function useFlightActive() {
  return useSyncExternalStore(
    subscribe,
    () => flight.active,
    () => false,
  );
}

export function useIsDocked() {
  return useSyncExternalStore(
    subscribe,
    () => flight.docked,
    () => false,
  );
}

/** Re-measures every `[data-flight]` section into page-progress space. */
export function measureSections() {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return;
  flight.scrollable = scrollable;

  // The dock anchor is fixed to the viewport, so its position only changes
  // with layout, which is exactly when this runs.
  const anchor = document.querySelector<HTMLElement>('[data-drone-dock]');
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    flight.dock.x = rect.left + rect.width / 2;
    flight.dock.y = rect.top + rect.height / 2;
    flight.dock.measured = rect.width > 0 || rect.height > 0;
  }

  const next = new Map<string, Range>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-flight]')) {
    const name = el.dataset.flight;
    if (!name) continue;
    const top = el.getBoundingClientRect().top + window.scrollY;
    // A section's "moment" runs from when its top reaches the viewport top
    // until its bottom does, which is how far you scroll while it is on screen.
    const start = top / scrollable;
    const end = (top + el.offsetHeight) / scrollable;
    next.set(name, { start: Math.max(0, start), end: Math.min(1, end) });
  }
  flight.ranges = next;
}

export function readScrollProgress() {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  return scrollable <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / scrollable));
}
