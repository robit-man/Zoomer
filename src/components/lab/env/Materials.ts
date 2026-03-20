import * as THREE from "three";
import { LAB } from "../config";

// NOTE: Always read LAB.materials inside function bodies, never cache at module
// scope — the tuning JSON patches LAB after module import.

export function createFloorMaterial(): THREE.MeshPhysicalMaterial {
  const f = LAB.materials.floor;
  return new THREE.MeshPhysicalMaterial({
    color: f.color,
    roughness: f.roughness,
    metalness: f.metalness,
    clearcoat: f.clearcoat,
    clearcoatRoughness: f.clearcoatRoughness,
    side: THREE.FrontSide,
  });
}

export function createWallMaterial(): THREE.MeshStandardMaterial {
  const w = LAB.materials.wall;
  return new THREE.MeshStandardMaterial({
    color: w.color,
    roughness: w.roughness,
    metalness: w.metalness,
    side: THREE.FrontSide,
  });
}

export function createCeilingMaterial(): THREE.MeshStandardMaterial {
  const c = LAB.materials.ceiling;
  return new THREE.MeshStandardMaterial({
    color: c.color,
    roughness: c.roughness,
    metalness: c.metalness,
    side: THREE.FrontSide,
  });
}

export function createStrutMaterial(): THREE.MeshStandardMaterial {
  const s = LAB.materials.strut;
  return new THREE.MeshStandardMaterial({
    color: s.color,
    roughness: s.roughness,
    metalness: s.metalness,
  });
}

export function createRackMaterial(): THREE.MeshStandardMaterial {
  const r = LAB.materials.rack;
  return new THREE.MeshStandardMaterial({
    color: r.color,
    roughness: r.roughness,
    metalness: r.metalness,
  });
}

export function createShelfMaterial(): THREE.MeshStandardMaterial {
  const s = LAB.materials.shelf;
  return new THREE.MeshStandardMaterial({
    color: s.color,
    roughness: s.roughness,
    metalness: s.metalness,
  });
}

export function createCableMaterial(): THREE.MeshPhysicalMaterial {
  const c = LAB.materials.cable;
  return new THREE.MeshPhysicalMaterial({
    color: c.color,
    roughness: c.roughness,
    metalness: c.metalness,
    clearcoat: c.clearcoat,
    clearcoatRoughness: c.clearcoatRoughness,
  });
}

export function createDeskMaterial(): THREE.MeshStandardMaterial {
  const d = LAB.materials.desk;
  return new THREE.MeshStandardMaterial({
    color: d.color,
    roughness: d.roughness,
    metalness: d.metalness,
  });
}

export function createDeskLegMaterial(): THREE.MeshStandardMaterial {
  const l = LAB.materials.deskLeg;
  return new THREE.MeshStandardMaterial({
    color: l.color,
    roughness: l.roughness,
    metalness: l.metalness,
  });
}

export function createTrimMaterial(): THREE.MeshStandardMaterial {
  const t = LAB.materials.trim;
  return new THREE.MeshStandardMaterial({
    color: t.color,
    roughness: t.roughness,
    metalness: t.metalness,
  });
}

export function createGlassMaterial(): THREE.MeshPhysicalMaterial {
  const g = LAB.backWindow;
  return new THREE.MeshPhysicalMaterial({
    color: g.glassColor,
    transparent: true,
    opacity: g.glassOpacity,
    roughness: g.glassRoughness,
    metalness: g.glassMetalness,
    transmission: 0.92,
    ior: g.glassIor,
    thickness: 0.05,
    side: THREE.FrontSide,
  });
}

export function createStripMaterial(phase: number, color = LAB.wallStrips.color): THREE.MeshBasicMaterial {
  const baseColor = new THREE.Color(color);
  return new THREE.MeshBasicMaterial({
    color: baseColor.clone().multiplyScalar(LAB.wallStrips.emissiveBase),
    side: THREE.DoubleSide,
    toneMapped: false,
    userData: { phase, baseColor },
  });
}

export function createPanelMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: LAB.lighting.overhead.panelEmissive,
    side: THREE.DoubleSide,
  });
}
