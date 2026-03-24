"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALF_L, LAB } from "../config";

const skyVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFragmentShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

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

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.52;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  float horizon = 0.24;

  vec3 skyTop = vec3(0.018, 0.022, 0.03);
  vec3 skyMid = vec3(0.055, 0.06, 0.067);
  vec3 skyHorizon = vec3(0.215, 0.206, 0.19);

  vec3 sky = mix(skyHorizon, skyMid, smoothstep(horizon, 0.62, uv.y));
  sky = mix(sky, skyTop, smoothstep(0.52, 1.0, uv.y));

  float horizonGlow = exp(-pow((uv.y - horizon) * 4.6, 2.0));
  sky += vec3(0.12, 0.108, 0.09) * horizonGlow;

  float lowMist = smoothstep(0.0, 0.22, uv.y);
  sky = mix(vec3(0.175, 0.168, 0.153), sky, lowMist);

  if (uv.y > 0.34) {
    vec2 cloudUv = vec2(uv.x * 2.9 + uTime * 0.008, uv.y * 1.8 - uTime * 0.0035);
    float clouds = fbm(cloudUv);
    clouds = smoothstep(0.5, 0.72, clouds);
    float cloudFade = smoothstep(0.34, 0.52, uv.y) * smoothstep(1.0, 0.8, uv.y);
    vec3 cloudColor = vec3(0.11, 0.108, 0.1);
    sky = mix(sky, cloudColor, clouds * cloudFade * 0.28);
  }

  float lightNoise = hash(vec2(floor(uv.x * 180.0), floor(uv.y * 140.0)));
  float lightBand = smoothstep(horizon - 0.025, horizon + 0.04, uv.y) *
                    smoothstep(horizon + 0.11, horizon + 0.03, uv.y);

  if (lightNoise > 0.992 && lightBand > 0.0) {
    float warmth = hash(vec2(floor(uv.x * 96.0) + 12.0, floor(uv.y * 96.0) + 4.0));
    vec3 distantLight = mix(
      vec3(0.9, 0.88, 0.82),
      vec3(0.98, 0.9, 0.76),
      warmth
    );
    sky += distantLight * lightBand * 0.3;
  }

  float vignette = 1.0 - length((uv - 0.5) * vec2(1.22, 0.9)) * 0.18;
  gl_FragColor = vec4(sky * vignette, 1.0);
}
`;

const towerVertexShader = /* glsl */ `
varying vec3 vObjectPosition;
varying vec3 vObjectNormal;
varying vec3 vWorldNormal;

void main() {
  vObjectPosition = position;
  vObjectNormal = normal;
  vWorldNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const towerFragmentShader = /* glsl */ `
uniform float uWidth;
uniform float uHeight;
uniform float uDepth;
uniform float uRows;
uniform float uCols;
uniform float uWarmth;
uniform float uFogMix;
uniform float uGlowStrength;
uniform float uGlassReflect;
uniform float uSeed;

varying vec3 vObjectPosition;
varying vec3 vObjectNormal;
varying vec3 vWorldNormal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 objectNormal = normalize(vObjectNormal);
  vec3 worldNormal = normalize(vWorldNormal);
  vec3 absNormal = abs(objectNormal);

  float topFace = step(0.92, absNormal.y);
  float sideFace = step(absNormal.z, absNormal.x) * (1.0 - topFace);

  vec3 keyLightA = normalize(vec3(-0.48, 0.8, -0.32));
  vec3 keyLightB = normalize(vec3(0.28, 0.58, 0.76));
  float lightA = max(dot(worldNormal, keyLightA), 0.0);
  float lightB = max(dot(worldNormal, keyLightB), 0.0);
  float shade = 0.26 + lightA * 0.44 + lightB * 0.16;
  shade *= mix(1.0, 0.84, sideFace);

  vec3 cladding = mix(vec3(0.048, 0.052, 0.057), vec3(0.078, 0.082, 0.086), uGlassReflect * 0.55);
  vec3 color = cladding * shade;

  if (topFace > 0.5) {
    vec3 roofTint = vec3(0.06, 0.064, 0.068);
    color = roofTint * (0.6 + lightA * 0.2);
  } else {
    vec2 facadeUv = absNormal.z > absNormal.x
      ? vec2(vObjectPosition.x / uWidth + 0.5, vObjectPosition.y / uHeight + 0.5)
      : vec2(vObjectPosition.z / uDepth + 0.5, vObjectPosition.y / uHeight + 0.5);

    facadeUv = clamp(facadeUv, 0.0, 1.0);

    float cols = max(2.0, uCols);
    float rows = max(4.0, uRows);
    float colIndex = floor(facadeUv.x * cols);
    float rowIndex = floor(facadeUv.y * rows);
    float cellX = fract(facadeUv.x * cols);
    float cellY = fract(facadeUv.y * rows);

    float mullionX = mix(0.032, 0.048, sideFace);
    float mullionY = 0.055;
    float pane = step(mullionX, cellX) * step(cellX, 1.0 - mullionX) *
                 step(mullionY, cellY) * step(cellY, 1.0 - mullionY);

    float occupancyMask = smoothstep(0.02, 0.08, facadeUv.y) * smoothstep(1.0, 0.96, facadeUv.y);
    float lit = step(0.34 + uFogMix * 0.08, hash(vec2(colIndex + uSeed * 1.7, rowIndex + uSeed * 2.9)));
    lit *= 1.0 - step(0.935, hash(vec2(colIndex + uSeed * 5.4, rowIndex + uSeed * 7.6)));
    lit *= occupancyMask;

    float brightness = 0.34 + hash(vec2(colIndex + uSeed * 3.6, rowIndex + uSeed * 4.8)) * 0.28;

    vec3 glassLow = vec3(0.052, 0.06, 0.068);
    vec3 glassHigh = vec3(0.12, 0.126, 0.132);
    vec3 glassTint = mix(glassLow, glassHigh, facadeUv.y * 0.42 + uGlassReflect * 0.38);
    vec3 mullionColor = vec3(0.042, 0.046, 0.05) * (0.86 + shade * 0.24);

    vec3 neutralWhite = vec3(0.88, 0.9, 0.92);
    vec3 warmWhite = vec3(0.98, 0.94, 0.84);
    vec3 windowLight = mix(neutralWhite, warmWhite, 0.28 + uWarmth * 0.72);

    color = mix(mullionColor, glassTint, pane);
    color *= shade;
    color += glassTint * pane * (1.0 - lit) * 0.18;
    color += windowLight * pane * lit * brightness * uGlowStrength;

    float roofBand = smoothstep(0.92, 1.0, facadeUv.y);
    color += vec3(0.03, 0.028, 0.024) * roofBand;
  }

  vec3 fogColor = vec3(0.17, 0.164, 0.15);
  color = mix(color, fogColor, uFogMix);
  color += vec3(0.02, 0.018, 0.015) * uFogMix * 0.22;

  gl_FragColor = vec4(color, 1.0);
}
`;

type BuildingSpec = {
  id: string;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  windowRows: number;
  windowCols: number;
  warmth: number;
  fog: number;
  glow: number;
  glassReflect: number;
  seed: number;
  crownHeight: number;
  crownScale: number;
};

type BandSpec = {
  distanceFromWall: number;
  spread: number;
  baseHeight: number;
  heightRange: number;
  minWidth: number;
  maxWidth: number;
  minDepth: number;
  maxDepth: number;
  fog: number;
};

function fract(value: number) {
  return value - Math.floor(value);
}

function hashNumber(seed: number) {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

function createBand(
  bandIndex: number,
  direction: number,
  wallZ: number,
  spec: BandSpec,
): BuildingSpec[] {
  const buildings: BuildingSpec[] = [];
  const halfSpread = spec.spread * 0.5;
  let cursor = -halfSpread * 1.08;
  let index = 0;

  while (cursor < halfSpread * 1.08) {
    const seed = bandIndex * 97 + index * 17 + (direction > 0 ? 11 : 29);
    const width = lerp(spec.minWidth, spec.maxWidth, hashNumber(seed + 0.1));
    const depth = lerp(spec.minDepth, spec.maxDepth, hashNumber(seed + 0.2));
    const preGap = lerp(0.22, 0.95, hashNumber(seed + 0.3));
    const postGap = lerp(0.32, 1.15, hashNumber(seed + 0.4));

    cursor += width * 0.5 + preGap * 0.45;
    const x = cursor + (hashNumber(seed + 0.5) - 0.5) * 0.55;

    const centerBias = Math.max(0, 1 - Math.abs(x) / (halfSpread * 1.12));
    const clusterBoost = Math.pow(centerBias, 1.6) * lerp(1.2, 7.5, hashNumber(seed + 0.6));
    const height =
      spec.baseHeight +
      spec.heightRange * (0.24 + hashNumber(seed + 0.7) * 0.76) +
      clusterBoost;

    const windowRows = Math.max(
      7,
      Math.round(height * lerp(1.22, 1.56, hashNumber(seed + 0.8))),
    );
    const windowCols = Math.max(
      3,
      Math.round(width * lerp(2.1, 3.25, hashNumber(seed + 0.9))),
    );

    const crownChance = hashNumber(seed + 1.0);
    const crownHeight = crownChance > 0.48 ? height * lerp(0.11, 0.24, hashNumber(seed + 1.1)) : 0;
    const crownScale = lerp(0.62, 0.84, hashNumber(seed + 1.2));

    buildings.push({
      id: `band-${bandIndex}-${index}`,
      x,
      z:
        direction *
        (Math.abs(wallZ) + spec.distanceFromWall + (hashNumber(seed + 1.3) - 0.5) * 2.8),
      height,
      width,
      depth,
      windowRows,
      windowCols,
      warmth: lerp(0.25, 0.78, hashNumber(seed + 1.4)),
      fog: Math.min(0.68, spec.fog + hashNumber(seed + 1.5) * 0.08),
      glow: lerp(0.58, 0.8, hashNumber(seed + 1.6)),
      glassReflect: lerp(0.42, 0.82, hashNumber(seed + 1.7)),
      seed: seed + 3.5,
      crownHeight,
      crownScale,
    });

    cursor += width * 0.5 + postGap;
    index += 1;
  }

  return buildings;
}

function generateBuildings(direction: number, wallZ: number) {
  const bands: BandSpec[] = [
    {
      distanceFromWall: 8.5,
      spread: 34,
      baseHeight: 3.8,
      heightRange: 3.8,
      minWidth: 1.6,
      maxWidth: 3.4,
      minDepth: 1.2,
      maxDepth: 2.3,
      fog: 0.12,
    },
    {
      distanceFromWall: 14.5,
      spread: 43,
      baseHeight: 5.4,
      heightRange: 5.8,
      minWidth: 1.6,
      maxWidth: 3.9,
      minDepth: 1.4,
      maxDepth: 2.6,
      fog: 0.2,
    },
    {
      distanceFromWall: 21.5,
      spread: 52,
      baseHeight: 7.2,
      heightRange: 7.4,
      minWidth: 1.8,
      maxWidth: 4.2,
      minDepth: 1.6,
      maxDepth: 2.9,
      fog: 0.3,
    },
    {
      distanceFromWall: 30,
      spread: 60,
      baseHeight: 8.8,
      heightRange: 9.4,
      minWidth: 2.0,
      maxWidth: 4.8,
      minDepth: 1.8,
      maxDepth: 3.2,
      fog: 0.42,
    },
  ];

  return bands.flatMap((band, index) => createBand(index + 1, direction, wallZ, band));
}

function BuildingVolume({
  width,
  height,
  depth,
  rows,
  cols,
  warmth,
  fog,
  glow,
  glassReflect,
  seed,
  yOffset,
}: {
  width: number;
  height: number;
  depth: number;
  rows: number;
  cols: number;
  warmth: number;
  fog: number;
  glow: number;
  glassReflect: number;
  seed: number;
  yOffset: number;
}) {
  const uniforms = useMemo(
    () => ({
      uWidth: { value: width },
      uHeight: { value: height },
      uDepth: { value: depth },
      uRows: { value: rows },
      uCols: { value: cols },
      uWarmth: { value: warmth },
      uFogMix: { value: fog },
      uGlowStrength: { value: glow },
      uGlassReflect: { value: glassReflect },
      uSeed: { value: seed },
    }),
    [cols, depth, fog, glassReflect, glow, height, rows, seed, warmth, width],
  );

  return (
    <mesh position={[0, yOffset, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <shaderMaterial
        fragmentShader={towerFragmentShader}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={towerVertexShader}
      />
    </mesh>
  );
}

function CityTower({ building }: { building: BuildingSpec }) {
  const bodyHeight = Math.max(building.height - building.crownHeight, building.height * 0.78);
  const crownHeight = Math.max(0, building.height - bodyHeight);

  return (
    <group position={[building.x, -0.55, building.z]}>
      <BuildingVolume
        cols={building.windowCols}
        depth={building.depth}
        fog={building.fog}
        glassReflect={building.glassReflect}
        glow={building.glow}
        height={bodyHeight}
        rows={building.windowRows}
        seed={building.seed}
        warmth={building.warmth}
        width={building.width}
        yOffset={bodyHeight * 0.5}
      />
      {crownHeight > 0.05 && (
        <BuildingVolume
          cols={Math.max(2, Math.round(building.windowCols * 0.8))}
          depth={building.depth * (building.crownScale * 0.94)}
          fog={Math.min(0.76, building.fog + 0.04)}
          glassReflect={Math.min(0.92, building.glassReflect + 0.06)}
          glow={Math.min(0.9, building.glow + 0.04)}
          height={crownHeight}
          rows={Math.max(5, Math.round(building.windowRows * 0.22))}
          seed={building.seed + 19.0}
          warmth={building.warmth}
          width={building.width * building.crownScale}
          yOffset={bodyHeight + crownHeight * 0.5 - 0.02}
        />
      )}
    </group>
  );
}

export default function Cityscape({ side = "north" }: { side?: "north" | "south" }) {
  const skyRef = useRef<THREE.ShaderMaterial>(null);
  const wallZ = HALF_L + LAB.wall.thickness / 2;
  const direction = side === "north" ? 1 : -1;

  const buildings = useMemo(() => generateBuildings(direction, wallZ), [direction, wallZ]);
  const skyUniforms = useMemo(
    () => ({
      uTime: { value: side === "north" ? 0 : 17.5 },
    }),
    [side],
  );

  useFrame((_, delta) => {
    if (skyRef.current) {
      skyRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group name={`cityscape-${side}`}>
      <mesh position={[0, 10.8, direction * (Math.abs(wallZ) + 58)]} renderOrder={-10}>
        <planeGeometry args={[72, 44]} />
        <shaderMaterial
          fragmentShader={skyFragmentShader}
          ref={skyRef}
          side={THREE.DoubleSide}
          toneMapped={false}
          uniforms={skyUniforms}
          vertexShader={skyVertexShader}
        />
      </mesh>

      <mesh
        position={[0, 4.8, direction * (Math.abs(wallZ) + 33)]}
        renderOrder={-6}
      >
        <planeGeometry args={[68, 15]} />
        <meshBasicMaterial
          color={0xb9b1a6}
          depthWrite={false}
          opacity={0.07}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh
        position={[0, 8.0, direction * (Math.abs(wallZ) + 41)]}
        renderOrder={-7}
      >
        <planeGeometry args={[74, 24]} />
        <meshBasicMaterial
          color={0xc7c0b4}
          depthWrite={false}
          opacity={0.035}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      {buildings.map((building) => (
        <CityTower building={building} key={building.id} />
      ))}
    </group>
  );
}
