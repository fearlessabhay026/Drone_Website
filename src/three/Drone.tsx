import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  DOCK_WIDTH_PX,
  DOCK_Z,
  FLIGHT_PLAN,
  FLIGHT_PLAN_COMPACT,
  INTRO_BEND,
  INTRO_BEND_COMPACT,
  INTRO_START,
  INTRO_START_COMPACT,
  pixelToViewportPoint,
  resolvePlan,
  samplePath,
  scaleForPixelWidth,
  smoothstep,
  toWorld,
  type ResolvedPoint,
} from './flight';
import { flight, markArrived, setDocked } from './flightStore';

const MODEL_URL = '/models/quadrotor-drone.glb';
const PROPELLERS = ['propeller_FL', 'propeller_FR', 'propeller_RL', 'propeller_RR'];

/** Entrance duration. Long enough to read as flight, short enough to not stall. */
const INTRO_SECONDS = 3.2;

/**
 * How long the hand-off from flight to dock takes, in viewport heights.
 *
 * Deliberately measured in screens rather than page progress: a fixed
 * fraction of progress is hundreds of pixels on a long page, which left a
 * half-docked, oversized drone hanging around for most of the first screen
 * after the hero.
 */
const DOCK_BLEND_SCREENS = 0.55;
/** How long a section-change reaction takes to settle. */
const PULSE_SECONDS = 1.1;

/** Decoder is self-hosted; the site makes no third-party requests. */
function configureLoader(loader: GLTFLoader) {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  draco.setDecoderConfig({ type: 'wasm' });
  loader.setDRACOLoader(draco);
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-9 * t));
const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

type DroneProps = {
  quality: 'high' | 'low';
  reduced: boolean;
  scale: number;
  /** Compact viewports fly their own, simpler plan. */
  compact: boolean;
};

export function Drone({ quality, reduced, scale, compact }: DroneProps) {
  const gltf = useLoader(GLTFLoader, MODEL_URL, configureLoader);
  const rig = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  // One instance, cloned so StrictMode's double-mount cannot share a mutated tree.
  const model = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = quality === 'high';
      child.receiveShadow = quality === 'high';
      child.frustumCulled = true;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (mat && 'envMapIntensity' in mat) {
        // The model's clearcoat/anisotropy only reads with something to reflect.
        mat.envMapIntensity = 0.85;
      }
    });
    return root;
  }, [gltf.scene, quality]);

  const props = useMemo(
    () =>
      PROPELLERS.map((name) => model.getObjectByName(name)).filter(
        (node): node is THREE.Object3D => Boolean(node),
      ),
    [model],
  );

  // Resolved spline, rebuilt whenever section geometry changes.
  const path = useRef<ResolvedPoint[]>([]);
  const rangesVersion = useRef(-1);

  const state = useRef({
    elapsed: 0,
    intro: reduced ? 1 : 0,
    // Smoothed position, so scroll jitter never reaches the model directly.
    pos: new THREE.Vector3(),
    prev: new THREE.Vector3(),
    rot: new THREE.Euler(),
    scale: scale,
    seeded: false,
    // Docked state: which section we were last in, and how much of the
    // reaction to that change is still playing out.
    section: '',
    pulse: 0,
    pulseDir: 1,
    docked: false,
  });

  const scratch = useMemo(
    () => ({
      raw: { x: 0, y: 0, z: 0 },
      world: { x: 0, y: 0, z: 0 },
      target: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      dockPoint: { x: 0, y: 0, z: 0 },
      dockWorld: { x: 0, y: 0, z: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (reduced) markArrived();
  }, [reduced]);

  useFrame((frameState, delta) => {
    const group = rig.current;
    if (!group) return;

    // Clamp dt: a backgrounded tab returns with a huge delta and would
    // teleport the drone across the scene.
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    s.elapsed += dt;

    const aspect = frameState.viewport.aspect || 1;
    const viewHeightPx = frameState.size.height || 1;
    const viewWidthPx = frameState.size.width || 1;

    // Rebuild the spline when the measured sections change.
    if (flight.ranges.size && rangesVersion.current !== flight.ranges.size) {
      path.current = resolvePlan(compact ? FLIGHT_PLAN_COMPACT : FLIGHT_PLAN, flight.ranges);
      rangesVersion.current = flight.ranges.size;
    }

    // Where the flight plan says it should be right now.
    samplePath(path.current, flight.progress, scratch.raw);
    toWorld(scratch.raw, aspect, scratch.world);
    scratch.target.set(scratch.world.x, scratch.world.y, scratch.world.z);

    // Past the hero the drone leaves the page and takes station in the
    // navigation, so the flight target crossfades into the dock target.
    const hero = flight.ranges.get('hero');
    const dockFrom = hero ? hero.end : 0.22;
    const dockBlend =
      flight.scrollable > 0 ? (viewHeightPx * DOCK_BLEND_SCREENS) / flight.scrollable : 0.05;
    const dockT = !flight.dock.measured
      ? 0
      : reduced
        ? 1 // No flight to perform, so it simply lives in the navigation.
        : smoothstep(dockFrom, dockFrom + dockBlend, flight.progress);

    let flightScale = scale;
    if (dockT > 0) {
      const anchor = pixelToViewportPoint(flight.dock.x, flight.dock.y, viewWidthPx, viewHeightPx);
      // `scratch` is a per-instance scratchpad, reused each frame to avoid
      // allocating vectors 60 times a second. Mutating it is the point.
      // oxlint-disable-next-line react/immutability
      scratch.dockPoint.x = anchor.x;
      scratch.dockPoint.y = anchor.y;
      scratch.dockPoint.z = DOCK_Z;
      toWorld(scratch.dockPoint, aspect, scratch.dockWorld);

      scratch.target.x = THREE.MathUtils.lerp(scratch.target.x, scratch.dockWorld.x, dockT);
      scratch.target.y = THREE.MathUtils.lerp(scratch.target.y, scratch.dockWorld.y, dockT);
      scratch.target.z = THREE.MathUtils.lerp(scratch.target.z, scratch.dockWorld.z, dockT);

      const dockScale = scaleForPixelWidth(
        compact ? DOCK_WIDTH_PX.compact : DOCK_WIDTH_PX.comfortable,
        DOCK_Z,
        viewHeightPx,
      );
      flightScale = THREE.MathUtils.lerp(scale, dockScale, dockT);
    }

    // Tell the page once the drone has committed, so the canvas can come
    // forward over the (opaque, when scrolled) navigation bar.
    const isDocked = dockT > 0.5;
    if (isDocked !== s.docked) {
      s.docked = isDocked;
      setDocked(isDocked);
    }

    // A small reaction each time the visitor crosses into a new section.
    if (dockT > 0.35 && !reduced) {
      let current = '';
      for (const [name, range] of flight.ranges) {
        if (flight.progress >= range.start && flight.progress < range.end) {
          current = name;
          break;
        }
      }
      if (current && current !== s.section) {
        if (s.section) {
          s.pulse = 1;
          s.pulseDir = -s.pulseDir;
        }
        s.section = current;
      }
    }
    if (s.pulse > 0) s.pulse = Math.max(0, s.pulse - dt / PULSE_SECONDS);

    // Ease out, so the nudge lands and settles rather than snapping back.
    const pulse = s.pulse * s.pulse * (3 - 2 * s.pulse);

    if (!reduced && s.intro < 1) {
      // Entrance: an arc from far out, easing into the flight plan's first
      // point. Blended rather than cut, so there is no seam at handover.
      s.intro = Math.min(1, s.intro + dt / INTRO_SECONDS);
      const t = easeOutExpo(s.intro);

      const from = toWorld(compact ? INTRO_START_COMPACT : INTRO_START, aspect, { x: 0, y: 0, z: 0 });
      const bend = toWorld(compact ? INTRO_BEND_COMPACT : INTRO_BEND, aspect, { x: 0, y: 0, z: 0 });

      // Quadratic Bezier: start -> bend -> the plan's current point.
      const u = 1 - t;
      scratch.target.set(
        u * u * from.x + 2 * u * t * bend.x + t * t * scratch.world.x,
        u * u * from.y + 2 * u * t * bend.y + t * t * scratch.world.y,
        u * u * from.z + 2 * u * t * bend.z + t * t * scratch.world.z,
      );

      if (s.intro >= 1) markArrived();
    }

    if (!s.seeded) {
      s.pos.copy(scratch.target);
      s.prev.copy(scratch.target);
      s.seeded = true;
    }

    // Acceleration and deceleration come from this damping, not from the
    // path: the drone always trails its target slightly and catches up.
    // Docked it holds station more tightly, or it would drift with scroll.
    const lambda = reduced ? 12 : s.intro < 1 ? 9 : THREE.MathUtils.lerp(3.4, 7, dockT);
    s.pos.x = damp(s.pos.x, scratch.target.x, lambda, dt);
    s.pos.y = damp(s.pos.y, scratch.target.y, lambda, dt);
    s.pos.z = damp(s.pos.z, scratch.target.z, lambda, dt);

    // Hover: a slow figure-of-eight, tiny. Not a bounce. Scaled down when
    // docked, where the same amplitude would read as a wobbling icon.
    const hover = reduced ? 0 : 1;
    const hoverAmp = THREE.MathUtils.lerp(1, 0.16, dockT);
    const bobY = Math.sin(s.elapsed * 1.15) * 0.045 * hover * hoverAmp;
    const bobX = Math.sin(s.elapsed * 0.73 + 1.2) * 0.03 * hover * hoverAmp;
    // The section reaction: a small lift and sidestep that decays away.
    const pulseY = pulse * 0.16 * hover * hoverAmp * 2.4;
    const pulseX = pulse * s.pulseDir * 0.12 * hover * hoverAmp * 2.4;

    group.position.set(s.pos.x + bobX + pulseX, s.pos.y + bobY + pulseY, s.pos.z);

    // Banking derived from actual velocity, so it always matches the motion.
    scratch.velocity.subVectors(s.pos, s.prev).multiplyScalar(1 / Math.max(dt, 0.0001));
    s.prev.copy(s.pos);

    const vx = THREE.MathUtils.clamp(scratch.velocity.x, -14, 14);
    const vy = THREE.MathUtils.clamp(scratch.velocity.y, -14, 14);
    const vz = THREE.MathUtils.clamp(scratch.velocity.z, -14, 14);

    // Roll into the turn, pitch into the climb, yaw toward travel.
    const targetRoll = reduced ? 0 : THREE.MathUtils.clamp(-vx * 0.055, -0.42, 0.42);
    const targetPitch = reduced ? 0.06 : THREE.MathUtils.clamp(vy * 0.045 + 0.06, -0.3, 0.38);
    const targetYaw = reduced
      ? -0.5
      : THREE.MathUtils.clamp(Math.atan2(vx, Math.abs(vz) + 2.5), -0.7, 0.7) - 0.28;

    // Docked it faces the visitor squarely and banks into its reaction.
    const dockRoll = -s.pulseDir * pulse * 0.5;
    const dockYaw = -0.34 + Math.sin(s.elapsed * 0.45) * 0.09;

    s.rot.z = damp(s.rot.z, THREE.MathUtils.lerp(targetRoll, dockRoll, dockT), 2.6, dt);
    s.rot.x = damp(s.rot.x, THREE.MathUtils.lerp(targetPitch, 0.1, dockT), 2.6, dt);
    s.rot.y = damp(s.rot.y, THREE.MathUtils.lerp(targetYaw, dockYaw, dockT), 2.2, dt);

    group.rotation.set(
      s.rot.x + Math.sin(s.elapsed * 0.9) * 0.012 * hover * hoverAmp,
      s.rot.y,
      s.rot.z + Math.sin(s.elapsed * 1.3 + 0.5) * 0.014 * hover * hoverAmp,
    );

    // Perspective already shrinks it with depth; this keeps it readable.
    s.scale = damp(s.scale, flightScale, 6, dt);
    const bodyGroup = body.current;
    if (bodyGroup) bodyGroup.scale.setScalar(s.scale);

    // Rotors. Fast enough to blur into discs, alternating like a real quad.
    if (!reduced) {
      const spin = dt * 46;
      for (let i = 0; i < props.length; i += 1) {
        // Mutating Object3D transforms per frame is how three.js animates.
        // oxlint-disable-next-line react/immutability
        props[i].rotation.y += i % 2 === 0 ? spin : -spin;
      }
    }
  });

  return (
    <group ref={rig}>
      <group ref={body} scale={scale}>
        <primitive object={model} />
      </group>
    </group>
  );
}

// Warms the model fetch as soon as this chunk evaluates, so the download
// overlaps the rest of the 3D bundle parsing rather than following it.
if (typeof window !== 'undefined') {
  useLoader.preload(GLTFLoader, MODEL_URL, configureLoader);
}
