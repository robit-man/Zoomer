"use client";

import { Suspense, useState, useCallback } from "react";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import RoomGeometry from "./env/RoomGeometry";
import LightingRig from "./env/LightingRig";
import WallStrips from "./env/WallStrips";
import Structure from "./env/Structure";
import Furniture from "./env/Furniture";
import PhysicsProvider from "./physics/PhysicsProvider";
import CableSystem from "./physics/CableSystem";
import { LAB } from "./config";
import type { DebugSettings } from "./util/DebugUI";

interface LabSceneProps {
  debugSettings?: DebugSettings;
}

function CableLayer({ visible }: { visible: boolean }) {
  return (
    <PhysicsProvider>
      <CableSystem visible={visible} />
    </PhysicsProvider>
  );
}

export default function LabScene({ debugSettings }: LabSceneProps) {
  const showCables = debugSettings?.showCables ?? true;
  const showStrips = debugSettings?.showWallStrips ?? true;
  const bloomEnabled = debugSettings?.bloomEnabled ?? LAB.post.bloom.enabled;
  const bloomStrength = debugSettings?.bloomStrength ?? LAB.post.bloom.intensity;

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={1}
        maxDistance={18}
        maxPolarAngle={Math.PI * 0.95}
        target={[0, 1.6, 0]}
      />

      {/* Scene graph: world group */}
      <group name="world">
        <RoomGeometry />
        <LightingRig />
        {showStrips && <WallStrips />}
        <Structure />
        <Furniture />

        {/* Physics-driven cables */}
        <Suspense fallback={null}>
          <CableLayer visible={showCables} />
        </Suspense>

        {/* Probe / debug groups */}
        <group name="probes" />
        <group name="debug" />
      </group>

      {/* Post-processing */}
      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={bloomStrength}
            luminanceThreshold={LAB.post.bloom.luminanceThreshold}
            luminanceSmoothing={LAB.post.bloom.luminanceSmoothing}
          />
        </EffectComposer>
      )}
    </>
  );
}
