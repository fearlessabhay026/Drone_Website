import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  FLIGHT_PLAN,
  FLIGHT_PLAN_COMPACT,
  INTRO_BEND,
  INTRO_BEND_COMPACT,
  INTRO_START,
  INTRO_START_COMPACT,
  resolvePlan,
  samplePath,
  toWorld,
  type ResolvedPoint,
} from './flight';
import { flight, markArrived } from './flightStore';

const MODEL_URL = '/models/quadrotor-drone.glb';
const PROPELLERS = ['propeller_FL', 'propeller_FR', 'propeller_RL', 'propeller_RR'];

/** Entrance duration. Long enough to read as flight, short enough to not stall. */
const INTRO_SECONDS = 3.2;

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
    seeded: false,
  });

  const scratch = useMemo(
    () => ({
      raw: { x: 0, y: 0, z: 0 },
      world: { x: 0, y: 0, z: 0 },
      target: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
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

    // Rebuild the spline when the measured sections change.
    if (flight.ranges.size && rangesVersion.current !== flight.ranges.size) {
      path.current = resolvePlan(compact ? FLIGHT_PLAN_COMPACT : FLIGHT_PLAN, flight.ranges);
      rangesVersion.current = flight.ranges.size;
    }

    // Where the flight plan says it should be right now.
    samplePath(path.current, flight.progress, scratch.raw);
    toWorld(scratch.raw, aspect, scratch.world);
    scratch.target.set(scratch.world.x, scratch.world.y, scratch.world.z);

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
    const lambda = reduced ? 12 : s.intro < 1 ? 9 : 3.4;
    s.pos.x = damp(s.pos.x, scratch.target.x, lambda, dt);
    s.pos.y = damp(s.pos.y, scratch.target.y, lambda, dt);
    s.pos.z = damp(s.pos.z, scratch.target.z, lambda, dt);

    // Hover: a slow figure-of-eight, tiny. Not a bounce.
    const hover = reduced ? 0 : 1;
    const bobY = Math.sin(s.elapsed * 1.15) * 0.045 * hover;
    const bobX = Math.sin(s.elapsed * 0.73 + 1.2) * 0.03 * hover;

    group.position.set(s.pos.x + bobX, s.pos.y + bobY, s.pos.z);

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

    s.rot.z = damp(s.rot.z, targetRoll, 2.6, dt);
    s.rot.x = damp(s.rot.x, targetPitch, 2.6, dt);
    s.rot.y = damp(s.rot.y, targetYaw, 2.2, dt);

    group.rotation.set(
      s.rot.x + Math.sin(s.elapsed * 0.9) * 0.012 * hover,
      s.rot.y,
      s.rot.z + Math.sin(s.elapsed * 1.3 + 0.5) * 0.014 * hover,
    );

    // Perspective already shrinks it with depth; this keeps it readable.
    const bodyGroup = body.current;
    if (bodyGroup) bodyGroup.scale.setScalar(scale);

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
