"use client";

import { Canvas } from "@react-three/fiber";
import { FlockingField } from "@/components/background/FlockingField";

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        <FlockingField />
      </Canvas>
    </div>
  );
}
