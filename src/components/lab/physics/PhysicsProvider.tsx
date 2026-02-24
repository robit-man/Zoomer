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

// Global singleton guard — Rapier WASM must only init once
let rapierSingleton: { rapier: RapierModule; initialized: boolean } | null = null;
let initPromise: Promise<RapierModule> | null = null;

async function getRapier(): Promise<RapierModule> {
  if (rapierSingleton?.initialized) return rapierSingleton.rapier;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const RAPIER = await import("@dimforge/rapier3d-compat");
    await RAPIER.init();
    rapierSingleton = { rapier: RAPIER, initialized: true };
    return RAPIER;
  })();

  return initPromise;
}

export default function PhysicsProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<PhysicsContextValue | null>(null);
  const accumRef = useRef(0);
  const worldRef = useRef<RapierWorld | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const RAPIER = await getRapier();
      if (cancelled) return;

      const g = LAB.physics.gravity;
      const world = new RAPIER.World({ x: g.x, y: g.y, z: g.z });
      worldRef.current = world;

      // Static colliders with collision group 1 (environment)
      const ENV_GROUP = 0x00010001; // member of group 0, filter group 0

      const addBox = (
        hx: number, hy: number, hz: number,
        tx: number, ty: number, tz: number
      ) => {
        const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(tx, ty, tz);
        const body = world.createRigidBody(bodyDesc);
        const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
          .setCollisionGroups(ENV_GROUP);
        world.createCollider(colliderDesc, body);
      };

      // Floor
      addBox(HALF_W, LAB.floor.thickness / 2, HALF_L, 0, -LAB.floor.thickness / 2, 0);
      // Ceiling
      addBox(HALF_W, LAB.floor.thickness / 2, HALF_L, 0, H + LAB.floor.thickness / 2, 0);
      // Walls
      const wt2 = LAB.wall.thickness / 2;
      addBox(wt2, H / 2, HALF_L, HALF_W + wt2, H / 2, 0);
      addBox(wt2, H / 2, HALF_L, -HALF_W - wt2, H / 2, 0);
      addBox(HALF_W, H / 2, wt2, 0, H / 2, HALF_L + wt2);
      addBox(HALF_W, H / 2, wt2, 0, H / 2, -HALF_L - wt2);

      // Cable tray
      const tray = LAB.structure.tray;
      addBox(
        tray.width / 2, tray.wallThickness / 2, (LAB.room.length - 1) / 2,
        tray.x, tray.y - tray.height, 0
      );

      // Desk tops
      const d = LAB.furniture.desk;
      const eastX = HALF_W - d.wallOffset - d.topDepth / 2;
      const westX = -HALF_W + d.wallOffset + d.topDepth / 2;
      for (const z of LAB.furniture.deskZPositions) {
        addBox(d.topDepth / 2, d.topThickness / 2, d.topWidth / 2, eastX, d.topHeight - d.topThickness / 2, z);
        addBox(d.topDepth / 2, d.topThickness / 2, d.topWidth / 2, westX, d.topHeight - d.topThickness / 2, z);
      }

      if (!cancelled) {
        setCtx({ world, rapier: RAPIER, ready: true });
      }
    }

    setup();

    return () => {
      cancelled = true;
      // Free the world on unmount so strict mode re-mount creates a fresh one
      if (worldRef.current) {
        worldRef.current.free();
        worldRef.current = null;
      }
    };
  }, []);

  // Fixed timestep stepping
  useFrame((_, delta) => {
    if (!ctx) return;
    const dt = LAB.physics.fixedDt;
    accumRef.current += Math.min(delta, 0.1);
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
