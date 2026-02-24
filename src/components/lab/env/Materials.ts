import * as THREE from "three";
import { LAB } from "../config";

const m = LAB.materials;

export function createFloorMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: m.floor.color,
    roughness: m.floor.roughness,
    metalness: m.floor.metalness,
    clearcoat: m.floor.clearcoat,
    clearcoatRoughness: m.floor.clearcoatRoughness,
    side: THREE.FrontSide,
  });
}

export function createWallMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.wall.color,
    roughness: m.wall.roughness,
    metalness: m.wall.metalness,
    side: THREE.FrontSide,
  });
}

export function createCeilingMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.ceiling.color,
    roughness: m.ceiling.roughness,
    metalness: m.ceiling.metalness,
    side: THREE.FrontSide,
  });
}

export function createStrutMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.strut.color,
    roughness: m.strut.roughness,
    metalness: m.strut.metalness,
  });
}

export function createCableMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: m.cable.color,
    roughness: m.cable.roughness,
    metalness: m.cable.metalness,
    clearcoat: m.cable.clearcoat,
    clearcoatRoughness: m.cable.clearcoatRoughness,
  });
}

export function createDeskMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.desk.color,
    roughness: m.desk.roughness,
    metalness: m.desk.metalness,
  });
}

export function createDeskLegMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.deskLeg.color,
    roughness: m.deskLeg.roughness,
    metalness: m.deskLeg.metalness,
  });
}

export function createTrimMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: m.trim.color,
    roughness: m.trim.roughness,
    metalness: m.trim.metalness,
  });
}

export function createStripMaterial(phase: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x222222,
    emissive: LAB.wallStrips.color,
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
