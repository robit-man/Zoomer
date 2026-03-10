"use client";

import { useEffect, useMemo, useRef, type ReactElement } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LAB, HALF_W, HALF_L } from "../config";
import { flickerNoise } from "../util/noise";
import { createRackMaterial, createStripMaterial } from "./Materials";

function setStripIntensity(material: THREE.MeshStandardMaterial, intensity: number) {
  material.emissiveIntensity = intensity;
}

export default function WallStrips() {
  const cfg = LAB.wallStrips;
  const stripCount = cfg.countPerWall;
  const spacing = LAB.room.length / (stripCount + 1);
  const yCenter = cfg.marginFromFloor + cfg.height / 2;
  const pocketMat = useMemo(() => createRackMaterial(), []);
  const eastColors = useMemo(
    () => Array.from({ length: stripCount }, (_, index) => (
      index === cfg.eastAccentIndex ? cfg.eastAccentColor : cfg.color
    )),
    [cfg.color, cfg.eastAccentColor, cfg.eastAccentIndex, stripCount],
  );
  const westColors = useMemo(
    () => Array.from({ length: stripCount }, (_, index) => (
      index === cfg.westAccentIndex ? cfg.westAccentColor : cfg.color
    )),
    [cfg.color, cfg.westAccentColor, cfg.westAccentIndex, stripCount],
  );

  const stripMaterials = useMemo(() => {
    const mats: THREE.MeshStandardMaterial[] = [];

    for (let i = 0; i < stripCount; i += 1) {
      mats.push(createStripMaterial(i * 1.37 + i * 0.73, eastColors[i]));
    }

    for (let i = 0; i < stripCount; i += 1) {
      mats.push(createStripMaterial((stripCount + i) * 1.37 + i * 0.73, westColors[i]));
    }

    return mats;
  }, [eastColors, westColors, stripCount]);

  const materialsRef = useRef(stripMaterials);

  useEffect(() => {
    materialsRef.current = stripMaterials;
  }, [stripMaterials]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const mat of materialsRef.current) {
      const phase = mat.userData.phase as number;
      const noise = flickerNoise(t, phase, cfg.flickerSpeed);
      setStripIntensity(
        mat,
        cfg.emissiveBase + (noise - 0.5) * 2 * cfg.emissiveAmplitude,
      );
    }
  });

  const strips: ReactElement[] = [];
  const lights: ReactElement[] = [];
  const pocketDepth = cfg.pocketDepth;
  const pocketWidth = cfg.pocketWidth;
  const slotInset = cfg.slotInset;
  const lightInset = cfg.lightInset;
  const shadowEvery = Math.max(1, Math.floor(cfg.shadowEvery));

  for (let i = 0; i < stripCount; i += 1) {
    const z = -HALF_L + spacing * (i + 1);
    strips.push(
      <group key={`e-${i}`}>
        <mesh
          position={[HALF_W - pocketDepth / 2 + 0.004, yCenter, z]}
          castShadow
          receiveShadow
          material={pocketMat}
        >
          <boxGeometry args={[pocketDepth, cfg.height + 0.18, pocketWidth]} />
        </mesh>
        <mesh
          position={[HALF_W - slotInset, yCenter, z]}
          rotation={[0, -Math.PI / 2, 0]}
          material={stripMaterials[i]}
        >
          <planeGeometry args={[cfg.width, cfg.height]} />
        </mesh>
      </group>,
    );

    lights.push(
      <spotLight
        key={`e-light-${i}`}
        position={[HALF_W - lightInset, yCenter, z]}
        target-position={[0.1, yCenter, z]}
        color={eastColors[i]}
        intensity={cfg.slotLightIntensity}
        angle={cfg.slotLightAngle}
        penumbra={1}
        distance={cfg.slotLightDistance}
        decay={2}
        castShadow={i % shadowEvery === 0}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.00045}
      />,
    );
  }

  for (let i = 0; i < stripCount; i += 1) {
    const z = -HALF_L + spacing * (i + 1);
    strips.push(
      <group key={`w-${i}`}>
        <mesh
          position={[-HALF_W + pocketDepth / 2 - 0.004, yCenter, z]}
          castShadow
          receiveShadow
          material={pocketMat}
        >
          <boxGeometry args={[pocketDepth, cfg.height + 0.18, pocketWidth]} />
        </mesh>
        <mesh
          position={[-HALF_W + slotInset, yCenter, z]}
          rotation={[0, Math.PI / 2, 0]}
          material={stripMaterials[stripCount + i]}
        >
          <planeGeometry args={[cfg.width, cfg.height]} />
        </mesh>
      </group>,
    );

    lights.push(
      <spotLight
        key={`w-light-${i}`}
        position={[-HALF_W + lightInset, yCenter, z]}
        target-position={[-0.1, yCenter, z]}
        color={westColors[i]}
        intensity={cfg.slotLightIntensity}
        angle={cfg.slotLightAngle}
        penumbra={1}
        distance={cfg.slotLightDistance}
        decay={2}
        castShadow={(i + Math.ceil(shadowEvery / 2)) % shadowEvery === 0}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.00045}
      />,
    );
  }

  return (
    <group name="wallStrips">
      {strips}
      {lights}
    </group>
  );
}
