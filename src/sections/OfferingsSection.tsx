"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/components/ui/cn";

type TileTone = "dark" | "light" | "lime" | "blue" | "pink";

const offeringColumns = [
  {
    id: "01",
    title: "Prototype Systems",
    subtitle: "Embedded / CAD / Fabrication",
    summary:
      "From controller logic to drafted parts and physical proofing, this lane turns technical intent into something testable fast.",
    tone: "light" as TileTone,
    tiles: [
      {
        label: "Control Node",
        title: "Microcontroller loops",
        detail:
          "Firmware architecture, IO mapping, bench validation, and control-state behavior for early-stage hardware builds.",
        tone: "dark" as TileTone,
      },
      {
        label: "Draft Set",
        title: "AutoCAD packages",
        detail:
          "Measured drawings, fabrication notes, fit checks, and layout systems that hold up when the work leaves the screen.",
        tone: "lime" as TileTone,
      },
      {
        label: "Build Cell",
        title: "Prototype fabrication",
        detail:
          "Printed parts, short-run assemblies, and quick physical iterations to close the gap between concept and handled object.",
        tone: "blue" as TileTone,
      },
    ],
  },
  {
    id: "02",
    title: "Digital Surfaces",
    subtitle: "Web / Narrative / Interface",
    summary:
      "This lane is where the technical stack becomes legible: landing systems, UI structure, and motion that makes the work readable.",
    tone: "dark" as TileTone,
    tiles: [
      {
        label: "Launch Surface",
        title: "Web experience systems",
        detail:
          "Responsive marketing surfaces, editorial layout, and conversion-minded structure built to carry a point of view.",
        tone: "light" as TileTone,
      },
      {
        label: "Motion Logic",
        title: "Interaction direction",
        detail:
          "Transitions, hierarchy changes, pacing, and state changes that make complex offers feel controlled instead of crowded.",
        tone: "pink" as TileTone,
      },
      {
        label: "UI Kit",
        title: "Reusable components",
        detail:
          "Tokens, panel systems, and interaction rules that let the site evolve without collapsing into one-off design decisions.",
        tone: "dark" as TileTone,
      },
    ],
  },
  {
    id: "03",
    title: "Strategy Frames",
    subtitle: "Discovery / Offer / Growth",
    summary:
      "The third lane packages the work: feasibility framing, consulting structure, business development, and what happens after the build.",
    tone: "light" as TileTone,
    tiles: [
      {
        label: "Discovery Pass",
        title: "Technical feasibility",
        detail:
          "Constraint mapping, capability review, and early decision support to identify what is viable before money is wasted.",
        tone: "dark" as TileTone,
      },
      {
        label: "Offer Shape",
        title: "Consulting packages",
        detail:
          "Service framing, scope language, and pricing logic that makes an offer easy to understand and harder to ignore.",
        tone: "light" as TileTone,
      },
      {
        label: "Growth Track",
        title: "Business development",
        detail:
          "Partner mapping, launch sequencing, and commercial follow-through so the work has somewhere to go after delivery.",
        tone: "lime" as TileTone,
      },
    ],
  },
] as const;

function cellularDiffusionOffset(time: number, seed: number, axis: "x" | "y") {
  const t = time * 0.00032;
  const phase = seed * Math.PI * 2;
  const lane = axis === "x" ? 0.74 : 1.02;
  const neighbor = axis === "x" ? 1.36 : 1.18;
  const waveA = Math.sin(t * lane + phase);
  const waveB = Math.cos(t * neighbor - phase * 0.66);
  const coupled = Math.sin((waveA + waveB) * 1.28 + t * 0.54);
  const diffusion = Math.cos(t * 0.4 + phase * 1.58 + coupled * 1.1);

  return waveA * 0.34 + waveB * 0.22 + coupled * 0.28 + diffusion * 0.16;
}

function seededValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) % 2147483647;
  }
  return (hash % 1000) / 1000;
}

function CrosshairAccent({
  dark,
  driftX,
  driftY,
  seed,
  style,
}: {
  dark: boolean;
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  seed: number;
  style: CSSProperties;
}) {
  const time = useTime();
  const x = useTransform(() => {
    const organicX = cellularDiffusionOffset(time.get(), seed, "x") * 12;
    return driftX.get() + organicX;
  });
  const y = useTransform(() => {
    const organicY = cellularDiffusionOffset(time.get(), seed + 0.147, "y") * 14;
    return driftY.get() + organicY;
  });

  return (
    <motion.span
      className="pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2"
      style={{ ...style, x, y }}
    >
      <span
        className={cn(
          "absolute left-1/2 top-0 h-[35%] w-px -translate-x-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 left-1/2 h-[35%] w-px -translate-x-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 h-px w-[35%] -translate-y-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute right-0 top-1/2 h-px w-[35%] -translate-y-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
    </motion.span>
  );
}

function ToneBlock({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: TileTone;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-black/12",
        tone === "dark" && "border-black/55 bg-[var(--graphite)] text-[var(--paper)]",
        tone === "light" && "bg-[rgba(252,251,247,0.94)] text-[var(--ink)]",
        tone === "lime" && "border-black/15 bg-[var(--acid)] text-[var(--ink)]",
        tone === "blue" && "border-black/15 bg-[var(--neon-blue)] text-[var(--ink)]",
        tone === "pink" && "border-black/15 bg-[var(--neon-pink)] text-[var(--ink)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ServiceTile({
  driftX,
  driftY,
  index,
  progress,
  tile,
}: {
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  index: number;
  progress: MotionValue<number>;
  tile: (typeof offeringColumns)[number]["tiles"][number];
}) {
  const seed = seededValue(`${tile.title}-${index}`);
  const start = 0.38 + index * 0.025;
  const end = 0.56 + index * 0.025;
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const x = useTransform(progress, [start, end], [-24 + index * 8, 0]);
  const isDark = tile.tone === "dark";
  const accentAX = useTransform(driftX, (value) => value * (8 + seed * 8));
  const accentAY = useTransform(driftY, (value) => value * (10 + seed * 9));
  const accentBX = useTransform(driftX, (value) => value * (-10 - seed * 9));
  const accentBY = useTransform(driftY, (value) => value * (-8 - seed * 8));

  return (
    <motion.div style={{ opacity, x }} className="min-h-0">
      <ToneBlock
        tone={tile.tone}
        className="flex h-full min-h-[180px] flex-col justify-between p-4 md:p-5 xl:min-h-0"
      >
        <CrosshairAccent
          dark={isDark}
          driftX={accentAX}
          driftY={accentAY}
          seed={seed}
          style={{ top: `${18 + seed * 40}%`, right: -8 }}
        />
        <CrosshairAccent
          dark={isDark}
          driftX={accentBX}
          driftY={accentBY}
          seed={seed + 0.38}
          style={{ bottom: `${14 + seed * 26}%`, left: -8 }}
        />

        <div className={cn("label", isDark ? "text-white/48" : "text-black/44")}>
          {tile.label}
        </div>
        <div>
          <h4 className="display max-w-[12ch] text-[clamp(1.3rem,1.7vw,2.1rem)] leading-[0.9]">
            {tile.title}
          </h4>
          <p
            className={cn(
              "mt-3 max-w-[24rem] text-[10px] leading-[1.45] md:text-[11px]",
              isDark ? "text-white/72" : "text-black/68",
            )}
          >
            {tile.detail}
          </p>
        </div>
      </ToneBlock>
    </motion.div>
  );
}

function LaneColumn({
  column,
  driftX,
  driftY,
  index,
  progress,
}: {
  column: (typeof offeringColumns)[number];
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = 0.34 + index * 0.05;
  const end = 0.5 + index * 0.05;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  const x = useTransform(progress, [start, end], [-48 + index * 12, 0]);
  const seed = seededValue(`${column.title}-${column.id}`);
  const isDark = column.tone === "dark";
  const accentAX = useTransform(driftX, (value) => value * (10 + seed * 10));
  const accentAY = useTransform(driftY, (value) => value * (12 + seed * 8));
  const accentBX = useTransform(driftX, (value) => value * (-12 - seed * 8));
  const accentBY = useTransform(driftY, (value) => value * (-10 - seed * 8));

  return (
    <motion.article style={{ opacity, x }} className="min-h-0 overflow-hidden xl:h-full">
      <ToneBlock
        tone={column.tone}
        className="grid h-full min-h-[520px] grid-rows-[auto_minmax(0,1fr)] xl:min-h-0"
      >
        <CrosshairAccent
          dark={isDark}
          driftX={accentAX}
          driftY={accentAY}
          seed={seed}
          style={{ top: 34, right: -9 }}
        />
        <CrosshairAccent
          dark={isDark}
          driftX={accentBX}
          driftY={accentBY}
          seed={seed + 0.27}
          style={{ bottom: 42, left: -9 }}
        />

        <div className={cn("border-b px-4 py-4 md:px-5 md:py-5", isDark ? "border-white/10" : "border-black/10")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={cn("label", isDark ? "text-white/44" : "text-black/44")}>
                {column.id}
              </div>
              <h3 className="display mt-3 max-w-[10ch] text-[clamp(1.8rem,2.4vw,3rem)] leading-[0.88]">
                {column.title}
              </h3>
            </div>
            <div
              className={cn(
                "max-w-[8rem] text-right text-[10px] uppercase tracking-[0.18em]",
                isDark ? "text-white/42" : "text-black/38",
              )}
            >
              {column.subtitle}
            </div>
          </div>
          <p
            className={cn(
              "mt-4 max-w-[22rem] text-[10px] leading-[1.45] md:text-[11px]",
              isDark ? "text-white/68" : "text-black/66",
            )}
          >
            {column.summary}
          </p>
        </div>

        <div className="grid min-h-0 grid-rows-3 gap-2 p-2 md:gap-3 md:p-3">
          {column.tiles.map((tile, tileIndex) => (
            <ServiceTile
              key={tile.title}
              driftX={driftX}
              driftY={driftY}
              index={tileIndex}
              progress={progress}
              tile={tile}
            />
          ))}
        </div>
      </ToneBlock>
    </motion.article>
  );
}

export default function OfferingsSection({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const driftX = useSpring(pointerX, { stiffness: 80, damping: 24, mass: 0.5 });
  const driftY = useSpring(pointerY, { stiffness: 80, damping: 24, mass: 0.5 });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      className="w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="mx-auto grid w-full max-w-[84rem] gap-2 md:gap-3 xl:h-[min(44rem,calc(100svh-4rem))] xl:grid-cols-3">
        {offeringColumns.map((column, index) => (
          <LaneColumn
            key={column.id}
            column={column}
            driftX={driftX}
            driftY={driftY}
            index={index}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}
