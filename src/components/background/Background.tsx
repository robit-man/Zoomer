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
    showCables: false,
    showWallStrips: true,
    bloomEnabled: config.post.bloom.enabled,
    bloomStrength: config.post.bloom.strength,
    exposure: config.lighting.exposure,
  };

  if (!ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[config.render.dprMin, config.render.dprMax]}
        gl={{
          antialias: config.render.antialias,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: effectiveDebug.exposure,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows={config.render.shadows ? { type: THREE.BasicShadowMap } : false}
        camera={{
          position: [0, 1.68, 10.8],
          fov: 52,
          near: 0.18,
          far: 42,
        }}
      >
        <LabScene debugSettings={effectiveDebug} progress={progress} />
      </Canvas>
    </div>
  );
}
