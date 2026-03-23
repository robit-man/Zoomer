"use client";

import { useMemo } from "react";
import { LAB, HALF_W, HALF_L, H } from "../config";
import {
  createFloorMaterial,
  createWallMaterial,
  createCeilingMaterial,
  createTrimMaterial,
  createGlassMaterial,
} from "./Materials";

export default function RoomGeometry() {
  const { floorMat, wallMat, ceilMat, trimMat, glassMat } = useMemo(
    () => ({
      floorMat: createFloorMaterial(),
      wallMat: createWallMaterial(),
      ceilMat: createCeilingMaterial(),
      trimMat: createTrimMaterial(),
      glassMat: createGlassMaterial(),
    }),
    []
  );

  const { W, L } = { W: LAB.room.width, L: LAB.room.length };
  const wt = LAB.wall.thickness;
  const ft = LAB.floor.thickness;
  const trimH = LAB.trim.height;
  const trimD = LAB.trim.depth;

  const win = LAB.backWindow;
  const winHalf = win.size / 2;
  const winBot = win.centerY - winHalf;
  const winTop = win.centerY + winHalf;
  const winLeft = -winHalf;
  const winRight = winHalf;
  const wallZ = HALF_L + wt / 2;

  const leftW = HALF_W + winLeft;
  const rightW = HALF_W - winRight;
  const topH = H - winTop;
  const botH = winBot;

  return (
    <group name="room">
      {/* Floor */}
      <mesh name="floor" position={[0, -ft / 2, 0]} receiveShadow material={floorMat}>
        <boxGeometry args={[W, ft, L]} />
      </mesh>

      {/* Ceiling */}
      <mesh name="ceiling" position={[0, H + ft / 2, 0]} receiveShadow material={ceilMat}>
        <boxGeometry args={[W, ft, L]} />
      </mesh>

      {/* Back wall (N) — 4 panels around window */}
      <group name="wall_N_panels">
        {/* Left panel */}
        <mesh
          name="wall_N_left"
          position={[(-HALF_W + leftW / 2), H / 2, wallZ]}
          receiveShadow
          material={wallMat}
        >
          <boxGeometry args={[leftW, H, wt]} />
        </mesh>

        {/* Right panel */}
        <mesh
          name="wall_N_right"
          position={[(HALF_W - rightW / 2), H / 2, wallZ]}
          receiveShadow
          material={wallMat}
        >
          <boxGeometry args={[rightW, H, wt]} />
        </mesh>

        {/* Top panel (above window) */}
        {topH > 0.01 && (
          <mesh
            name="wall_N_top"
            position={[0, winTop + topH / 2, wallZ]}
            receiveShadow
            material={wallMat}
          >
            <boxGeometry args={[win.size, topH, wt]} />
          </mesh>
        )}

        {/* Bottom panel (below window) */}
        {botH > 0.01 && (
          <mesh
            name="wall_N_bottom"
            position={[0, botH / 2, wallZ]}
            receiveShadow
            material={wallMat}
          >
            <boxGeometry args={[win.size, botH, wt]} />
          </mesh>
        )}
      </group>

      {/* Window glass */}
      <mesh
        name="window_glass"
        position={[0, win.centerY, wallZ]}
        material={glassMat}
      >
        <planeGeometry args={[win.size, win.size]} />
      </mesh>

      {/* Front wall (S) — 4 panels around window */}
      <group name="wall_S_panels">
        {/* Left panel */}
        <mesh
          name="wall_S_left"
          position={[(-HALF_W + leftW / 2), H / 2, -wallZ]}
          receiveShadow
          material={wallMat}
        >
          <boxGeometry args={[leftW, H, wt]} />
        </mesh>

        {/* Right panel */}
        <mesh
          name="wall_S_right"
          position={[(HALF_W - rightW / 2), H / 2, -wallZ]}
          receiveShadow
          material={wallMat}
        >
          <boxGeometry args={[rightW, H, wt]} />
        </mesh>

        {/* Top panel (above window) */}
        {topH > 0.01 && (
          <mesh
            name="wall_S_top"
            position={[0, winTop + topH / 2, -wallZ]}
            receiveShadow
            material={wallMat}
          >
            <boxGeometry args={[win.size, topH, wt]} />
          </mesh>
        )}

        {/* Bottom panel (below window) */}
        {botH > 0.01 && (
          <mesh
            name="wall_S_bottom"
            position={[0, botH / 2, -wallZ]}
            receiveShadow
            material={wallMat}
          >
            <boxGeometry args={[win.size, botH, wt]} />
          </mesh>
        )}
      </group>

      {/* South window glass */}
      <mesh
        name="window_glass_S"
        position={[0, win.centerY, -wallZ]}
        material={glassMat}
      >
        <planeGeometry args={[win.size, win.size]} />
      </mesh>

      {/* Wall E (+X) */}
      <mesh name="wall_E" position={[HALF_W + wt / 2, H / 2, 0]} receiveShadow material={wallMat}>
        <boxGeometry args={[wt, H, L]} />
      </mesh>

      {/* Wall W (-X) */}
      <mesh name="wall_W" position={[-HALF_W - wt / 2, H / 2, 0]} receiveShadow material={wallMat}>
        <boxGeometry args={[wt, H, L]} />
      </mesh>

      {/* Trims (baseboards) */}
      <group name="trims">
        <mesh position={[HALF_W - trimD / 2, trimH / 2, 0]} receiveShadow material={trimMat}>
          <boxGeometry args={[trimD, trimH, L]} />
        </mesh>
        <mesh position={[-HALF_W + trimD / 2, trimH / 2, 0]} receiveShadow material={trimMat}>
          <boxGeometry args={[trimD, trimH, L]} />
        </mesh>
        <mesh position={[0, trimH / 2, HALF_L - trimD / 2]} receiveShadow material={trimMat}>
          <boxGeometry args={[W, trimH, trimD]} />
        </mesh>
        <mesh position={[0, trimH / 2, -HALF_L + trimD / 2]} receiveShadow material={trimMat}>
          <boxGeometry args={[W, trimH, trimD]} />
        </mesh>
      </group>
    </group>
  );
}
