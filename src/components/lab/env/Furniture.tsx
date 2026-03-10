"use client";

import { useMemo } from "react";
import { LAB, HALF_W } from "../config";
import {
  createDeskMaterial,
  createDeskLegMaterial,
  createRackMaterial,
  createShelfMaterial,
} from "./Materials";

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
        castShadow
        receiveShadow
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>
      <mesh
        position={[0, d.topHeight - d.topThickness - d.legSize / 2, d.topWidth / 2 - d.legSize]}
        castShadow
        receiveShadow
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>

      {/* 4 Legs */}
      {legOffsets.map(([x, z], i) => (
        <mesh
          key={`leg-${i}`}
          position={[x, legH / 2, z]}
          castShadow
          receiveShadow
          material={legMat}
        >
          <boxGeometry args={[d.legSize, legH, d.legSize]} />
        </mesh>
      ))}
    </group>
  );
}

function WallRack({
  mirrored,
  position,
}: {
  mirrored: boolean;
  position: [number, number, number];
}) {
  const rackMat = useMemo(() => createRackMaterial(), []);
  const shelfMat = useMemo(() => createShelfMaterial(), []);
  const binMat = useMemo(() => createDeskMaterial(), []);
  const cfg = LAB.furniture.rack;
  const halfWidth = cfg.bayWidth / 2;
  const sideSign = mirrored ? 1 : -1;
  const innerDepthOffset = (cfg.depth - cfg.uprightThickness) / 2;
  const braceDepthOffset = cfg.depth / 2 - cfg.braceThickness / 2;
  const verticalY = cfg.height / 2;

  return (
    <group position={position}>
      <mesh position={[0, verticalY, -halfWidth]} castShadow receiveShadow material={rackMat}>
        <boxGeometry args={[cfg.uprightThickness, cfg.height, cfg.uprightThickness]} />
      </mesh>
      <mesh position={[0, verticalY, halfWidth]} castShadow receiveShadow material={rackMat}>
        <boxGeometry args={[cfg.uprightThickness, cfg.height, cfg.uprightThickness]} />
      </mesh>

      <mesh
        position={[sideSign * braceDepthOffset, cfg.height - cfg.uprightThickness / 2, 0]}
        castShadow
        receiveShadow
        material={rackMat}
      >
        <boxGeometry args={[cfg.braceThickness, cfg.uprightThickness, cfg.bayWidth]} />
      </mesh>
      <mesh
        position={[sideSign * braceDepthOffset, cfg.uprightThickness / 2, 0]}
        castShadow
        receiveShadow
        material={rackMat}
      >
        <boxGeometry args={[cfg.braceThickness, cfg.uprightThickness, cfg.bayWidth]} />
      </mesh>

      {cfg.shelfLevels.map((level, shelfIndex) => (
        <group key={`shelf-${shelfIndex}`}>
          <mesh position={[sideSign * innerDepthOffset, level, 0]} castShadow receiveShadow material={shelfMat}>
            <boxGeometry args={[cfg.depth, cfg.shelfThickness, cfg.bayWidth]} />
          </mesh>

          <mesh
            position={[
              sideSign * (innerDepthOffset * 0.72),
              level + cfg.shelfThickness * 0.95,
              -cfg.bayWidth * 0.18,
            ]}
            castShadow
            receiveShadow
            material={binMat}
          >
            <boxGeometry args={[cfg.depth * 0.42, cfg.shelfThickness * 3.2, cfg.bayWidth * 0.22]} />
          </mesh>
          <mesh
            position={[
              sideSign * (innerDepthOffset * 0.82),
              level + cfg.shelfThickness * 1.1,
              cfg.bayWidth * 0.16,
            ]}
            castShadow
            receiveShadow
            material={binMat}
          >
            <boxGeometry args={[cfg.depth * 0.34, cfg.shelfThickness * 2.8, cfg.bayWidth * 0.18]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Furniture() {
  const d = LAB.furniture.desk;
  const eastX = HALF_W - d.wallOffset - d.topDepth / 2;
  const westX = -HALF_W + d.wallOffset + d.topDepth / 2;
  const rack = LAB.furniture.rack;
  const eastRackX = HALF_W - rack.wallOffset - rack.uprightThickness / 2;
  const westRackX = -HALF_W + rack.wallOffset + rack.uprightThickness / 2;

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
      <group name="wallRacks">
        {rack.zPositions.map((z, i) => (
          <WallRack key={`rack-e-${i}`} mirrored={false} position={[eastRackX, rack.bottomY, z]} />
        ))}
        {rack.zPositions.map((z, i) => (
          <WallRack key={`rack-w-${i}`} mirrored position={[westRackX, rack.bottomY, z]} />
        ))}
      </group>
      <group name="props" />
    </group>
  );
}
