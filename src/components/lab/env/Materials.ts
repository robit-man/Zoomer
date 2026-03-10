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

export function createStripMaterial(phase: number, color = LAB.wallStrips.color): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x222222,
    emissive: color,
    emissiveIntensity: LAB.wallStrips.emissiveBase,
    side: THREE.DoubleSide,
    userData: { phase },
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
