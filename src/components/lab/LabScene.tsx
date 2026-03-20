"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import RoomGeometry from "./env/RoomGeometry";
import AstralBackdrop from "./env/AstralBackdrop";
import LightingRig from "./env/LightingRig";
import WallStrips from "./env/WallStrips";
import Structure from "./env/Structure";
import Furniture from "./env/Furniture";
import Cityscape from "./env/Cityscape";
import GlowPass from "./fx/GlowPass";
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
  const { camera, invalidate } = useThree();
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
      invalidate();
    };

    const handlePointerLeave = () => {
      pointerTarget.current.set(0, 0);
      invalidate();
    };

    window.addEventListener("pointermove", handlePointerMove);
    root.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
    };
  }, [invalidate]);

  useEffect(() => {
    if (!progress) {
      return;
    }

    const unsubscribe = progress.on("change", () => {
      invalidate();
    });

    return () => {
      unsubscribe();
    };
  }, [invalidate, progress]);

  useFrame((_, delta) => {
    const progressValue = THREE.MathUtils.clamp(progress?.get() ?? 0, 0, 1);
    const desiredPosition = desiredPositionRef.current;
    const desiredTarget = desiredTargetRef.current;
    const currentPointer = pointerCurrent.current;

    positionCurve.getPointAt(progressValue, desiredPosition);
    targetCurve.getPointAt(progressValue, desiredTarget);

    const pointerLerp = 1 - Math.exp(-delta * 5.4);
    currentPointer.lerp(pointerTarget.current, pointerLerp);

    const pointerShiftX = currentPointer.x * 0.12;
    const pointerShiftY = currentPointer.y * 0.05;

    desiredPosition.x += pointerShiftX;
    desiredPosition.y -= pointerShiftY;
    desiredTarget.x += pointerShiftX * 1.18;
    desiredTarget.y -= pointerShiftY * 0.55;

    const positionLerp = 1 - Math.exp(-delta * 6.4);
    const targetLerp = 1 - Math.exp(-delta * 7.1);
    camera.position.lerp(desiredPosition, positionLerp);
    lookTarget.current.lerp(desiredTarget, targetLerp);
    camera.lookAt(lookTarget.current);

    if (
      camera.position.distanceToSquared(desiredPosition) > 0.00001 ||
      lookTarget.current.distanceToSquared(desiredTarget) > 0.00001 ||
      currentPointer.distanceToSquared(pointerTarget.current) > 0.000001
    ) {
      invalidate();
    }
  });

  return null;
}

export default function LabScene({ debugSettings, progress }: LabSceneProps) {
  const showCables = debugSettings?.showCables ?? true;
  const showStrips = debugSettings?.showWallStrips ?? true;
  const bloomEnabled = debugSettings?.bloomEnabled ?? LAB.post.bloom.enabled;
  const bloomStrength = debugSettings?.bloomStrength ?? LAB.post.bloom.strength;

  return (
    <>
      <WalkthroughCamera progress={progress} />

      <group name="world">
        <AstralBackdrop />
        <Cityscape />
        <RoomGeometry />
        <LightingRig />
        {showStrips && <WallStrips />}
        <Structure />
        <Suspense fallback={null}>
          <Furniture />
        </Suspense>

        {showCables && (
          <Suspense fallback={null}>
            <CableLayer visible />
          </Suspense>
        )}

        <group name="probes" />
        <group name="debug" />
      </group>

      <GlowPass
        enabled={bloomEnabled}
        strength={bloomStrength}
        radius={LAB.post.bloom.radius}
        threshold={LAB.post.bloom.threshold}
        resolutionScale={LAB.post.bloom.resolutionScale}
      />
    </>
  );
}
