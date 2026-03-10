"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { LAB, HALF_W } from "../config";
import {
  createDeskMaterial,
  createDeskLegMaterial,
  createRackMaterial,
  createShelfMaterial,
} from "./Materials";

function buildAssetMetrics(source: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(source);
  const center = bounds.getCenter(new THREE.Vector3());
  return {
    center,
    minY: bounds.min.y,
  };
}

function sanitizeMaterial(material: THREE.Material) {
  const next = material.clone();

  if ("envMapIntensity" in next) {
    next.envMapIntensity = 0;
  }

  if ("reflectivity" in next) {
    next.reflectivity = 0;
  }

  if ("shininess" in next) {
    next.shininess = 10;
  }

  if ("specular" in next && next.specular instanceof THREE.Color) {
    next.specular.setRGB(0.09, 0.1, 0.11);
  }

  next.needsUpdate = true;
  return next;
}

function buildAssetTemplates({
  source,
  center,
  minY,
}: {
  source: THREE.Object3D;
  center: THREE.Vector3;
  minY: number;
}) {
  source.updateMatrixWorld(true);
  const rootOffset = new THREE.Matrix4().makeTranslation(-center.x, -minY, -center.z);
  const templates: Array<{
    geometry: THREE.BufferGeometry;
    material: THREE.Material | THREE.Material[];
    matrix: THREE.Matrix4;
  }> = [];

  source.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const material = Array.isArray(child.material)
      ? child.material.map((entry) => sanitizeMaterial(entry))
      : sanitizeMaterial(child.material);

    templates.push({
      geometry: child.geometry,
      material,
      matrix: rootOffset.clone().multiply(child.matrixWorld.clone()),
    });
  });

  return templates;
}

type Placement = {
  position: [number, number, number];
  rotation: [number, number, number];
};

type InstancedMeshRef = THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null;

function randomRange(seed: number, min: number, max: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  const normalized = value - Math.floor(value);
  return min + normalized * (max - min);
}

function InstancedAssetCluster({
  source,
  center,
  minY,
  placements,
  scale,
}: {
  source: THREE.Object3D;
  center: THREE.Vector3;
  minY: number;
  placements: Placement[];
  scale: number;
}) {
  const refs = useRef<InstancedMeshRef[]>([]);
  const templates = useMemo(
    () => buildAssetTemplates({ source, center, minY }),
    [center, minY, source],
  );

  useLayoutEffect(() => {
    const rootPosition = new THREE.Vector3();
    const rootQuaternion = new THREE.Quaternion();
    const rootScale = new THREE.Vector3(scale, scale, scale);
    const rootMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    templates.forEach((template, templateIndex) => {
      const mesh = refs.current[templateIndex];
      if (!mesh) {
        return;
      }

      placements.forEach((placement, placementIndex) => {
        rootPosition.set(...placement.position);
        rootQuaternion.setFromEuler(
          new THREE.Euler(
            placement.rotation[0],
            placement.rotation[1],
            placement.rotation[2],
          ),
        );
        rootMatrix.compose(rootPosition, rootQuaternion, rootScale);
        finalMatrix.multiplyMatrices(rootMatrix, template.matrix);
        mesh.setMatrixAt(placementIndex, finalMatrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [placements, scale, templates]);

  useEffect(
    () => () => {
      templates.forEach((template) => {
        if (Array.isArray(template.material)) {
          template.material.forEach((material) => material.dispose());
        } else {
          template.material.dispose();
        }
      });
    },
    [templates],
  );

  return (
    <>
      {templates.map((template, index) => (
        <instancedMesh
          key={index}
          ref={(mesh) => {
            refs.current[index] = mesh;
          }}
          args={[template.geometry, template.material, placements.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}

function Desk({ position }: { position: [number, number, number] }) {
  const deskMat = useMemo(() => createDeskMaterial(), []);
  const legMat = useMemo(() => createDeskLegMaterial(), []);
  const d = LAB.furniture.desk;
  const legH = d.topHeight - d.topThickness;

  // Leg positions relative to desk center
  const legOffsets: [number, number][] = [
    [-d.topDepth / 2 + d.legSize, -d.topWidth / 2 + d.legSize],
    [d.topDepth / 2 - d.legSize, -d.topWidth / 2 + d.legSize],
    [-d.topDepth / 2 + d.legSize, d.topWidth / 2 - d.legSize],
    [d.topDepth / 2 - d.legSize, d.topWidth / 2 - d.legSize],
  ];

  return (
    <group position={position}>
      {/* Desktop surface */}
      <mesh
        position={[0, d.topHeight - d.topThickness / 2, 0]}
        castShadow
        receiveShadow
        material={deskMat}
      >
        <boxGeometry args={[d.topDepth, d.topThickness, d.topWidth]} />
      </mesh>

      {/* Front/back support beams */}
      <mesh
        position={[0, d.topHeight - d.topThickness - d.legSize / 2, -d.topWidth / 2 + d.legSize]}
        castShadow
        receiveShadow
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>
      <mesh
        position={[0, d.topHeight - d.topThickness - d.legSize / 2, d.topWidth / 2 - d.legSize]}
        castShadow
        receiveShadow
        material={legMat}
      >
        <boxGeometry args={[d.topDepth - d.legSize * 2, d.legSize, d.legSize]} />
      </mesh>

      {/* 4 Legs */}
      {legOffsets.map(([x, z], i) => (
        <mesh
          key={`leg-${i}`}
          position={[x, legH / 2, z]}
          castShadow
          receiveShadow
          material={legMat}
        >
          <boxGeometry args={[d.legSize, legH, d.legSize]} />
        </mesh>
      ))}
    </group>
  );
}

function WallRack({
  mirrored,
  position,
}: {
  mirrored: boolean;
  position: [number, number, number];
}) {
  const rackMat = useMemo(() => createRackMaterial(), []);
  const shelfMat = useMemo(() => createShelfMaterial(), []);
  const binMat = useMemo(() => createDeskMaterial(), []);
  const cfg = LAB.furniture.rack;
  const halfWidth = cfg.bayWidth / 2;
  const sideSign = mirrored ? 1 : -1;
  const innerDepthOffset = (cfg.depth - cfg.uprightThickness) / 2;
  const braceDepthOffset = cfg.depth / 2 - cfg.braceThickness / 2;
  const verticalY = cfg.height / 2;

  return (
    <group position={position}>
      <mesh position={[0, verticalY, -halfWidth]} castShadow receiveShadow material={rackMat}>
        <boxGeometry args={[cfg.uprightThickness, cfg.height, cfg.uprightThickness]} />
      </mesh>
      <mesh position={[0, verticalY, halfWidth]} castShadow receiveShadow material={rackMat}>
        <boxGeometry args={[cfg.uprightThickness, cfg.height, cfg.uprightThickness]} />
      </mesh>

      <mesh
        position={[sideSign * braceDepthOffset, cfg.height - cfg.uprightThickness / 2, 0]}
        castShadow
        receiveShadow
        material={rackMat}
      >
        <boxGeometry args={[cfg.braceThickness, cfg.uprightThickness, cfg.bayWidth]} />
      </mesh>
      <mesh
        position={[sideSign * braceDepthOffset, cfg.uprightThickness / 2, 0]}
        castShadow
        receiveShadow
        material={rackMat}
      >
        <boxGeometry args={[cfg.braceThickness, cfg.uprightThickness, cfg.bayWidth]} />
      </mesh>

      {cfg.shelfLevels.map((level, shelfIndex) => (
        <group key={`shelf-${shelfIndex}`}>
          <mesh position={[sideSign * innerDepthOffset, level, 0]} castShadow receiveShadow material={shelfMat}>
            <boxGeometry args={[cfg.depth, cfg.shelfThickness, cfg.bayWidth]} />
          </mesh>

          <mesh
            position={[
              sideSign * (innerDepthOffset * 0.72),
              level + cfg.shelfThickness * 0.95,
              -cfg.bayWidth * 0.18,
            ]}
            castShadow
            receiveShadow
            material={binMat}
          >
            <boxGeometry args={[cfg.depth * 0.42, cfg.shelfThickness * 3.2, cfg.bayWidth * 0.22]} />
          </mesh>
          <mesh
            position={[
              sideSign * (innerDepthOffset * 0.82),
              level + cfg.shelfThickness * 1.1,
              cfg.bayWidth * 0.16,
            ]}
            castShadow
            receiveShadow
            material={binMat}
          >
            <boxGeometry args={[cfg.depth * 0.34, cfg.shelfThickness * 2.8, cfg.bayWidth * 0.18]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Furniture() {
  const d = LAB.furniture.desk;
  const eastX = HALF_W - d.wallOffset - d.topDepth / 2;
  const westX = -HALF_W + d.wallOffset + d.topDepth / 2;
  const rack = LAB.furniture.rack;
  const eastRackX = HALF_W - rack.wallOffset - rack.uprightThickness / 2;
  const westRackX = -HALF_W + rack.wallOffset + rack.uprightThickness / 2;
  const headMaterials = useLoader(
    MTLLoader,
    "/models/robot-head/head-modified-final.mtl",
  );
  const neckMaterials = useLoader(
    MTLLoader,
    "/models/neck/head-full-stewart-dynamics.mtl",
  );
  const eggMaterials = useLoader(
    MTLLoader,
    "/models/egg/egg.mtl",
  );
  const headObj = useLoader(
    OBJLoader,
    "/models/robot-head/head-modified-final.obj",
    (loader) => {
      headMaterials.preload();
      loader.setMaterials(headMaterials);
    },
  );
  const neckObj = useLoader(
    OBJLoader,
    "/models/neck/head-full-stewart-dynamics.obj",
    (loader) => {
      neckMaterials.preload();
      loader.setMaterials(neckMaterials);
    },
  );
  const eggObj = useLoader(
    OBJLoader,
    "/models/egg/egg.obj",
    (loader) => {
      eggMaterials.preload();
      loader.setMaterials(eggMaterials);
    },
  );
  const headMetrics = useMemo(() => buildAssetMetrics(headObj), [headObj]);
  const neckMetrics = useMemo(() => buildAssetMetrics(neckObj), [neckObj]);
  const eggMetrics = useMemo(() => buildAssetMetrics(eggObj), [eggObj]);
  const deskTopY = d.topHeight + 0.008;
  const headScale = 0.00182;
  const neckScale = 0.00114;
  const eggScale = 0.00172;
  const [northDeskZ, centerDeskZ, southDeskZ] = LAB.furniture.deskZPositions;
  const headRandomSeed = useMemo(
    () => Math.abs(westX * 173.4 + centerDeskZ * 37.1 + deskTopY * 211.8),
    [centerDeskZ, deskTopY, westX],
  );

  const headPlacements: Placement[] = useMemo(() => {
    const basePositions: Array<[number, number, number]> = [
      [westX - 0.1, deskTopY, centerDeskZ - 0.42],
      [westX + 0.06, deskTopY, centerDeskZ - 0.08],
      [westX - 0.15, deskTopY, centerDeskZ + 0.24],
      [westX + 0.12, deskTopY, centerDeskZ + 0.52],
    ];

    return basePositions.map((position, index) => {
      const sideways = index === 1 || index === 3;
      return {
        position,
        rotation: sideways
          ? [
              randomRange(headRandomSeed + index * 2.1, Math.PI * 0.42, Math.PI * 0.62),
              randomRange(headRandomSeed + index * 3.4, -Math.PI, Math.PI),
              randomRange(headRandomSeed + index * 4.7, -0.92, 0.92),
            ]
          : [
              randomRange(headRandomSeed + index * 1.6, -0.18, 0.24),
              randomRange(headRandomSeed + index * 2.9, -Math.PI, Math.PI),
              randomRange(headRandomSeed + index * 4.1, -0.24, 0.24),
            ],
      };
    });
  }, [centerDeskZ, deskTopY, headRandomSeed, westX]);

  const neckPlacements: Placement[] = [
    {
      position: [eastX - 0.05, deskTopY, northDeskZ - 0.18] as [number, number, number],
      rotation: [0.02, -0.34, 0.01] as [number, number, number],
    },
    {
      position: [eastX + 0.08, deskTopY, southDeskZ + 0.18] as [number, number, number],
      rotation: [0.01, 0.44, -0.04] as [number, number, number],
    },
    {
      position: [westX + 0.04, deskTopY, southDeskZ - 0.1] as [number, number, number],
      rotation: [0.03, -0.66, 0.05] as [number, number, number],
    },
    {
      position: [eastX + 0.02, deskTopY, centerDeskZ + 0.34] as [number, number, number],
      rotation: [0, 0.82, -0.02] as [number, number, number],
    },
  ];

  const eggPlacements: Placement[] = [
    {
      position: [eastX + 0.09, deskTopY, northDeskZ + 0.42] as [number, number, number],
      rotation: [0.12, -0.3, 0.18] as [number, number, number],
    },
    {
      position: [westX - 0.02, deskTopY, centerDeskZ - 0.58] as [number, number, number],
      rotation: [-0.08, 0.54, -0.16] as [number, number, number],
    },
    {
      position: [eastX - 0.12, deskTopY, southDeskZ - 0.36] as [number, number, number],
      rotation: [0.06, -0.82, 0.14] as [number, number, number],
    },
  ];

  return (
    <group name="furniture">
      <group name="desks">
        {LAB.furniture.deskZPositions.map((z, i) => (
          <Desk key={`desk-e-${i}`} position={[eastX, 0, z]} />
        ))}
        {LAB.furniture.deskZPositions.map((z, i) => (
          <Desk key={`desk-w-${i}`} position={[westX, 0, z]} />
        ))}
      </group>
      <group name="wallRacks">
        {rack.zPositions.map((z, i) => (
          <WallRack key={`rack-e-${i}`} mirrored={false} position={[eastRackX, rack.bottomY, z]} />
        ))}
        {rack.zPositions.map((z, i) => (
          <WallRack key={`rack-w-${i}`} mirrored position={[westRackX, rack.bottomY, z]} />
        ))}
      </group>
      <group name="props">
        <InstancedAssetCluster
          source={headObj}
          center={headMetrics.center}
          minY={headMetrics.minY}
          placements={headPlacements}
          scale={headScale}
        />
        <InstancedAssetCluster
          source={neckObj}
          center={neckMetrics.center}
          minY={neckMetrics.minY}
          placements={neckPlacements}
          scale={neckScale}
        />
        <InstancedAssetCluster
          source={eggObj}
          center={eggMetrics.center}
          minY={eggMetrics.minY}
          placements={eggPlacements}
          scale={eggScale}
        />
      </group>
    </group>
  );
}
