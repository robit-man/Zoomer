"use client";

import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
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

const NEIGHBOR_RADIUS = 0.78;
const SEPARATION_RADIUS = 0.25;
const MAX_SPEED = 0.09;
const SAMPLED_NEIGHBORS = 34;
const GLOBAL_DRAG = 0.991;
const SAMPLE_REFRESH_FRAMES = 8;

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

function createDustTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return undefined;
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.24, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

class FlockingSimulation {
  readonly count: number;
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.PointsMaterial;
  private readonly dustTexture?: THREE.Texture;
  private readonly boids: Boid[];
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly toWorld = new THREE.Vector3();
  private readonly diff = new THREE.Vector3();
  private readonly magPull = new THREE.Vector3();
  private readonly align = new THREE.Vector3();
  private readonly cohesion = new THREE.Vector3();
  private readonly separation = new THREE.Vector3();
  private readonly mouseWorld = new THREE.Vector3();
  private readonly mouseWorldSmoothed = new THREE.Vector3();
  private readonly magnets: Array<{ point: THREE.Vector3; strength: number }> =
    [];
  private readonly neighborRSq = NEIGHBOR_RADIUS * NEIGHBOR_RADIUS;
  private readonly sepRSq = SEPARATION_RADIUS * SEPARATION_RADIUS;
  private readonly bounds = { x: 6.3, y: 4.1, z: 3.3 };
  private frame = 0;

  constructor(count: number) {
    this.count = count;
    this.boids = this.createBoids();
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.geometry = new THREE.BufferGeometry();
    this.dustTexture = createDustTexture();
    this.material = new THREE.PointsMaterial({
      size: 0.0008,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.dustTexture,
      alphaMap: this.dustTexture,
      sizeAttenuation: true,
    });
    this.material.alphaTest = 0.01;

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
    this.dustTexture?.dispose();
  }

  step(
    dt: number,
    magnetItems: MagnetItem[],
    camera: THREE.Camera,
    size: ViewportSize,
    mouseNdc: THREE.Vector2 | null,
  ) {
    this.frame += 1;
    const sampleFrame = Math.floor(this.frame / SAMPLE_REFRESH_FRAMES);
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

    if (mouseNdc) {
      this.mouseWorld.set(mouseNdc.x, mouseNdc.y, 0.25).unproject(camera);
      this.mouseWorldSmoothed.lerp(this.mouseWorld, 0.12);
      this.magnets.push({ point: this.mouseWorldSmoothed, strength: 1.8 });
    }

    for (let i = 0; i < this.count; i += 1) {
      const boid = this.boids[i];
      this.align.set(0, 0, 0);
      this.cohesion.set(0, 0, 0);
      this.separation.set(0, 0, 0);
      let neighbors = 0;

      for (let sample = 0; sample < SAMPLED_NEIGHBORS; sample += 1) {
        const j =
          (i + sample * 97 + sampleFrame * 13 + (i % 17) * 11) % this.count;
        if (j === i) {
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
          .multiplyScalar(0.032);
        this.cohesion
          .multiplyScalar(1 / neighbors)
          .sub(boid.p)
          .multiplyScalar(0.016);
        this.separation.multiplyScalar(0.045);
      }

      this.magPull.set(0, 0, 0);
      let nearMag = 0;

      for (const magnet of this.magnets) {
        this.diff.subVectors(magnet.point, boid.p);
        const distSq = Math.max(this.diff.lengthSq(), 0.0001);
        const influence = 1 / (0.14 + distSq);
        this.magPull.addScaledVector(
          this.diff,
          influence * 0.06 * magnet.strength,
        );

        const dist = Math.sqrt(distSq);
        if (dist < 0.72) {
          nearMag += 0.72 - dist;
        }
      }

      boid.v
        .add(this.align)
        .add(this.cohesion)
        .add(this.separation)
        .add(this.magPull);
      boid.v.multiplyScalar(GLOBAL_DRAG);
      clampVectorLength(boid.v, MAX_SPEED);

      if (nearMag > 0) {
        boid.v.multiplyScalar(1 - Math.min(nearMag * 0.04, 0.16));
      }

      boid.p.addScaledVector(boid.v, dt);

      if (Math.abs(boid.p.x) > this.bounds.x) {
        boid.v.x *= -1;
      }
      if (Math.abs(boid.p.y) > this.bounds.y) {
        boid.v.y *= -1;
      }
      if (Math.abs(boid.p.z) > this.bounds.z) {
        boid.v.z *= -1;
      }

      const pos = i * 3;
      this.positions[pos] = boid.p.x;
      this.positions[pos + 1] = boid.p.y;
      this.positions[pos + 2] = boid.p.z;

      const brightness = 0.2 + Math.min(nearMag * 0.35, 0.38);
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
          seededUnit(index, 1) * this.bounds.x,
          seededUnit(index, 2) * this.bounds.y,
          seededUnit(index, 3) * this.bounds.z,
        ),
        v: new THREE.Vector3(
          seededUnit(index, 4) * 0.03,
          seededUnit(index, 5) * 0.03,
          seededUnit(index, 6) * 0.02,
        ),
      });
    }
    return generated;
  }
}

export function FlockingField() {
  const { camera, size } = useThree();
  const { getItems } = useMagnetTargets();
  const [simulation] = useState(() => new FlockingSimulation(2400));
  const mouseNdcRef = useRef<THREE.Vector2 | null>(null);

  useEffect(() => () => simulation.dispose(), [simulation]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      mouseNdcRef.current = new THREE.Vector2(x, y);
    };

    const onMouseLeave = () => {
      mouseNdcRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseout", onMouseLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  useFrame((_, delta) => {
    simulation.step(
      Math.min(delta, 0.018),
      getItems(),
      camera,
      size,
      mouseNdcRef.current,
    );
  });

  return <points geometry={simulation.geometry} material={simulation.material} />;
}
