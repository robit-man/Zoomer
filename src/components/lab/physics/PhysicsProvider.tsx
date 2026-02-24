"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { LAB, HALF_W, HALF_L, H } from "../config";

// We'll import Rapier types dynamically
type RapierModule = typeof import("@dimforge/rapier3d-compat");
type RapierWorld = InstanceType<RapierModule["World"]>;

interface PhysicsContextValue {
  world: RapierWorld;
  rapier: RapierModule;
  ready: boolean;
}

const PhysicsContext = createContext<PhysicsContextValue | null>(null);

export function usePhysics() {
  const ctx = useContext(PhysicsContext);
  if (!ctx) throw new Error("usePhysics must be used within PhysicsProvider");
  return ctx;
}

export function usePhysicsMaybe() {
  return useContext(PhysicsContext);
}

export default function PhysicsProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<PhysicsContextValue | null>(null);
  const accumRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function initRapier() {
      const RAPIER = await import("@dimforge/rapier3d-compat");
      await RAPIER.init();
      if (cancelled) return;

      const g = LAB.physics.gravity;
      const world = new RAPIER.World({ x: g.x, y: g.y, z: g.z });

      // Static colliders: floor, ceiling, walls
      const addBox = (
        hx: number, hy: number, hz: number,
        tx: number, ty: number, tz: number
      ) => {
        const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(tx, ty, tz);
        const body = world.createRigidBody(bodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz);
        world.createCollider(colliderDesc, body);
      };

      // Floor
      addBox(HALF_W, LAB.floor.thickness / 2, HALF_L, 0, -LAB.floor.thickness / 2, 0);
      // Ceiling
      addBox(HALF_W, LAB.floor.thickness / 2, HALF_L, 0, H + LAB.floor.thickness / 2, 0);
      // Walls
      const wt2 = LAB.wall.thickness / 2;
      addBox(wt2, H / 2, HALF_L, HALF_W + wt2, H / 2, 0);  // E
      addBox(wt2, H / 2, HALF_L, -HALF_W - wt2, H / 2, 0);  // W
      addBox(HALF_W, H / 2, wt2, 0, H / 2, HALF_L + wt2);   // N
      addBox(HALF_W, H / 2, wt2, 0, H / 2, -HALF_L - wt2);  // S

      // Cable tray (bottom)
      const tray = LAB.structure.tray;
      addBox(
        tray.width / 2, tray.wallThickness / 2, (LAB.room.length - 1) / 2,
        tray.x, tray.y - tray.height, 0
      );

      // Desk tops as colliders
      const d = LAB.furniture.desk;
      const eastX = HALF_W - d.wallOffset - d.topDepth / 2;
      const westX = -HALF_W + d.wallOffset + d.topDepth / 2;
      for (const z of LAB.furniture.deskZPositions) {
        addBox(d.topDepth / 2, d.topThickness / 2, d.topWidth / 2, eastX, d.topHeight - d.topThickness / 2, z);
        addBox(d.topDepth / 2, d.topThickness / 2, d.topWidth / 2, westX, d.topHeight - d.topThickness / 2, z);
      }

      setCtx({ world, rapier: RAPIER, ready: true });
    }

    initRapier();
    return () => { cancelled = true; };
  }, []);

  // Fixed timestep stepping
  useFrame((_, delta) => {
    if (!ctx) return;
    const dt = LAB.physics.fixedDt;
    accumRef.current += Math.min(delta, 0.1); // clamp to prevent spiral
    while (accumRef.current >= dt) {
      ctx.world.step();
      accumRef.current -= dt;
    }
  });

  if (!ctx) return null;

  return (
    <PhysicsContext.Provider value={ctx}>
      {children}
    </PhysicsContext.Provider>
  );
}
