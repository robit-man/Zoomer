"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LAB } from "../config";
import { createPanelMaterial } from "./Materials";

export default function LightingRig() {
  const { scene, gl } = useThree();
  const cfg = LAB.lighting;
  const glRef = useRef(gl);
  const sceneRef = useRef(scene);

  // Keep the renderer and environment in a bright neutral state so the room
  // reads as white and the side accents carry the color.
  useEffect(() => {
    const renderer = glRef.current;
    const sceneObject = sceneRef.current;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = cfg.exposure;
    sceneObject.background = new THREE.Color(0xf1efe7);

    // Bright neutral environment keeps the room white while letting the neon
    // wall accents carry the saturated color in reflections.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xf1efe7);
    const envMap = pmrem.fromScene(envScene, 0).texture;
    sceneObject.environment = envMap;
    pmrem.dispose();

    return () => {
      envMap.dispose();
    };
  }, [cfg.exposure]);

  const panelMat = useMemo(() => createPanelMaterial(), []);

  return (
    <group name="fixtures">
      <group name="overheadPanels">
        {cfg.overhead.zPositions.map((z, i) => (
          <group key={`panel-${i}`} position={[0, cfg.overhead.y, z]}>
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

      <group name="accents" />
    </group>
  );
}
