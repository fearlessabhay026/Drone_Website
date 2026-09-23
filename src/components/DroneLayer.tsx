import { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useIsDesktop, useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import { markArrived, useIsDocked } from '../three/flightStore';
import { useFlightDriver } from '../three/useFlightDriver';

const DroneStage = lazy(() => import('../three/DroneStage'));

/** Content must never wait on WebGL. If the drone has not taken off by now, the page moves on. */
const ARRIVAL_FALLBACK_MS = 2600;

/** WebGL can fail for reasons we do not control; the page simply carries on without it. */
class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
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

/**
 * Mounts the drone as a fixed layer that sits *above* the page background and
 * *below* its text and cards. That z-order is the whole art direction: the
 * drone passes behind the oversized headline and emerges beside it, and it
 * can never render on top of something you are trying to read.
 */
export function DroneLayer() {
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const coarse = useMediaQuery('(pointer: coarse)');
  const docked = useIsDocked();
  const [supported, setSupported] = useState<boolean | null>(null);

  useFlightDriver();

  useEffect(() => {
    // Probing for WebGL needs a real document, so it cannot be derived during
    // render — this is exactly the external-system case effects are for.
    // oxlint-disable-next-line react/set-state-in-effect
    setSupported(hasWebGL());
  }, []);

  // Release the content regardless of what the 3D layer is doing.
  useEffect(() => {
    const timer = window.setTimeout(markArrived, ARRIVAL_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (supported === false) markArrived();
  }, [supported]);

  if (supported === null || supported === false) return null;

  // Phones get a smaller drone and the cheaper renderer path; the content is
  // the priority on a small screen and the GPU budget is far tighter.
  const quality: 'high' | 'low' = isDesktop && !coarse ? 'high' : 'low';
  const scale = isDesktop ? 3.1 : coarse ? 2.1 : 2.6;

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
      }`}
      style={{ contain: 'strict' }}
    >
      <StageBoundary>
        <Suspense fallback={null}>
          <DroneStage quality={quality} reduced={reduced} scale={scale} compact={!isDesktop} />
        </Suspense>
      </StageBoundary>
    </div>
  );
}
