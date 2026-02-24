"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { PhysicsContextValue } from "./types";

export interface RopeConfig {
  anchorA: THREE.Vector3;
  anchorB: THREE.Vector3;
  segmentCount: number;
  slack: number;
  linearDamping: number;
  angularDamping: number;
  radius: number;
  collisionGroup?: number;
}

export interface RopeState {
  positions: THREE.Vector3[];
  bodyHandles: number[];
}

/**
 * Creates a physics rope (chain of capsule bodies connected by ball joints)
 * between two fixed anchor points, and returns updated positions each frame.
 */
export function createRope(
  rapier: any,
  world: any,
  config: RopeConfig
): RopeState {
  const { anchorA, anchorB, segmentCount, slack, linearDamping, angularDamping, radius } = config;

  const dir = new THREE.Vector3().subVectors(anchorB, anchorA);
  const directLen = dir.length();
  const ropeLen = directLen * slack;
  const segLen = ropeLen / segmentCount;

  const positions: THREE.Vector3[] = [];
  const bodyHandles: number[] = [];

  // Generate initial positions with sag
  for (let i = 0; i <= segmentCount; i++) {
    const t = i / segmentCount;
    const p = new THREE.Vector3().lerpVectors(anchorA, anchorB, t);
    // Add sag
    const sagAmount = directLen * 0.06;
    p.y -= Math.pow(Math.sin(Math.PI * t), 2) * sagAmount;
    positions.push(p);
  }

  // Create fixed anchor body at A
  const anchorADesc = rapier.RigidBodyDesc.fixed()
    .setTranslation(anchorA.x, anchorA.y, anchorA.z);
  const bodyA = world.createRigidBody(anchorADesc);

  // Create fixed anchor body at B
  const anchorBDesc = rapier.RigidBodyDesc.fixed()
    .setTranslation(anchorB.x, anchorB.y, anchorB.z);
  const bodyB = world.createRigidBody(anchorBDesc);

  const segBodies: any[] = [bodyA];

  // Create dynamic segment bodies
  for (let i = 1; i < segmentCount; i++) {
    const p = positions[i];
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(p.x, p.y, p.z)
      .setLinearDamping(linearDamping)
      .setAngularDamping(angularDamping)
      .setCanSleep(false);
    const body = world.createRigidBody(bodyDesc);

    // Capsule collider
    const colliderDesc = rapier.ColliderDesc.capsule(segLen / 2 * 0.8, radius)
      .setDensity(0.5)
      .setFriction(0.3)
      .setRestitution(0.0);

    // Cable collision group: group 2, interacts with group 1 (environment) but not group 2
    colliderDesc.setCollisionGroups(0x00020001); // member of group 2, interacts with group 1

    world.createCollider(colliderDesc, body);
    segBodies.push(body);
    bodyHandles.push(body.handle);
  }

  segBodies.push(bodyB);

  // Create ball joints between consecutive bodies
  for (let i = 0; i < segBodies.length - 1; i++) {
    const a = segBodies[i];
    const b = segBodies[i + 1];

    const jointDesc = rapier.JointData.spherical(
      { x: 0, y: -segLen / 2, z: 0 },
      { x: 0, y: segLen / 2, z: 0 }
    );

    // First joint: anchor offset from anchorA body
    if (i === 0) {
      jointDesc.anchor1 = { x: 0, y: 0, z: 0 };
      jointDesc.anchor2 = { x: 0, y: segLen / 2, z: 0 };
    }
    // Last joint: anchor offset from anchorB body
    if (i === segBodies.length - 2) {
      jointDesc.anchor1 = { x: 0, y: -segLen / 2, z: 0 };
      jointDesc.anchor2 = { x: 0, y: 0, z: 0 };
    }

    world.createImpulseJoint(jointDesc, a, b, true);
  }

  return { positions, bodyHandles };
}

/**
 * Updates rope positions from physics world.
 * Call this each frame after physics step.
 */
export function updateRopePositions(
  world: any,
  state: RopeState,
  anchorA: THREE.Vector3,
  anchorB: THREE.Vector3
): void {
  // First position is anchorA
  state.positions[0].copy(anchorA);

  // Dynamic body positions
  for (let i = 0; i < state.bodyHandles.length; i++) {
    const body = world.getRigidBody(state.bodyHandles[i]);
    if (body) {
      const t = body.translation();
      state.positions[i + 1].set(t.x, t.y, t.z);
    }
  }

  // Last position is anchorB
  state.positions[state.positions.length - 1].copy(anchorB);
}
