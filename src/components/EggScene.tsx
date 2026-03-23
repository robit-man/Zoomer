"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

function Egg() {
  const groupRef = useRef<THREE.Group>(null);

  const materials = useLoader(MTLLoader, "/models/egg/egg.mtl");
  const obj = useLoader(OBJLoader, "/models/egg/egg.obj", (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  const cloned = useMemo(() => {
    const clone = obj.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.2 / maxDim;
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    return clone;
  }, [obj]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = Math.sin(groupRef.current.rotation.y * 0.5) * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

export default function EggScene({ className }: { className?: string }) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 36 }}
        gl={{ antialias: true }}
        frameloop="always"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 3]} intensity={0.9} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <Egg />
      </Canvas>
    </div>
  );
}
