/** Centralized configuration for the Lab Environment scene. */

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
  room: {
    length: 24,
    width: 8,
    height: 4,
  },
  floor: { thickness: 0.04 },
  wall: { thickness: 0.08 },
  trim: { height: 0.1, depth: 0.015 },

  materials: {
    floor:   { color: 0xf7f7f7, roughness: 0.35, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.4 },
    wall:    { color: 0xebebeb, roughness: 0.75, metalness: 0.0 },
    ceiling: { color: 0xdcdcdc, roughness: 0.82, metalness: 0.0 },
    strut:   { color: 0xc0c0c0, roughness: 0.55, metalness: 0.3 },
    cable:   { color: 0x2a2a2a, roughness: 0.55, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.6 },
    desk:    { color: 0xe8e4df, roughness: 0.6, metalness: 0.0 },
    deskLeg: { color: 0xb0b0b0, roughness: 0.45, metalness: 0.4 },
    trim:    { color: 0xd5d5d5, roughness: 0.7, metalness: 0.0 },
  },

  lighting: {
    exposure: 1.15,
    ambient: 0.15,
    overhead: {
      count: 6,
      width: 1.2,
      height: 0.45,
      intensity: 45,
      color: 0xffffff,
      y: 3.85,
      zPositions: [-10, -6, -2, 2, 6, 10],
      panelEmissive: 0.2,
    },
    shadowSpots: {
      intensity: 15,
      angle: Math.PI / 4,
      penumbra: 0.6,
    },
    floorLift: {
      enabled: true,
      intensity: 1.0,
    },
  },

  wallStrips: {
    color: 0xa9c7ff,
    countPerWall: 12,
    width: 0.05,
    height: 2.4,
    offsetFromWall: 0.015,
    marginFromFloor: 0.5,
    emissiveBase: 0.8,
    emissiveAmplitude: 0.12,
    flickerSpeed: 0.6,
    bleedLight: {
      intensity: 2.5,
      color: 0xa9c7ff,
    },
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
      intensity: 0.3,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.4,
    },
  },

  physics: {
    gravity: { x: 0, y: -9.81, z: 0 },
    fixedDt: 1 / 60,
  },
};

// ── Mutable runtime config (starts as defaults, patched by JSON) ────────────
export let LAB: LabConfig = { ...DEFAULTS };

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
