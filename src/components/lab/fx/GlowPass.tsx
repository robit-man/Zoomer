"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function GlowPass({
  enabled,
  radius,
  resolutionScale,
  strength,
  threshold,
}: {
  enabled: boolean;
  radius: number;
  resolutionScale: number;
  strength: number;
  threshold: number;
}) {
  const { camera, gl, scene, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new Vector2(1, 1),
      strength,
      radius,
      threshold,
    );

    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    composerRef.current = composer;
    renderPassRef.current = renderPass;
    bloomPassRef.current = bloomPass;

    return () => {
      renderPass.dispose?.();
      bloomPass.dispose?.();
      composer.renderTarget1.dispose();
      composer.renderTarget2.dispose();
      composerRef.current = null;
      renderPassRef.current = null;
      bloomPassRef.current = null;
    };
  }, [camera, gl, radius, scene, strength, threshold]);

  useEffect(() => {
    const composer = composerRef.current;
    const bloomPass = bloomPassRef.current;
    if (!composer || !bloomPass) {
      return;
    }

    const width = Math.max(1, Math.floor(size.width * resolutionScale));
    const height = Math.max(1, Math.floor(size.height * resolutionScale));
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
    bloomPass.strength = strength;
    bloomPass.radius = radius;
    bloomPass.threshold = threshold;
  }, [radius, resolutionScale, size.height, size.width, strength, threshold]);

  useFrame(() => {
    const composer = composerRef.current;

    if (enabled && composer) {
      composer.render();
      return;
    }

    gl.render(scene, camera);
  }, 1);

  return null;
}
