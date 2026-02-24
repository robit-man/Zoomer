"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { LAB, HALF_W, HALF_L, H } from "../config";
import { createPanelMaterial } from "./Materials";

export default function LightingRig() {
  const { scene, gl } = useThree();
  const cfg = LAB.lighting;

  // Set tone mapping on the renderer
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = cfg.exposure;
  }, [gl, cfg.exposure]);

  const panelMat = useMemo(() => createPanelMaterial(), []);

  return (
    <group name="fixtures">
      {/* Environment for reflections */}
      <Environment preset="studio" background={false} />

      {/* Ambient fill */}
      <ambientLight intensity={cfg.ambient} color={0xffffff} />

      {/* Overhead panel lights */}
      <group name="overheadPanels">
        {cfg.overhead.zPositions.map((z, i) => (
          <group key={`panel-${i}`} position={[0, cfg.overhead.y, z]}>
            {/* RectAreaLight pointing down */}
            <rectAreaLight
              width={cfg.overhead.width}
              height={cfg.overhead.height}
              intensity={cfg.overhead.intensity}
              color={cfg.overhead.color}
              rotation={[-Math.PI / 2, 0, 0]}
            />
            {/* Visible panel mesh */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.01, 0]}
              material={panelMat}
            >
              <planeGeometry args={[cfg.overhead.width, cfg.overhead.height]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Shadow-casting spotlights (aligned with 2 panels) */}
      <spotLight
        position={[0, cfg.overhead.y, cfg.overhead.zPositions[1]]}
        target-position={[0, 0, cfg.overhead.zPositions[1]]}
        intensity={cfg.shadowSpots.intensity}
        angle={cfg.shadowSpots.angle}
        penumbra={cfg.shadowSpots.penumbra}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <spotLight
        position={[0, cfg.overhead.y, cfg.overhead.zPositions[4]]}
        target-position={[0, 0, cfg.overhead.zPositions[4]]}
        intensity={cfg.shadowSpots.intensity}
        angle={cfg.shadowSpots.angle}
        penumbra={cfg.shadowSpots.penumbra}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />

      {/* Subtle floor-lift light */}
      {cfg.floorLift.enabled && (
        <rectAreaLight
          position={[0, 0.05, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          width={LAB.room.width * 0.8}
          height={LAB.room.length * 0.8}
          intensity={cfg.floorLift.intensity}
          color={0xffffff}
        />
      )}

      {/* Accent group placeholder */}
      <group name="accents" />
    </group>
  );
}
