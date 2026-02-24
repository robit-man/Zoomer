"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { usePhysics } from "./PhysicsProvider";
import { createRope, updateRopePositions, type RopeState, type RopeConfig } from "./useRopeCable";
import { getClampPositions, getTapInfo } from "../env/Structure";
import { LAB, HALF_W, bundleRadius } from "../config";
import { createCableMaterial } from "../env/Materials";

interface RopeEdge {
  state: RopeState;
  anchorA: THREE.Vector3;
  anchorB: THREE.Vector3;
  radius: number;
  meshRef: THREE.Mesh | null;
}

export default function CableSystem({ visible = true }: { visible?: boolean }) {
  const { world, rapier } = usePhysics();
  const edgesRef = useRef<RopeEdge[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const cableMat = useMemo(() => createCableMaterial(), []);

  // Build rope edges on mount
  useEffect(() => {
    const clamps = getClampPositions();
    const taps = getTapInfo();
    const edges: RopeEdge[] = [];

    const trunkCfg = LAB.cables.trunk;
    const branchCfg = LAB.cables.branch;
    const trunkR = bundleRadius(trunkCfg.count);
    const branchR = bundleRadius(branchCfg.count);

    // --- Trunk edges: consecutive clamp pairs ---
    for (let i = 0; i < clamps.length - 1; i++) {
      const a = clamps[i];
      const b = clamps[i + 1];
      const dist = a.distanceTo(b);
      const segCount = Math.max(3, Math.round(dist / trunkCfg.segmentLength));

      const config: RopeConfig = {
        anchorA: a,
        anchorB: b,
        segmentCount: segCount,
        slack: trunkCfg.slack,
        linearDamping: trunkCfg.linearDamping,
        angularDamping: trunkCfg.angularDamping,
        radius: trunkR,
      };

      const state = createRope(rapier, world, config);
      edges.push({ state, anchorA: a, anchorB: b, radius: trunkR, meshRef: null });
    }

    // --- Branch edges ---
    for (const tap of taps) {
      const clampPos = clamps[tap.clampIndex].clone();
      const wallX = tap.side === "E"
        ? HALF_W - LAB.cables.wallEndpointXOffset
        : -HALF_W + LAB.cables.wallEndpointXOffset;
      const wallEndpoint = new THREE.Vector3(wallX, LAB.cables.wallEndpointY, tap.z);

      // Guide point: slightly off tray and down
      const guideX = tap.side === "E" ? clampPos.x + 0.4 : clampPos.x - 0.4;
      const guide1 = new THREE.Vector3(guideX, clampPos.y - 0.3, tap.z);

      // Two-segment branch: clamp -> guide -> wall
      const segments: [THREE.Vector3, THREE.Vector3][] = [
        [clampPos, guide1],
        [guide1, wallEndpoint],
      ];

      for (const [a, b] of segments) {
        const dist = a.distanceTo(b);
        const segCount = Math.max(3, Math.round(dist / branchCfg.segmentLength));

        const config: RopeConfig = {
          anchorA: a,
          anchorB: b,
          segmentCount: segCount,
          slack: branchCfg.slack,
          linearDamping: branchCfg.linearDamping,
          angularDamping: branchCfg.angularDamping,
          radius: branchR,
        };

        const state = createRope(rapier, world, config);
        edges.push({ state, anchorA: a, anchorB: b, radius: branchR, meshRef: null });
      }
    }

    edgesRef.current = edges;
  }, [world, rapier]);

  // Update tube geometries each frame
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    for (let i = 0; i < edgesRef.current.length; i++) {
      const edge = edgesRef.current[i];
      updateRopePositions(world, edge.state, edge.anchorA, edge.anchorB);

      // Get or create mesh
      let mesh = edge.meshRef;
      if (!mesh) {
        mesh = new THREE.Mesh(undefined, cableMat);
        mesh.castShadow = true;
        group.add(mesh);
        edge.meshRef = mesh;
      }

      // Build curve from positions
      if (edge.state.positions.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(
          edge.state.positions.map((p) => p.clone()),
          false,
          "catmullrom",
          0.3
        );

        // Dispose old geometry
        if (mesh.geometry) mesh.geometry.dispose();

        const tubularSegments = Math.max(4, edge.state.positions.length * 2);
        mesh.geometry = new THREE.TubeGeometry(curve, tubularSegments, edge.radius, 6, false);
      }
    }
  });

  return <group name="cables" ref={groupRef} visible={visible} />;
}
