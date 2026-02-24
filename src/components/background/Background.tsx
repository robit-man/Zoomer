"use client";

import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import LabScene from "@/components/lab/LabScene";
import DebugUI, { type DebugSettings } from "@/components/lab/util/DebugUI";
import { useTuning } from "@/components/lab/useTuning";

export default function Background() {
  const { ready, config } = useTuning();

  const [debugSettings, setDebugSettings] = useState<DebugSettings | null>(null);

  // Initialize debug defaults from tuned config once ready
  const effectiveDebug: DebugSettings = debugSettings ?? {
    showCables: true,
    showWallStrips: true,
    bloomEnabled: config.post.bloom.enabled,
    bloomStrength: config.post.bloom.intensity,
    exposure: config.lighting.exposure,
  };

  const handleDebugChange = useCallback((settings: DebugSettings) => {
    setDebugSettings(settings);
  }, []);

  if (!ready) return null;

  return (
    <>
      <div className="fixed inset-0 z-0">
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: effectiveDebug.exposure,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          shadows={{ type: THREE.PCFSoftShadowMap }}
          camera={{
            position: [0, 2.5, 8],
            fov: 55,
            near: 0.1,
            far: 100,
          }}
        >
          <LabScene debugSettings={effectiveDebug} />
        </Canvas>
      </div>
      <DebugUI onChange={handleDebugChange} />
    </>
  );
}
