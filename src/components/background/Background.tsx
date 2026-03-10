"use client";

import type { MotionValue } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import LabScene from "@/components/lab/LabScene";
import type { DebugSettings } from "@/components/lab/util/DebugUI";
import { useTuning } from "@/components/lab/useTuning";

export default function Background({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const { ready, config } = useTuning();

  const effectiveDebug: DebugSettings = {
    showCables: true,
    showWallStrips: true,
    bloomEnabled: config.post.bloom.enabled,
    bloomStrength: config.post.bloom.intensity,
    exposure: config.lighting.exposure,
  };

  if (!ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: effectiveDebug.exposure,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{
          position: [0, 1.68, 10.8],
          fov: 52,
          near: 0.1,
          far: 100,
        }}
      >
        <LabScene debugSettings={effectiveDebug} progress={progress} />
      </Canvas>
    </div>
  );
}
