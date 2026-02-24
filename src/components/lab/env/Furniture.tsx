"use client";

import { useMemo } from "react";
import { LAB, HALF_W } from "../config";
import { createDeskMaterial, createDeskLegMaterial } from "./Materials";

function Desk({ position }: { position: [number, number, number] }) {
  const deskMat = useMemo(() => createDeskMaterial(), []);
  const legMat = useMemo(() => createDeskLegMaterial(), []);
  const d = LAB.furniture.desk;
  const legH = d.topHeight - d.topThickness;

  // Leg positions relative to desk center
  const legOffsets: [number, number][] = [
    [-d.topDepth / 2 + d.legSize, -d.topWidth / 2 + d.legSize],
    [d.topDepth / 2 - d.legSize, -d.topWidth / 2 + d.legSize],
    [-d.topDepth / 2 + d.legSize, d.topWidth / 2 - d.legSize],
    [d.topDepth / 2 - d.legSize, d.topWidth / 2 - d.legSize],
  ];

  return (
    <group position={position}>
      {/* Desktop surface */}
      <mesh
        position={[0, d.topHeight - d.topThickness / 2, 0]}
        castShadow
        receiveShadow
        material={deskMat}
      >
        <boxGeometry args={[d.topDepth, d.topThickness, d.topWidth]} />
      </mesh>

      {/* Front/back support beams */}
      <mesh
        position={[0, d.topHeight - d.topThickness - d.legSize / 2, -d.topWidth / 2 + d.legSize]}
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>
      <mesh
        position={[0, d.topHeight - d.topThickness - d.legSize / 2, d.topWidth / 2 - d.legSize]}
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>

      {/* 4 Legs */}
      {legOffsets.map(([x, z], i) => (
        <mesh
          key={`leg-${i}`}
          position={[x, legH / 2, z]}
          material={legMat}
        >
          <boxGeometry args={[d.legSize, legH, d.legSize]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Furniture() {
  const d = LAB.furniture.desk;
  const eastX = HALF_W - d.wallOffset - d.topDepth / 2;
  const westX = -HALF_W + d.wallOffset + d.topDepth / 2;

  return (
    <group name="furniture">
      <group name="desks">
        {LAB.furniture.deskZPositions.map((z, i) => (
          <Desk key={`desk-e-${i}`} position={[eastX, 0, z]} />
        ))}
        {LAB.furniture.deskZPositions.map((z, i) => (
          <Desk key={`desk-w-${i}`} position={[westX, 0, z]} />
        ))}
      </group>
      <group name="props" />
    </group>
  );
}
