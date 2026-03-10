"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LAB, HALF_W, HALF_L } from "../config";
import { createStripMaterial } from "./Materials";

type InstancedMeshRef = THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null;

function setStripIntensity(material: THREE.MeshBasicMaterial, intensity: number) {
  const baseColor = material.userData.baseColor as THREE.Color;
  material.color.copy(baseColor).multiplyScalar(intensity);
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.62, "rgba(255,255,255,0.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function setMatrices(mesh: InstancedMeshRef, matrices: THREE.Matrix4[]) {
  if (!mesh) {
    return;
  }

  matrices.forEach((matrix, index) => {
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function buildMatrix(
  position: [number, number, number],
  rotation: [number, number, number],
) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rotation[0], rotation[1], rotation[2]),
  );
  matrix.compose(
    new THREE.Vector3(position[0], position[1], position[2]),
    quaternion,
    new THREE.Vector3(1, 1, 1),
  );
  return matrix;
}

export default function WallStrips() {
  const cfg = LAB.wallStrips;
  const stripCount = cfg.countPerWall;
  const spacing = LAB.room.length / (stripCount + 1);
  const yCenter = cfg.marginFromFloor + cfg.height / 2;
  const pocketDepth = cfg.pocketDepth;
  const pocketWidth = cfg.pocketWidth;
  const slotInset = cfg.slotInset;
  const glowX = HALF_W - cfg.glowDepth;
  const floorGlowX = HALF_W - cfg.floorGlowDepth / 2;
  const recessRef = useRef<InstancedMeshRef>(null);
  const whiteStripRef = useRef<InstancedMeshRef>(null);
  const blueStripRef = useRef<InstancedMeshRef>(null);
  const pinkStripRef = useRef<InstancedMeshRef>(null);
  const whiteWallGlowRef = useRef<InstancedMeshRef>(null);
  const blueWallGlowRef = useRef<InstancedMeshRef>(null);
  const pinkWallGlowRef = useRef<InstancedMeshRef>(null);
  const whiteFloorGlowRef = useRef<InstancedMeshRef>(null);
  const blueFloorGlowRef = useRef<InstancedMeshRef>(null);
  const pinkFloorGlowRef = useRef<InstancedMeshRef>(null);

  const glowTexture = useMemo(() => createGlowTexture(), []);
  const recessMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(LAB.materials.wall.color).multiplyScalar(0.72),
        roughness: 0.88,
        metalness: 0,
      }),
    [],
  );
  const whiteStripMat = useMemo(() => createStripMaterial(0, cfg.color), [cfg.color]);
  const blueStripMat = useMemo(() => createStripMaterial(1, cfg.eastAccentColor), [cfg.eastAccentColor]);
  const pinkStripMat = useMemo(() => createStripMaterial(2, cfg.westAccentColor), [cfg.westAccentColor]);
  const whiteWallGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        map: glowTexture,
        transparent: true,
        opacity: cfg.glowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.color, cfg.glowOpacity, glowTexture],
  );
  const blueWallGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.eastAccentColor,
        map: glowTexture,
        transparent: true,
        opacity: cfg.glowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.eastAccentColor, cfg.glowOpacity, glowTexture],
  );
  const pinkWallGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.westAccentColor,
        map: glowTexture,
        transparent: true,
        opacity: cfg.glowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.glowOpacity, cfg.westAccentColor, glowTexture],
  );
  const whiteFloorGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.color,
        map: glowTexture,
        transparent: true,
        opacity: cfg.floorGlowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.color, cfg.floorGlowOpacity, glowTexture],
  );
  const blueFloorGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.eastAccentColor,
        map: glowTexture,
        transparent: true,
        opacity: cfg.floorGlowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.eastAccentColor, cfg.floorGlowOpacity, glowTexture],
  );
  const pinkFloorGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cfg.westAccentColor,
        map: glowTexture,
        transparent: true,
        opacity: cfg.floorGlowOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [cfg.floorGlowOpacity, cfg.westAccentColor, glowTexture],
  );

  const recessGeometry = useMemo(
    () => new THREE.BoxGeometry(pocketDepth, cfg.height + 0.18, pocketWidth),
    [cfg.height, pocketDepth, pocketWidth],
  );
  const stripGeometry = useMemo(
    () => new THREE.PlaneGeometry(cfg.width, cfg.height),
    [cfg.height, cfg.width],
  );
  const wallGlowGeometry = useMemo(
    () => new THREE.PlaneGeometry(cfg.glowWidth, cfg.glowHeight),
    [cfg.glowHeight, cfg.glowWidth],
  );
  const floorGlowGeometry = useMemo(
    () => new THREE.PlaneGeometry(cfg.floorGlowDepth, cfg.floorGlowWidth),
    [cfg.floorGlowDepth, cfg.floorGlowWidth],
  );
  const showFloorGlow = cfg.floorGlowOpacity > 0.001;

  const matrices = useMemo(() => {
    const recess: THREE.Matrix4[] = [];
    const whiteStrips: THREE.Matrix4[] = [];
    const blueStrips: THREE.Matrix4[] = [];
    const pinkStrips: THREE.Matrix4[] = [];
    const whiteWallGlows: THREE.Matrix4[] = [];
    const blueWallGlows: THREE.Matrix4[] = [];
    const pinkWallGlows: THREE.Matrix4[] = [];
    const whiteFloorGlows: THREE.Matrix4[] = [];
    const blueFloorGlows: THREE.Matrix4[] = [];
    const pinkFloorGlows: THREE.Matrix4[] = [];

    for (let i = 0; i < stripCount; i += 1) {
      const z = -HALF_L + spacing * (i + 1);
      const eastStripMatrix = buildMatrix([HALF_W - slotInset, yCenter, z], [0, -Math.PI / 2, 0]);
      const westStripMatrix = buildMatrix([-HALF_W + slotInset, yCenter, z], [0, Math.PI / 2, 0]);
      const eastWallGlowMatrix = buildMatrix([glowX, yCenter, z], [0, -Math.PI / 2, 0]);
      const westWallGlowMatrix = buildMatrix([-glowX, yCenter, z], [0, Math.PI / 2, 0]);
      const eastFloorGlowMatrix = buildMatrix([floorGlowX, 0.012, z], [-Math.PI / 2, 0, 0]);
      const westFloorGlowMatrix = buildMatrix([-floorGlowX, 0.012, z], [-Math.PI / 2, 0, 0]);

      recess.push(buildMatrix([HALF_W - pocketDepth / 2, yCenter, z], [0, 0, 0]));
      recess.push(buildMatrix([-HALF_W + pocketDepth / 2, yCenter, z], [0, 0, 0]));

      if (i === cfg.eastAccentIndex) {
        blueStrips.push(eastStripMatrix);
        blueWallGlows.push(eastWallGlowMatrix);
        blueFloorGlows.push(eastFloorGlowMatrix);
      } else {
        whiteStrips.push(eastStripMatrix);
        whiteWallGlows.push(eastWallGlowMatrix);
        whiteFloorGlows.push(eastFloorGlowMatrix);
      }

      if (i === cfg.westAccentIndex) {
        pinkStrips.push(westStripMatrix);
        pinkWallGlows.push(westWallGlowMatrix);
        pinkFloorGlows.push(westFloorGlowMatrix);
      } else {
        whiteStrips.push(westStripMatrix);
        whiteWallGlows.push(westWallGlowMatrix);
        whiteFloorGlows.push(westFloorGlowMatrix);
      }
    }

    return {
      recess,
      whiteStrips,
      blueStrips,
      pinkStrips,
      whiteWallGlows,
      blueWallGlows,
      pinkWallGlows,
      whiteFloorGlows,
      blueFloorGlows,
      pinkFloorGlows,
    };
  }, [
    cfg.eastAccentIndex,
    cfg.westAccentIndex,
    floorGlowX,
    glowX,
    pocketDepth,
    spacing,
    slotInset,
    stripCount,
    yCenter,
  ]);

  useEffect(() => {
    setStripIntensity(whiteStripMat, cfg.emissiveBase);
    setStripIntensity(blueStripMat, cfg.emissiveBase);
    setStripIntensity(pinkStripMat, cfg.emissiveBase);
  }, [blueStripMat, cfg.emissiveBase, pinkStripMat, whiteStripMat]);

  useLayoutEffect(() => {
    setMatrices(recessRef.current, matrices.recess);
    setMatrices(whiteStripRef.current, matrices.whiteStrips);
    setMatrices(blueStripRef.current, matrices.blueStrips);
    setMatrices(pinkStripRef.current, matrices.pinkStrips);
    setMatrices(whiteWallGlowRef.current, matrices.whiteWallGlows);
    setMatrices(blueWallGlowRef.current, matrices.blueWallGlows);
    setMatrices(pinkWallGlowRef.current, matrices.pinkWallGlows);
    setMatrices(whiteFloorGlowRef.current, matrices.whiteFloorGlows);
    setMatrices(blueFloorGlowRef.current, matrices.blueFloorGlows);
    setMatrices(pinkFloorGlowRef.current, matrices.pinkFloorGlows);
  }, [matrices]);

  useEffect(
    () => () => {
      glowTexture?.dispose();
      recessMat.dispose();
      whiteStripMat.dispose();
      blueStripMat.dispose();
      pinkStripMat.dispose();
      whiteWallGlowMat.dispose();
      blueWallGlowMat.dispose();
      pinkWallGlowMat.dispose();
      whiteFloorGlowMat.dispose();
      blueFloorGlowMat.dispose();
      pinkFloorGlowMat.dispose();
      recessGeometry.dispose();
      stripGeometry.dispose();
      wallGlowGeometry.dispose();
      floorGlowGeometry.dispose();
    },
    [
      blueFloorGlowMat,
      blueStripMat,
      blueWallGlowMat,
      floorGlowGeometry,
      glowTexture,
      pinkFloorGlowMat,
      pinkStripMat,
      pinkWallGlowMat,
      recessGeometry,
      recessMat,
      stripGeometry,
      wallGlowGeometry,
      whiteFloorGlowMat,
      whiteStripMat,
      whiteWallGlowMat,
    ],
  );

  return (
    <group name="wallStrips">
      <instancedMesh
        ref={recessRef}
        args={[recessGeometry, recessMat, matrices.recess.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={whiteStripRef}
        args={[stripGeometry, whiteStripMat, matrices.whiteStrips.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={blueStripRef}
        args={[stripGeometry, blueStripMat, matrices.blueStrips.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pinkStripRef}
        args={[stripGeometry, pinkStripMat, matrices.pinkStrips.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={whiteWallGlowRef}
        args={[wallGlowGeometry, whiteWallGlowMat, matrices.whiteWallGlows.length]}
        frustumCulled={false}
        renderOrder={2}
      />
      <instancedMesh
        ref={blueWallGlowRef}
        args={[wallGlowGeometry, blueWallGlowMat, matrices.blueWallGlows.length]}
        frustumCulled={false}
        renderOrder={2}
      />
      <instancedMesh
        ref={pinkWallGlowRef}
        args={[wallGlowGeometry, pinkWallGlowMat, matrices.pinkWallGlows.length]}
        frustumCulled={false}
        renderOrder={2}
      />
      {showFloorGlow && (
        <>
          <instancedMesh
            ref={whiteFloorGlowRef}
            args={[floorGlowGeometry, whiteFloorGlowMat, matrices.whiteFloorGlows.length]}
            frustumCulled={false}
            renderOrder={1}
          />
          <instancedMesh
            ref={blueFloorGlowRef}
            args={[floorGlowGeometry, blueFloorGlowMat, matrices.blueFloorGlows.length]}
            frustumCulled={false}
            renderOrder={1}
          />
          <instancedMesh
            ref={pinkFloorGlowRef}
            args={[floorGlowGeometry, pinkFloorGlowMat, matrices.pinkFloorGlows.length]}
            frustumCulled={false}
            renderOrder={1}
          />
        </>
      )}
    </group>
  );
}
