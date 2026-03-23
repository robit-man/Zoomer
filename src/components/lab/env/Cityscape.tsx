"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALF_L, H, LAB } from "../config";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

// Hash functions for procedural noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453123);
}

// Value noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM for clouds
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Building height at grid position
float buildingHeight(vec2 cell) {
  float h = hash(cell);
  // Cluster taller buildings toward center
  float cx = abs(cell.x - 0.0) / 20.0;
  float boost = smoothstep(1.0, 0.0, cx) * 0.4;
  return 0.08 + h * 0.52 + boost;
}

// Draw buildings for a layer at given depth
float buildings(vec2 uv, float depth, float scale) {
  float x = uv.x * scale;
  float cellX = floor(x);
  float localX = fract(x);

  float h = buildingHeight(vec2(cellX, depth));
  float w = 0.6 + hash(vec2(cellX + 100.0, depth)) * 0.35;
  float margin = (1.0 - w) * 0.5;

  float building = step(margin, localX) * step(localX, 1.0 - margin) * step(uv.y, h);
  return building;
}

// Window lights on buildings
float windowLights(vec2 uv, float depth, float scale) {
  float x = uv.x * scale;
  float cellX = floor(x);
  float localX = fract(x);

  float h = buildingHeight(vec2(cellX, depth));
  float w = 0.6 + hash(vec2(cellX + 100.0, depth)) * 0.35;
  float margin = (1.0 - w) * 0.5;

  if (localX < margin || localX > 1.0 - margin || uv.y > h) return 0.0;

  // Window grid within building
  float winX = fract((localX - margin) / (1.0 - 2.0 * margin) * 6.0);
  float winY = fract(uv.y / h * 12.0);

  float isWindow = step(0.15, winX) * step(winX, 0.85) * step(0.2, winY) * step(winY, 0.78);

  // Random on/off per window
  float winCell = floor((localX - margin) / (1.0 - 2.0 * margin) * 6.0);
  float winRow = floor(uv.y / h * 12.0);
  float lit = step(0.45, hash(vec2(winCell + cellX * 7.0, winRow + depth * 13.0)));

  // Occasional bright accent window
  float accent = step(0.92, hash(vec2(winCell + cellX * 3.0 + 50.0, winRow + depth * 7.0 + 50.0)));

  return isWindow * lit * (1.0 + accent * 2.0);
}

void main() {
  vec2 uv = vUv;
  float horizon = 0.28;

  // Sky gradient: dark at top, slight glow at horizon
  vec3 skyTop = vec3(0.02, 0.02, 0.06);
  vec3 skyHorizon = vec3(0.06, 0.04, 0.12);
  vec3 skyGlow = vec3(0.12, 0.06, 0.16);
  vec3 sky = mix(skyGlow, mix(skyHorizon, skyTop, smoothstep(horizon, 1.0, uv.y)), smoothstep(horizon, horizon + 0.15, uv.y));

  // Horizon glow (city light pollution)
  float horizonGlow = exp(-pow((uv.y - horizon) * 6.0, 2.0));
  sky += vec3(0.15, 0.06, 0.08) * horizonGlow;

  // Clouds (upper portion)
  float cloudY = (uv.y - 0.45) * 3.0;
  if (uv.y > 0.4) {
    float clouds = fbm(vec2(uv.x * 4.0 + uTime * 0.01, cloudY * 1.5 + uTime * 0.005));
    clouds = smoothstep(0.35, 0.65, clouds);
    float cloudFade = smoothstep(0.4, 0.6, uv.y) * smoothstep(1.0, 0.75, uv.y);
    sky = mix(sky, vec3(0.06, 0.05, 0.1), clouds * cloudFade * 0.5);
  }

  vec3 color = sky;

  // Building layers (back to front for depth)
  for (int layer = 3; layer >= 0; layer--) {
    float depth = float(layer);
    float scale = 12.0 + depth * 6.0;
    float yShift = horizon * (1.0 - depth * 0.08);

    vec2 bUv = vec2(uv.x + depth * 1.7, (uv.y - yShift * 0.5) / (horizon * 1.2));

    float b = buildings(bUv, depth, scale);

    // Atmosphere/fog per layer
    float fog = 0.2 + depth * 0.2;
    vec3 buildingColor = mix(vec3(0.01, 0.01, 0.02), sky, fog);

    // Window lights
    float wins = windowLights(bUv, depth, scale);
    float winBrightness = (1.0 - fog) * 0.8;

    // Warm amber accent color (#ffae00) for bright windows
    vec3 accentColor = vec3(1.0, 0.682, 0.0);
    float warmShift = hash(vec2(floor(bUv.x * scale), depth)) * 0.15;
    vec3 warmColor = mix(accentColor, vec3(0.95, 0.78, 0.3), warmShift);

    vec3 winColor = mix(vec3(0.9, 0.85, 0.7), warmColor, step(1.5, wins)) * winBrightness;

    if (b > 0.5 && bUv.y > 0.0) {
      color = buildingColor + winColor * wins;
    }
  }

  // Distant warm signs (scattered bright spots at horizon)
  float signNoise = hash(vec2(floor(uv.x * 80.0), floor(uv.y * 80.0)));
  float inHorizonBand = smoothstep(horizon - 0.06, horizon, uv.y) * smoothstep(horizon + 0.12, horizon + 0.02, uv.y);
  if (signNoise > 0.994 && inHorizonBand > 0.1) {
    float warmVar = signNoise * 0.2;
    vec3 signColor = vec3(1.0, 0.682 + warmVar, warmVar);
    float flicker = 0.7 + 0.3 * sin(uTime * (2.0 + signNoise * 4.0));
    color += signColor * inHorizonBand * flicker * 1.2;
  }

  // Vignette
  float vig = 1.0 - 0.3 * length((uv - 0.5) * 1.6);
  color *= vig;

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function Cityscape({ side = "north" }: { side?: "north" | "south" }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const win = LAB.backWindow;
  const wallZ = HALF_L + LAB.wall.thickness / 2;
  const planeSize = win.size * 3.5;
  const isNorth = side === "north";

  const uniforms = useMemo(
    () => ({
      uTime: { value: isNorth ? 0 : 47 },
    }),
    [isNorth],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      name={`cityscape-${side}`}
      position={[0, H * 0.48, isNorth ? wallZ + 0.5 : -(wallZ + 0.5)]}
    >
      <planeGeometry args={[planeSize, planeSize]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={isNorth ? THREE.BackSide : THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}
