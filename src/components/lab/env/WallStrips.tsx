"use client";

import { useRef, useMemo, type ReactElement } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LAB, HALF_W, HALF_L } from "../config";
import { flickerNoise } from "../util/noise";
import { createStripMaterial } from "./Materials";

export default function WallStrips() {
  const cfg = LAB.wallStrips;
  const stripCount = cfg.countPerWall;
  const spacing = LAB.room.length / (stripCount + 1);
  const yCenter = cfg.marginFromFloor + cfg.height / 2;

  // Create strip materials with unique phase offsets
  const stripMaterials = useMemo(() => {
    const mats: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < stripCount * 2; i++) {
      mats.push(createStripMaterial(i * 1.37 + i * 0.73));
    }
    return mats;
  }, [stripCount]);

  const matsRef = useRef(stripMaterials);
  matsRef.current = stripMaterials;

  // Animate emissive intensity
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const mat of matsRef.current) {
      const phase = mat.userData.phase as number;
      const noise = flickerNoise(t, phase, cfg.flickerSpeed);
      mat.emissiveIntensity = cfg.emissiveBase + (noise - 0.5) * 2 * cfg.emissiveAmplitude;
    }
  });

  const strips: ReactElement[] = [];

  // East wall strips (+X)
  for (let i = 0; i < stripCount; i++) {
    const z = -HALF_L + spacing * (i + 1);
    strips.push(
      <mesh
        key={`e-${i}`}
        position={[HALF_W - cfg.offsetFromWall, yCenter, z]}
        rotation={[0, -Math.PI / 2, 0]}
        material={stripMaterials[i]}
      >
        <planeGeometry args={[cfg.width, cfg.height]} />
      </mesh>
    );
  }

  // West wall strips (-X)
  for (let i = 0; i < stripCount; i++) {
    const z = -HALF_L + spacing * (i + 1);
    strips.push(
      <mesh
        key={`w-${i}`}
        position={[-HALF_W + cfg.offsetFromWall, yCenter, z]}
        rotation={[0, Math.PI / 2, 0]}
        material={stripMaterials[stripCount + i]}
      >
        <planeGeometry args={[cfg.width, cfg.height]} />
      </mesh>
    );
  }

  return (
    <group name="wallStrips">
      {strips}
      {/* Blue bleed lights - one per wall side */}
      <rectAreaLight
        position={[HALF_W - 0.1, yCenter, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.2}
        height={LAB.room.length * 0.9}
        intensity={cfg.bleedLight.intensity}
        color={cfg.bleedLight.color}
      />
      <rectAreaLight
        position={[-HALF_W + 0.1, yCenter, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.2}
        height={LAB.room.length * 0.9}
        intensity={cfg.bleedLight.intensity}
        color={cfg.bleedLight.color}
      />
    </group>
  );
}
