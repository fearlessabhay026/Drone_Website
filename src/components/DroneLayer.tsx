import { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useIsDesktop, useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import { markArrived, setDroneMode, useDroneMode, useIsDocked } from '../three/flightStore';
import { useFlightDriver } from '../three/useFlightDriver';

const DroneStage = lazy(() => import('../three/DroneStage'));

/** Content must never wait on WebGL. If the drone has not taken off by now, the page moves on. */
const ARRIVAL_FALLBACK_MS = 2600;

/** WebGL can fail for reasons we do not control; the hero falls back to the still. */
class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    setDroneMode('static');
    markArrived();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

type NetworkInformation = { saveData?: boolean };

/**
 * The 3D drone is ~410KB (three.js chunk + model) and a continuous GPU load.
 * Visitors who asked for less motion or less data, and devices that report
 * 4GB of memory or less, get the static picture instead.
 */
function prefersLite() {
  const nav = navigator as Navigator & { connection?: NetworkInformation; deviceMemory?: number };
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    nav.connection?.saveData === true ||
    (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4)
  );
}

/** Resolves once the page's own images and fonts have finished loading. */
function useWindowLoaded() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Reading the document's load state is the external-system case effects are for.
    // oxlint-disable-next-line react/set-state-in-effect
    if (document.readyState === 'complete') return setLoaded(true);
    const onLoad = () => setLoaded(true);
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return loaded;
}

/** Whether the hero is on screen, so a phone can stop rendering once it has gone. */
function useHeroInView() {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const hero = document.getElementById('top');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return inView;
}

/**
 * Mounts the drone as a fixed layer that sits *above* the page background and
 * *below* its text and cards. That z-order is the whole art direction: the
 * drone passes behind the oversized headline and emerges beside it, and it
 * can never render on top of something you are trying to read.
 */
export function DroneLayer() {
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const phone = useMediaQuery('(max-width: 767.98px)');
  const coarse = useMediaQuery('(pointer: coarse)');
  const docked = useIsDocked();
  const mode = useDroneMode();
  const windowLoaded = useWindowLoaded();
  const heroInView = useHeroInView();

  useFlightDriver();

  useEffect(() => {
    // Probing for WebGL and the device's limits needs a real browser.
    setDroneMode(!prefersLite() && hasWebGL() ? '3d' : 'static');
  }, []);

  // Release the content regardless of what the 3D layer is doing.
  useEffect(() => {
    const timer = window.setTimeout(markArrived, ARRIVAL_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === 'static') markArrived();
  }, [mode]);

  if (mode !== '3d') return null;

  // On a small screen the hero's images and fonts come first: the 3D chunk
  // waits for them rather than competing for the same connection.
  if (!isDesktop && !windowLoaded) return null;

  // Phones get a smaller drone and the cheaper renderer path; the content is
  // the priority on a small screen and the GPU budget is far tighter.
  const quality: 'high' | 'low' = isDesktop && !coarse ? 'high' : 'low';
  const scale = isDesktop ? 3.1 : coarse ? 2.1 : 2.6;

  // Phones have no dock (the navigation is too narrow to hold the drone
  // beside the wordmark): it climbs out of frame after the hero, and the
  // canvas stops rendering until the hero is back on screen.
  const paused = phone && !heroInView;

  return (
    <div
      aria-hidden
      // Normally the canvas sits behind the page's content. Once the drone
      // docks it has to come forward, because the navigation bar is opaque
      // when scrolled and would otherwise hide it. The canvas never takes
      // pointer events, so nothing underneath stops being clickable, and it
      // stays below the mobile menu overlay.
      className={`pointer-events-none fixed inset-0 transition-none ${
        docked ? 'z-[55]' : 'z-[5]'
      } ${paused ? 'invisible' : ''}`}
      style={{ contain: 'strict' }}
    >
      <StageBoundary>
        <Suspense fallback={null}>
          <DroneStage
            quality={quality}
            reduced={reduced}
            scale={scale}
            compact={!isDesktop}
            paused={paused}
          />
        </Suspense>
      </StageBoundary>
    </div>
  );
}
