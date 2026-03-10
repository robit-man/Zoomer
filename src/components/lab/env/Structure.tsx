"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LAB, HALF_L, H } from "../config";
import { createStrutMaterial } from "./Materials";

/** Exported clamp positions for CableSystem to use */
export function getClampPositions(): THREE.Vector3[] {
  const tray = LAB.structure.tray;
  const positions: THREE.Vector3[] = [];
  const start = -HALF_L + 1;
  const end = HALF_L - 1;
  for (let z = start; z <= end; z += LAB.structure.clampSpacing) {
    positions.push(new THREE.Vector3(tray.x, tray.y - tray.height / 2 - 0.02, z));
  }
  return positions;
}

/** Get tap point indices (closest clamp to each tap Z) */
export function getTapInfo(): { clampIndex: number; z: number; side: "E" | "W" }[] {
  const clamps = getClampPositions();
  return LAB.structure.tapZPositions.map((tapZ, i) => {
    let bestIdx = 0;
    let bestDist = Infinity;
    clamps.forEach((c, ci) => {
      const d = Math.abs(c.z - tapZ);
      if (d < bestDist) { bestDist = d; bestIdx = ci; }
    });
    return {
      clampIndex: bestIdx,
      z: clamps[bestIdx].z,
      side: i % 2 === 0 ? "E" as const : "W" as const,
    };
  });
}

export default function Structure() {
  const strutMat = useMemo(() => createStrutMaterial(), []);
  const cfg = LAB.structure;
  const railS = cfg.railSize;
  const L = LAB.room.length;
  const crossCount = Math.floor(L / cfg.crossSpacing);

  const tray = cfg.tray;
  const clamps = useMemo(() => getClampPositions(), []);

  return (
    <group name="structure">
      {/* Ceiling struts */}
      <group name="ceilingStruts">
        {/* Two long rails along Z */}
        <mesh position={[cfg.railOffsetX, H - railS / 2, 0]} castShadow receiveShadow material={strutMat}>
          <boxGeometry args={[railS, railS, L - 0.5]} />
        </mesh>
        <mesh position={[-cfg.railOffsetX, H - railS / 2, 0]} castShadow receiveShadow material={strutMat}>
          <boxGeometry args={[railS, railS, L - 0.5]} />
        </mesh>

        {/* Cross members */}
        {Array.from({ length: crossCount + 1 }, (_, i) => {
          const z = -HALF_L + 0.5 + i * cfg.crossSpacing;
          return (
            <mesh
              key={`cross-${i}`}
              position={[0, H - railS / 2, z]}
              castShadow
              receiveShadow
              material={strutMat}
            >
              <boxGeometry args={[cfg.railOffsetX * 2, railS * 0.7, railS * 0.7]} />
            </mesh>
          );
        })}
      </group>

      {/* Cable tray */}
      <group name="cableTrays">
        {/* Tray bottom */}
        <mesh position={[tray.x, tray.y - tray.height, 0]} castShadow receiveShadow material={strutMat}>
          <boxGeometry args={[tray.width, tray.wallThickness, L - 1]} />
        </mesh>
        {/* Tray sides */}
        <mesh
          position={[tray.x - tray.width / 2, tray.y - tray.height / 2, 0]}
          castShadow
          receiveShadow
          material={strutMat}
        >
          <boxGeometry args={[tray.wallThickness, tray.height, L - 1]} />
        </mesh>
        <mesh
          position={[tray.x + tray.width / 2, tray.y - tray.height / 2, 0]}
          castShadow
          receiveShadow
          material={strutMat}
        >
          <boxGeometry args={[tray.wallThickness, tray.height, L - 1]} />
        </mesh>
      </group>

      {/* Clamps */}
      <group name="clamps">
        {clamps.map((pos, i) => (
          <mesh
            key={`clamp-${i}`}
            position={[pos.x, pos.y, pos.z]}
            castShadow
            receiveShadow
            material={strutMat}
          >
            <boxGeometry args={[tray.width + 0.02, 0.015, 0.03]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
