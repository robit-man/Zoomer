"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import RoomGeometry from "./env/RoomGeometry";
import LightingRig from "./env/LightingRig";
import WallStrips from "./env/WallStrips";
import Structure from "./env/Structure";
import Furniture from "./env/Furniture";
import PhysicsProvider from "./physics/PhysicsProvider";
import CableSystem from "./physics/CableSystem";
import { LAB } from "./config";
import type { DebugSettings } from "./util/DebugUI";

interface LabSceneProps {
  debugSettings?: DebugSettings;
  progress?: MotionValue<number>;
}

function CableLayer({ visible }: { visible: boolean }) {
  return (
    <PhysicsProvider>
      <CableSystem visible={visible} />
    </PhysicsProvider>
  );
}

function WalkthroughCamera({
  progress,
}: {
  progress?: MotionValue<number>;
}) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 1.56, 7.4));
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerCurrent = useRef(new THREE.Vector2(0, 0));

  const positionCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0.2, 1.68, 11.2),
          new THREE.Vector3(0.5, 1.7, 8.2),
          new THREE.Vector3(1.6, 1.72, 4.6),
          new THREE.Vector3(2.65, 1.72, 0.8),
          new THREE.Vector3(2.15, 1.7, -3.1),
          new THREE.Vector3(0.7, 1.68, -6.9),
          new THREE.Vector3(-1.25, 1.67, -9.8),
        ],
        false,
        "catmullrom",
        0.38,
      ),
    [],
  );

  const targetCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 1.55, 6.8),
          new THREE.Vector3(0.65, 1.55, 4.4),
          new THREE.Vector3(2.6, 1.5, 0.6),
          new THREE.Vector3(3.25, 1.45, -2.8),
          new THREE.Vector3(1.2, 1.42, -6.6),
          new THREE.Vector3(-1.4, 1.4, -8.6),
          new THREE.Vector3(-2.7, 1.42, -7.2),
        ],
        false,
        "catmullrom",
        0.38,
      ),
    [],
  );

  const desiredPositionRef = useRef(new THREE.Vector3());
  const desiredTargetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const root = document.documentElement;

    const handlePointerMove = (event: PointerEvent) => {
      const normalizedX = (event.clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (event.clientY / window.innerHeight - 0.5) * 2;
      pointerTarget.current.set(normalizedX, normalizedY);
    };

    const handlePointerLeave = () => {
      pointerTarget.current.set(0, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const progressValue = THREE.MathUtils.clamp(progress?.get() ?? 0, 0, 1);
    const desiredPosition = desiredPositionRef.current;
    const desiredTarget = desiredTargetRef.current;
    const currentPointer = pointerCurrent.current;

    positionCurve.getPointAt(progressValue, desiredPosition);
    targetCurve.getPointAt(progressValue, desiredTarget);

    // Small stride/breath motion keeps the camera from feeling like a rail dolly.
    const stride = Math.sin(clock.elapsedTime * 1.35 + progressValue * Math.PI * 5.5) * 0.028;
    const sway = Math.cos(clock.elapsedTime * 0.82 + progressValue * Math.PI * 2.8) * 0.045;
    const pointerLerp = 1 - Math.exp(-delta * 3.2);
    currentPointer.lerp(pointerTarget.current, pointerLerp);

    const pointerShiftX = currentPointer.x * 0.18;
    const pointerShiftY = currentPointer.y * 0.08;

    desiredPosition.y += stride;
    desiredPosition.x += sway + pointerShiftX;
    desiredPosition.y -= pointerShiftY;
    desiredTarget.x += sway * 0.36 + pointerShiftX * 1.45;
    desiredTarget.y += stride * 0.2 - pointerShiftY * 0.65;

    const positionLerp = 1 - Math.exp(-delta * 2.8);
    const targetLerp = 1 - Math.exp(-delta * 3.6);
    camera.position.lerp(desiredPosition, positionLerp);
    lookTarget.current.lerp(desiredTarget, targetLerp);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

export default function LabScene({ debugSettings, progress }: LabSceneProps) {
  const showCables = debugSettings?.showCables ?? true;
  const showStrips = debugSettings?.showWallStrips ?? true;
  const bloomEnabled = debugSettings?.bloomEnabled ?? LAB.post.bloom.enabled;
  const bloomStrength = debugSettings?.bloomStrength ?? LAB.post.bloom.intensity;

  return (
    <>
      <WalkthroughCamera progress={progress} />

      <group name="world">
        <RoomGeometry />
        <LightingRig />
        {showStrips && <WallStrips />}
        <Structure />
        <Suspense fallback={null}>
          <Furniture />
        </Suspense>

        <Suspense fallback={null}>
          <CableLayer visible={showCables} />
        </Suspense>

        <group name="probes" />
        <group name="debug" />
      </group>

      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={bloomStrength}
            luminanceThreshold={LAB.post.bloom.luminanceThreshold}
            luminanceSmoothing={LAB.post.bloom.luminanceSmoothing}
          />
        </EffectComposer>
      )}
    </>
  );
}
