"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import {
  useMagnetTargets,
  type MagnetItem,
} from "@/components/background/MagnetTargets";

type Boid = {
  p: THREE.Vector3;
  v: THREE.Vector3;
};

type ViewportSize = {
  width: number;
  height: number;
};

const BOUNDS = { x: 4.3, y: 2.7, z: 0.9 };

function clampVectorLength(vec: THREE.Vector3, max: number) {
  const len = vec.length();
  if (len > max && len > 0) {
    vec.multiplyScalar(max / len);
  }
}

function seededUnit(index: number, salt: number) {
  let value = (index + 1) * 73856093 ^ (salt + 1) * 19349663;
  value = (value << 13) ^ value;
  return (
    1 -
    ((value * (value * value * 15731 + 789221) + 1376312589) & 0x7fffffff) /
      1073741824
  );
}

class FlockingSimulation {
  readonly count: number;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.PointsMaterial;
  private readonly boids: Boid[];
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly toWorld = new THREE.Vector3();
  private readonly diff = new THREE.Vector3();
  private readonly magPull = new THREE.Vector3();
  private readonly align = new THREE.Vector3();
  private readonly cohesion = new THREE.Vector3();
  private readonly separation = new THREE.Vector3();
  private readonly magnets: Array<{ point: THREE.Vector3; strength: number }> =
    [];
  private readonly neighborRSq = 0.62 * 0.62;
  private readonly sepRSq = 0.24 * 0.24;

  constructor(count: number) {
    this.count = count;
    this.boids = this.createBoids();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.03,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colors, 3),
    );
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  step(
    dt: number,
    magnetItems: MagnetItem[],
    camera: THREE.Camera,
    size: ViewportSize,
  ) {
    this.magnets.length = 0;
    for (const item of magnetItems) {
      const rect = item.el.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const ndcX = (cx / size.width) * 2 - 1;
      const ndcY = -((cy / size.height) * 2 - 1);
      this.toWorld.set(ndcX, ndcY, 0.2).unproject(camera);
      this.magnets.push({ point: this.toWorld.clone(), strength: item.strength });
    }

    for (let i = 0; i < this.count; i += 1) {
      const boid = this.boids[i];
      this.align.set(0, 0, 0);
      this.cohesion.set(0, 0, 0);
      this.separation.set(0, 0, 0);
      let neighbors = 0;

      for (let j = 0; j < this.count; j += 1) {
        if (i === j) {
          continue;
        }
        const other = this.boids[j];
        const dx = other.p.x - boid.p.x;
        const dy = other.p.y - boid.p.y;
        const dz = other.p.z - boid.p.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < this.neighborRSq) {
          this.align.add(other.v);
          this.cohesion.add(other.p);
          neighbors += 1;

          if (distSq < this.sepRSq) {
            const dist = Math.sqrt(Math.max(distSq, 0.0001));
            this.separation.add(
              this.diff.set(-dx / dist, -dy / dist, -dz / dist).multiplyScalar(
                1 / dist,
              ),
            );
          }
        }
      }

      if (neighbors > 0) {
        this.align
          .multiplyScalar(1 / neighbors)
          .sub(boid.v)
          .multiplyScalar(0.16);
        this.cohesion
          .multiplyScalar(1 / neighbors)
          .sub(boid.p)
          .multiplyScalar(0.05);
        this.separation.multiplyScalar(0.11);
      }

      this.magPull.set(0, 0, 0);
      let nearMag = 0;

      for (const magnet of this.magnets) {
        this.diff.subVectors(magnet.point, boid.p);
        const distSq = Math.max(this.diff.lengthSq(), 0.0001);
        const influence = 1 / (0.22 + distSq);
        this.magPull.addScaledVector(this.diff, influence * 0.2 * magnet.strength);
        const dist = Math.sqrt(distSq);
        if (dist < 0.65) {
          nearMag += 0.65 - dist;
        }
      }

      boid.v
        .add(this.align)
        .add(this.cohesion)
        .add(this.separation)
        .add(this.magPull);
      clampVectorLength(boid.v, 0.9);

      if (nearMag > 0) {
        boid.v.multiplyScalar(1 - Math.min(nearMag * 0.08, 0.35));
      }

      boid.p.addScaledVector(boid.v, dt);

      if (Math.abs(boid.p.x) > BOUNDS.x) {
        boid.v.x *= -1;
      }
      if (Math.abs(boid.p.y) > BOUNDS.y) {
        boid.v.y *= -1;
      }
      if (Math.abs(boid.p.z) > BOUNDS.z) {
        boid.v.z *= -1;
      }

      const pos = i * 3;
      this.positions[pos] = boid.p.x;
      this.positions[pos + 1] = boid.p.y;
      this.positions[pos + 2] = boid.p.z;

      const brightness = 0.62 + Math.min(nearMag * 0.82, 0.38);
      this.colors[pos] = brightness;
      this.colors[pos + 1] = brightness;
      this.colors[pos + 2] = brightness;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  private createBoids() {
    const generated: Boid[] = [];
    for (let index = 0; index < this.count; index += 1) {
      generated.push({
        p: new THREE.Vector3(
          seededUnit(index, 1) * 4,
          seededUnit(index, 2) * 2.5,
          seededUnit(index, 3) * 0.6,
        ),
        v: new THREE.Vector3(
          seededUnit(index, 4) * 0.1,
          seededUnit(index, 5) * 0.1,
          0,
        ),
      });
    }
    return generated;
  }
}

export function FlockingField() {
  const { camera, size } = useThree();
  const { getItems } = useMagnetTargets();
  const [simulation] = useState(() => new FlockingSimulation(720));

  useEffect(() => () => simulation.dispose(), [simulation]);

  useFrame((_, delta) => {
    simulation.step(Math.min(delta, 0.033), getItems(), camera, size);
  });

  return <points geometry={simulation.geometry} material={simulation.material} />;
}
