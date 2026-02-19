"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { FlockingField } from "@/components/background/FlockingField";

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 50 }}
      >
        <color attach="background" args={["#0d0d0d"]} />
        <FlockingField />
        <EffectComposer>
          <Bloom
            intensity={0.9}
            mipmapBlur
            luminanceThreshold={0.15}
            luminanceSmoothing={0.18}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
