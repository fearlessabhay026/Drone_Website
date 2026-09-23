import { Suspense, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Drone } from './Drone';
import { markActive } from './flightStore';

type SceneProps = {
  quality: 'high' | 'low';
  reduced: boolean;
  scale: number;
  compact: boolean;
};

/**
 * Lighting rig.
 *
 * The model's materials are clearcoat / anisotropic / IOR-based, which means
 * they are mostly *reflection*. Lit with lights alone they read as flat grey
 * plastic. RoomEnvironment gives them something to reflect and costs nothing
 * over the wire — it is generated procedurally rather than loaded as an HDR.
 */
function Environment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    // Assigning to the three.js scene is the documented way to set an
    // environment map. The lint rule is about React state, not scene graphs.
    // oxlint-disable-next-line react/immutability
    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      room.dispose?.();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

export function DroneScene({ quality, reduced, scale, compact }: SceneProps) {
  useEffect(() => {
    markActive();
  }, []);

  const shadows = quality === 'high';

  // Matches the site's palette: warm key, cool rim, nothing neutral.
  const lights = useMemo(
    () => ({
      key: new THREE.Color('#fff4e2'),
      rim: new THREE.Color('#9fc4d8'),
      fill: new THREE.Color('#2a3138'),
    }),
    [],
  );

  return (
    <>
      <Environment />

      <ambientLight intensity={0.35} color={lights.fill} />

      {/* Key: high and to the left, matching the aerial plates' light.
          The shadow map is only 512 — it self-shadows one small object, and
          the shadow pass re-renders all 48 draw calls every frame. */}
      <directionalLight
        position={[-6, 7, 6]}
        intensity={2.4}
        color={lights.key}
        castShadow={shadows}
        shadow-mapSize-width={shadows ? 512 : 0}
        shadow-mapSize-height={shadows ? 512 : 0}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      />

      {/* Rim: behind and to the right, to separate it from a dark page. */}
      <directionalLight position={[7, 2, -8]} intensity={1.7} color={lights.rim} />

      {/* Belly bounce, so the underside never goes fully black. */}
      <directionalLight position={[0, -5, 3]} intensity={0.45} color={lights.fill} />

      <Suspense fallback={null}>
        <Drone quality={quality} reduced={reduced} scale={scale} compact={compact} />
      </Suspense>
    </>
  );
}
