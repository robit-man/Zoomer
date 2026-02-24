"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LAB, HALF_W, HALF_L, H } from "../config";
import { createPanelMaterial } from "./Materials";

export default function LightingRig() {
  const { scene, gl } = useThree();
  const cfg = LAB.lighting;

  // Set tone mapping + dark background (no environment map flooding the scene)
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = cfg.exposure;
    scene.background = new THREE.Color(0x0a0a0a);

    // Very dim procedural env map for subtle reflections only
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const darkScene = new THREE.Scene();
    darkScene.background = new THREE.Color(0x080808);
    const envMap = pmrem.fromScene(darkScene, 0).texture;
    scene.environment = envMap;
    pmrem.dispose();

    return () => {
      envMap.dispose();
    };
  }, [gl, scene, cfg.exposure]);

  const panelMat = useMemo(() => createPanelMaterial(), []);

  return (
    <group name="fixtures">
      {/* Ambient fill */}
      <ambientLight intensity={cfg.ambient} color={0xffffff} />

      {/* Overhead panel lights */}
      <group name="overheadPanels">
        {cfg.overhead.zPositions.map((z, i) => (
          <group key={`panel-${i}`} position={[0, cfg.overhead.y, z]}>
            <rectAreaLight
              width={cfg.overhead.width}
              height={cfg.overhead.height}
              intensity={cfg.overhead.intensity}
              color={cfg.overhead.color}
              rotation={[-Math.PI / 2, 0, 0]}
            />
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

      {/* Shadow-casting spotlights */}
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

      <group name="accents" />
    </group>
  );
}
