/** Centralized configuration for the Lab Environment scene. */

import tuningPatch from "../../../public/scene-tuning.json";

// ── Deep merge utility ──────────────────────────────────────────────────────
function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const bVal = out[key];
    const pVal = patch[key];
    if (
      bVal && pVal &&
      typeof bVal === "object" && !Array.isArray(bVal) &&
      typeof pVal === "object" && !Array.isArray(pVal)
    ) {
      out[key] = deepMerge(bVal as Record<string, unknown>, pVal as Record<string, unknown>);
    } else {
      out[key] = pVal;
    }
  }
  return out as T;
}

// ── Defaults ────────────────────────────────────────────────────────────────
export type LabConfig = typeof DEFAULTS;

const DEFAULTS = {
  render: {
    dprMin: 1,
    dprMax: 1,
    shadows: false,
    antialias: false,
  },

  room: {
    length: 24,
    width: 8,
    height: 4,
  },
  floor: { thickness: 0.04 },
  wall: { thickness: 0.08 },
  trim: { height: 0.1, depth: 0.015 },

  materials: {
    floor:   { color: 0x2c2a27, roughness: 0.92, metalness: 0.0, clearcoat: 0.04, clearcoatRoughness: 0.96 },
    wall:    { color: 0xf1efe7, roughness: 0.72, metalness: 0.0 },
    ceiling: { color: 0x35322f, roughness: 0.96, metalness: 0.0 },
    strut:   { color: 0xc9cbd1, roughness: 0.48, metalness: 0.32 },
    rack:    { color: 0x2b2926, roughness: 0.84, metalness: 0.16 },
    shelf:   { color: 0x34312d, roughness: 0.9, metalness: 0.08 },
    cable:   { color: 0x2a2a2a, roughness: 0.55, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.6 },
    desk:    { color: 0xefebe5, roughness: 0.58, metalness: 0.0 },
    deskLeg: { color: 0xafb5bc, roughness: 0.42, metalness: 0.42 },
    trim:    { color: 0xe1ddd5, roughness: 0.65, metalness: 0.0 },
  },

  lighting: {
    exposure: 0.28,
    ambient: 0.18,
    hemisphere: {
      intensity: 0,
      skyColor: 0xf8fbff,
      groundColor: 0x2d2b29,
    },
    overhead: {
      count: 6,
      width: 1.2,
      height: 0.45,
      intensity: 0,
      color: 0xffffff,
      y: 3.85,
      zPositions: [-10, -6, -2, 2, 6, 10],
      panelEmissive: 0,
    },
    shadowSpots: {
      intensity: 0,
      angle: Math.PI / 4,
      penumbra: 0.6,
    },
    floorLift: {
      enabled: true,
      intensity: 0,
    },
  },

  wallStrips: {
    color: 0xffffff,
    eastAccentIndex: 3,
    eastAccentColor: 0x4cc9ff,
    westAccentIndex: 8,
    westAccentColor: 0xff58cf,
    countPerWall: 12,
    width: 0.065,
    height: 2.7,
    offsetFromWall: 0.015,
    pocketDepth: 0.016,
    pocketWidth: 0.08,
    slotInset: 0.01,
    lightInset: 0.06,
    slotLightIntensity: 1.1,
    slotLightDistance: 10.5,
    slotLightAngle: 0.68,
    shadowEvery: 3,
    marginFromFloor: 0.42,
    emissiveBase: 2.65,
    emissiveAmplitude: 0,
    flickerSpeed: 0.54,
    fillLightOffset: 0.62,
    fillLightHeightOffset: 0.16,
    glowDepth: 0.22,
    glowWidth: 0.5,
    glowHeight: 3.25,
    glowOpacity: 0.38,
    floorGlowDepth: 1.48,
    floorGlowWidth: 0.78,
    floorGlowOpacity: 0,
    bleedLight: {
      intensity: 4.8,
      color: 0xf5f8ff,
    },
  },

  backdrop: {
    enabled: true,
    gridDistance: 5,
    lineLength: 0.12,
    lineColor: 0xe7f4ff,
    lineOpacity: 0.18,
    atmosphereColor: 0x66b7ff,
    atmosphereScale: 34,
    atmosphereAlpha: 0.42,
  },

  structure: {
    railOffsetX: 3.4,
    railSize: 0.05,
    crossSpacing: 1.5,
    tray: { x: 0, y: 3.65, width: 0.25, height: 0.07, wallThickness: 0.008 },
    clampSpacing: 0.8,
    tapZPositions: [-9, -5, -1, 3, 7, 11],
  },

  furniture: {
    desksPerSide: 3,
    desk: {
      topWidth: 1.8,
      topDepth: 0.7,
      topThickness: 0.04,
      topHeight: 0.76,
      legSize: 0.04,
      wallOffset: 0.15,
    },
    deskZPositions: [-8, -2, 4],
    rack: {
      bayWidth: 1.35,
      depth: 0.28,
      height: 2.15,
      bottomY: 1.02,
      uprightThickness: 0.05,
      shelfThickness: 0.04,
      braceThickness: 0.028,
      wallOffset: 0.03,
      shelfLevels: [0.24, 0.92, 1.58],
      zPositions: [-9, -3, 3, 9],
    },
  },

  cables: {
    singleRadius: 0.003,
    packingFactor: 0.65,
    trunk:  { count: 24, slack: 1.02, segmentLength: 0.15, linearDamping: 5.0, angularDamping: 7.5 },
    branch: { count: 6,  slack: 1.10, segmentLength: 0.15, linearDamping: 6.0, angularDamping: 9.0 },
    wallEndpointY: 2.2,
    wallEndpointXOffset: 0.1,
  },

  post: {
    bloom: {
      enabled: true,
      strength: 0.82,
      radius: 0.35,
      threshold: 0.12,
      resolutionScale: 0.72,
    },
  },

  physics: {
    gravity: { x: 0, y: -9.81, z: 0 },
    fixedDt: 1 / 60,
  },
};

// ── Mutable runtime config (starts as defaults, patched by JSON) ────────────
export let LAB: LabConfig = deepMerge(DEFAULTS, tuningPatch as Record<string, unknown>);

/** Apply a partial patch from the tuning JSON */
export function applyTuning(patch: Record<string, unknown>): void {
  LAB = deepMerge(DEFAULTS, patch);
}

/** Fetch /scene-tuning.json and merge into LAB. Returns the merged config. */
export async function loadTuning(): Promise<LabConfig> {
  try {
    const res = await fetch("/scene-tuning.json", { cache: "no-store" });
    if (res.ok) {
      const patch = await res.json();
      applyTuning(patch);
    }
  } catch {
    // No tuning file or parse error — keep defaults
  }
  return LAB;
}

// ── Derived helpers ─────────────────────────────────────────────────────────
// Static convenience (valid as long as room dims stay at defaults)
export const HALF_W = DEFAULTS.room.width / 2;
export const HALF_L = DEFAULTS.room.length / 2;
export const H = DEFAULTS.room.height;

/** Bundle radius heuristic: r_single * sqrt(count) * packingFactor */
export function bundleRadius(count: number): number {
  return LAB.cables.singleRadius * Math.sqrt(count) * LAB.cables.packingFactor;
}
