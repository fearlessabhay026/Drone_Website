import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_FOV, CAMERA_Z } from './flight';
import { DroneScene } from './DroneScene';

type StageProps = {
  quality: 'high' | 'low';
  reduced: boolean;
  scale: number;
  compact: boolean;
};

/**
 * The WebGL surface. Default-exported so it can be code-split: three and
 * react-three-fiber are ~160KB gzipped and must not sit in the critical
 * bundle for a page whose content is HTML and images.
 */
export default function DroneStage({ quality, reduced, scale, compact }: StageProps) {
  return (
    <Canvas
      // The page owns the background; the canvas only composites the drone.
      gl={{
        alpha: true,
        antialias: quality === 'high',
        powerPreference: 'high-performance',
        // Drawing buffer is never read back, so let the driver discard it.
        preserveDrawingBuffer: false,
      }}
      dpr={quality === 'high' ? [1, 1.5] : [1, 1.25]}
      shadows={quality === 'high'}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 0.5, far: 120 }}
      // Reduced motion has nothing moving, so stop rendering entirely once
      // it settles; otherwise render continuously for the flight.
      frameloop={reduced ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <DroneScene quality={quality} reduced={reduced} scale={scale} compact={compact} />
    </Canvas>
  );
}
