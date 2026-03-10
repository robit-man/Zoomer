"use client";

import { useMemo } from "react";
import { LAB, HALF_W, HALF_L, H } from "../config";
import {
  createFloorMaterial,
  createWallMaterial,
  createCeilingMaterial,
  createTrimMaterial,
} from "./Materials";

export default function RoomGeometry() {
  const { floorMat, wallMat, ceilMat, trimMat } = useMemo(
    () => ({
      floorMat: createFloorMaterial(),
      wallMat: createWallMaterial(),
      ceilMat: createCeilingMaterial(),
      trimMat: createTrimMaterial(),
    }),
    []
  );

  const { W, L } = { W: LAB.room.width, L: LAB.room.length };
  const wt = LAB.wall.thickness;
  const ft = LAB.floor.thickness;
  const trimH = LAB.trim.height;
  const trimD = LAB.trim.depth;

  return (
    <group name="room">
      {/* Floor */}
      <mesh
        name="floor"
        position={[0, -ft / 2, 0]}
        receiveShadow
        material={floorMat}
      >
        <boxGeometry args={[W, ft, L]} />
      </mesh>

      {/* Ceiling */}
      <mesh
        name="ceiling"
        position={[0, H + ft / 2, 0]}
        receiveShadow
        material={ceilMat}
      >
        <boxGeometry args={[W, ft, L]} />
      </mesh>

      {/* Wall N (+Z) */}
      <mesh
        name="wall_N"
        position={[0, H / 2, HALF_L + wt / 2]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[W, H, wt]} />
      </mesh>

      {/* Wall S (-Z) */}
      <mesh
        name="wall_S"
        position={[0, H / 2, -HALF_L - wt / 2]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[W, H, wt]} />
      </mesh>

      {/* Wall E (+X) */}
      <mesh
        name="wall_E"
        position={[HALF_W + wt / 2, H / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[wt, H, L]} />
      </mesh>

      {/* Wall W (-X) */}
      <mesh
        name="wall_W"
        position={[-HALF_W - wt / 2, H / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <boxGeometry args={[wt, H, L]} />
      </mesh>

      {/* Trims (baseboards) */}
      <group name="trims">
        {/* East wall baseboard */}
        <mesh position={[HALF_W - trimD / 2, trimH / 2, 0]} receiveShadow material={trimMat}>
          <boxGeometry args={[trimD, trimH, L]} />
        </mesh>
        {/* West wall baseboard */}
        <mesh position={[-HALF_W + trimD / 2, trimH / 2, 0]} receiveShadow material={trimMat}>
          <boxGeometry args={[trimD, trimH, L]} />
        </mesh>
        {/* North wall baseboard */}
        <mesh position={[0, trimH / 2, HALF_L - trimD / 2]} receiveShadow material={trimMat}>
          <boxGeometry args={[W, trimH, trimD]} />
        </mesh>
        {/* South wall baseboard */}
        <mesh position={[0, trimH / 2, -HALF_L + trimD / 2]} receiveShadow material={trimMat}>
          <boxGeometry args={[W, trimH, trimD]} />
        </mesh>
      </group>
    </group>
  );
}
