"use client";

import {
  motion,
  useMotionValue,
  useSpring,
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
    title: "Software",
    subtitle: "AI / Apps / Web",
    summary:
      "AI agents, app builds, custom websites, UI/UX, user journeys, and monetization design for digital products that need to launch and earn.",
    tone: "light" as TileTone,
    tiles: [
      {
        label: "Agent Systems",
        title: "AI agents",
        detail:
          "Workflow automation, internal copilots, domain-specific assistants, and task routing built around the decisions your team already makes.",
        tone: "dark" as TileTone,
      },
      {
        label: "Product Build",
        title: "App development",
        detail:
          "Custom applications for internal ops, client-facing tools, and MVP software products with practical scope, architecture, and delivery.",
        tone: "lime" as TileTone,
      },
      {
        label: "Surface Stack",
        title: "Web, UX, monetization",
        detail:
          "Custom websites, UI/UX systems, user journeys, and monetization structure tied directly to conversion, clarity, and product fit.",
        tone: "blue" as TileTone,
      },
    ],
  },
  {
    id: "02",
    title: "Hardtech + Fabrication",
    subtitle: "CAD / Electronics / Print",
    summary:
      "Physical product support from drafting through prototyping: AutoCAD, small-electronics bench work, firmware and hardware development, UI support, and printed part production.",
    tone: "dark" as TileTone,
    tiles: [
      {
        label: "Draft Pack",
        title: "AutoCAD systems",
        detail:
          "Measured drawings, assembly layouts, part geometry, tolerance-aware planning, and fabrication-ready drafting support for physical builds.",
        tone: "light" as TileTone,
      },
      {
        label: "Prototype Bench",
        title: "Electronics + firmware",
        detail:
          "Rapid prototyping of small electronics, firmware and hardware iteration, bench validation, and embedded interface development.",
        tone: "pink" as TileTone,
      },
      {
        label: "Build Output",
        title: "3D printing + assembly",
        detail:
          "Low-to-medium complexity parts manufacturing, print prep, fit checks, and assembly support to move concepts into handled objects.",
        tone: "dark" as TileTone,
      },
    ],
  },
  {
    id: "03",
    title: "Business / Startup Consulting",
    subtitle: "Feasibility / Market / Structure",
    summary:
      "General consulting for founders and operators who need the product, business, and market case sharpened before committing bigger money.",
    tone: "light" as TileTone,
    tiles: [
      {
        label: "Discovery Pass",
        title: "Feasibility + tech discovery",
        detail:
          "Technology product feasibility analysis, constraint mapping, and technology discovery to determine what is actually buildable and worth pursuing.",
        tone: "dark" as TileTone,
      },
      {
        label: "Company Model",
        title: "Business structure",
        detail:
          "Business structure, company structuring, offer definition, and operating decisions that support the product and the market strategy.",
        tone: "light" as TileTone,
      },
      {
        label: "Market Story",
        title: "Pitch decks + research",
        detail:
          "Market research, pitch deck development, and narrative framing that help explain the opportunity clearly to partners, clients, or investors.",
        tone: "lime" as TileTone,
      },
    ],
  },
] as const;

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
  const driftClass =
    seed < 0.33
      ? "crosshair-drift-a"
      : seed < 0.66
        ? "crosshair-drift-b"
        : "crosshair-drift-c";
  const duration = 8 + seed * 12;

  return (
    <span
      className={cn("pointer-events-none absolute z-10", driftClass)}
      style={{
        ...style,
        "--crosshair-dur": `${duration.toFixed(1)}s`,
      } as CSSProperties}
    >
      <motion.span
        className="relative block h-5 w-5"
        style={{ x: driftX, y: driftY }}
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
    </span>
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
  const start = 0.18 + index * 0.08;
  const end = 0.68 + index * 0.08;
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const x = useTransform(progress, [start, end], [-20 + index * 6, 0]);
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
          <h4 className="display max-w-[14ch] text-[clamp(1.12rem,1.42vw,1.78rem)] leading-[0.92]">
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
  const start = 0.08 + index * 0.12;
  const end = 0.62 + index * 0.12;
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
        className="grid h-full min-h-[580px] grid-rows-[auto_minmax(0,1fr)] xl:min-h-0"
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
              <h3 className="display mt-3 max-w-min text-[clamp(1.52rem,1.95vw,2.45rem)] leading-[0.9]">
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
  const entryProgress = useTransform(progress, [0.28, 0.54], [0, 1]);
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
      <div className="mx-auto grid w-full max-w-[84rem] gap-2 md:gap-3 xl:h-[min(50rem,calc(100svh-2.5rem))] xl:grid-cols-3">
        {offeringColumns.map((column, index) => (
          <LaneColumn
            key={column.id}
            column={column}
            driftX={driftX}
            driftY={driftY}
            index={index}
            progress={entryProgress}
          />
        ))}
      </div>
    </div>
  );
}
