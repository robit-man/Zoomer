"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { H, HALF_W, LAB } from "../config";

function buildAsteriskGrid(
  lineLength: number,
  xDistance: number,
  yDistance: number,
  zDistance: number,
  lineColor: THREE.ColorRepresentation,
  lineOpacity: number,
) {
  const totalGridPoints =
    (xDistance * 2 + 1) * (yDistance * 2 + 1) * (zDistance * 2 + 1);
  const verticesPerPoint = 6;
  const totalVertices = totalGridPoints * verticesPerPoint;
  const positions = new Float32Array(totalVertices * 3);
  const alphas = new Float32Array(totalVertices);

  const halfLength = lineLength * 0.5;
  let vertexIndex = 0;
  let alphaIndex = 0;

  for (let x = -xDistance; x <= xDistance; x += 1) {
    for (let y = -yDistance; y <= yDistance; y += 1) {
      for (let z = -zDistance; z <= zDistance; z += 1) {
        const normalizedDistance = Math.sqrt(
          (xDistance > 0 ? (x / xDistance) ** 2 : 0) +
            (yDistance > 0 ? (y / yDistance) ** 2 : 0) +
            (zDistance > 0 ? (z / zDistance) ** 2 : 0),
        ) / Math.sqrt(3);
        const distanceFade = Math.max(0, 1 - normalizedDistance ** 1.28);
        const alpha = distanceFade * (0.72 + (1 - Math.abs(y) / Math.max(1, yDistance)) * 0.28);

        positions[vertexIndex++] = x - halfLength;
        positions[vertexIndex++] = y;
        positions[vertexIndex++] = z;
        positions[vertexIndex++] = x + halfLength;
        positions[vertexIndex++] = y;
        positions[vertexIndex++] = z;

        positions[vertexIndex++] = x;
        positions[vertexIndex++] = y - halfLength;
        positions[vertexIndex++] = z;
        positions[vertexIndex++] = x;
        positions[vertexIndex++] = y + halfLength;
        positions[vertexIndex++] = z;

        positions[vertexIndex++] = x;
        positions[vertexIndex++] = y;
        positions[vertexIndex++] = z - halfLength;
        positions[vertexIndex++] = x;
        positions[vertexIndex++] = y;
        positions[vertexIndex++] = z + halfLength;

        for (let segment = 0; segment < 6; segment += 1) {
          alphas[alphaIndex++] = alpha;
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(lineColor) },
      uOpacity: { value: lineOpacity },
    },
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, vAlpha * uOpacity);
      }
    `,
  });
  material.toneMapped = false;

  return { geometry, material };
}

function createAtmosphereMaterial() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(LAB.backdrop.atmosphereColor) },
      uGlobalAlpha: { value: LAB.backdrop.atmosphereAlpha },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform float uGlobalAlpha;

      float hash(vec3 p) {
        vec3 q = vec3(
          dot(p, vec3(127.1, 311.7, 74.7)),
          dot(p, vec3(269.5, 183.3, 246.1)),
          dot(p, vec3(113.5, 271.9, 124.6))
        );
        return fract(sin(q.x + q.y + q.z) * 43758.5453123);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);

        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));

        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);

        float nxy0 = mix(nx00, nx10, u.y);
        float nxy1 = mix(nx01, nx11, u.y);

        return mix(nxy0, nxy1, u.z);
      }

      float fbm(vec3 p) {
        float f = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          f += amp * noise(p);
          p *= 2.1;
          amp *= 0.52;
        }
        return f;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float t = uTime * 0.05;
        float n = fbm(dir * 2.4 + vec3(t * 0.7, t * 0.5, t * 0.9));
        float swirl = fbm(dir * 3.6 + vec3(t * -0.4, t * 0.3, t * 0.2));
        float mist = clamp(n * 0.6 + swirl * 0.4, 0.0, 1.0);
        float alpha = smoothstep(0.15, 0.7, mist) * 0.22;
        vec3 color = uBaseColor * (1.05 + mist * 0.7);
        gl_FragColor = vec4(color, alpha * uGlobalAlpha);
      }
    `,
  });
  material.toneMapped = false;
  return material;
}

export default function AstralBackdrop() {
  const gridRef = useRef<THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial> | null>(null);
  const atmosphereRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null>(null);
  const cfg = LAB.backdrop;

  const xDistance = Math.max(2, Math.min(cfg.gridDistance, Math.floor(HALF_W) - 1));
  const yDistance = Math.max(1, Math.min(2, Math.floor(H / 2)));
  const zDistance = Math.max(3, cfg.gridDistance + 1);

  const { gridGeometry, gridMaterial } = useMemo(() => {
    const { geometry, material } = buildAsteriskGrid(
      cfg.lineLength,
      xDistance,
      yDistance,
      zDistance,
      cfg.lineColor,
      cfg.lineOpacity,
    );

    return {
      gridGeometry: geometry,
      gridMaterial: material,
    };
  }, [
    cfg.lineColor,
    cfg.lineLength,
    cfg.lineOpacity,
    xDistance,
    yDistance,
    zDistance,
  ]);

  const atmosphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 28, 28), []);
  const atmosphereMaterial = useMemo(() => createAtmosphereMaterial(), []);

  useEffect(
    () => () => {
      gridGeometry.dispose();
      gridMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
    },
    [atmosphereGeometry, atmosphereMaterial, gridGeometry, gridMaterial],
  );

  useFrame(({ camera, clock }) => {
    const snapX = Math.round(camera.position.x);
    const snapY = Math.round(camera.position.y);
    const snapZ = Math.round(camera.position.z);

    if (gridRef.current) {
      gridRef.current.position.set(snapX, snapY, snapZ);
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.position.copy(camera.position);
      atmosphereRef.current.scale.setScalar(cfg.atmosphereScale);
      const material = atmosphereRef.current.material;
      material.uniforms.uTime.value = clock.elapsedTime;
      (material.uniforms.uBaseColor.value as THREE.Color).set(cfg.atmosphereColor);
      material.uniforms.uGlobalAlpha.value = cfg.atmosphereAlpha;
    }
  });

  if (!cfg.enabled) {
    return null;
  }

  return (
    <group name="astralBackdrop">
      <lineSegments
        ref={gridRef}
        geometry={gridGeometry}
        material={gridMaterial}
        frustumCulled={false}
        renderOrder={-2}
      />
      <mesh
        ref={atmosphereRef}
        geometry={atmosphereGeometry}
        material={atmosphereMaterial}
        frustumCulled={false}
        renderOrder={-3}
      />
    </group>
  );
}
