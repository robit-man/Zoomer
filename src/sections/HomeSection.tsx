"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/components/ui/cn";

const MIN_TILE_SIZE = 250;
const MAX_TILE_SIZE = 350;
const GAP_ESTIMATE = 12;

type FocusTone = "dark" | "light" | "lime" | "blue" | "pink";

type FocusModule = {
  id: string;
  title: string;
  tag: string;
  detail: string;
};

type FocusDisplayModule = FocusModule & { tone: FocusTone };

const focusModules: FocusModule[] = [
  {
    id: "01",
    title: "AI Agents",
    tag: "Automation lane",
    detail:
      "Task-specific AI agents, copilots, workflow automation, and operational assistants shaped around real internal or customer-facing processes.",
  },
  {
    id: "02",
    title: "App Development",
    tag: "Product build",
    detail:
      "Custom app development for internal tools, MVP products, and operational systems with the stack scoped to the actual business need.",
  },
  {
    id: "03",
    title: "Custom Websites",
    tag: "Web surface",
    detail:
      "Custom websites built for launch, conversion, positioning, and credibility without collapsing into generic brochureware.",
  },
  {
    id: "04",
    title: "UI/UX + Journeys",
    tag: "Interface strategy",
    detail:
      "Interface systems, user journeys, onboarding logic, and interaction direction that make products easier to understand and easier to use.",
  },
  {
    id: "05",
    title: "Monetization",
    tag: "Revenue model",
    detail:
      "Offer design, pricing logic, conversion structure, and monetization planning connected to how the product actually earns.",
  },
  {
    id: "06",
    title: "AutoCAD",
    tag: "Technical drafting",
    detail:
      "Measured drawings, mechanical layouts, tolerance-aware part planning, and fabrication-ready CAD support for physical product work.",
  },
  {
    id: "07",
    title: "Electronics + Firmware",
    tag: "Prototype bench",
    detail:
      "Rapid prototyping of small electronics, firmware and hardware bring-up, and interface development for early-stage physical systems.",
  },
  {
    id: "08",
    title: "3D Printing",
    tag: "Fabrication cell",
    detail:
      "Low-to-medium complexity parts manufacturing, print preparation, fit checking, and light assembly support for prototypes or short runs.",
  },
  {
    id: "09",
    title: "Business Consulting",
    tag: "Startup advisory",
    detail:
      "Technology feasibility analysis, market research, pitch deck development, company structuring, and technology discovery for early-stage teams.",
  },
  {
    id: "10",
    title: "Open-Source Tooling",
    tag: "Community forge",
    detail:
      "Developer tools, CLI utilities, and shared infrastructure published as open-source — built for real workflows and maintained with the same rigor as internal systems.",
  },
  {
    id: "11",
    title: "VR + Immersives",
    tag: "Spatial layer",
    detail:
      "Virtual reality environments, immersive experiences, and spatial interfaces for training, visualization, and interactive storytelling.",
  },
  {
    id: "12",
    title: "Robotics",
    tag: "Motion systems",
    detail:
      "Robotic system design, motion planning, sensor integration, and control logic for autonomous or semi-autonomous physical platforms.",
  },
];

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function seededValue(value: string) {
  return (hashSeed(value) % 1000) / 1000;
}

function createSeed() {
  if (typeof crypto !== "undefined") {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] || 1;
  }
  return Math.floor(Math.random() * 2147483647) || 1;
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(items: readonly T[], rng: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildRandomizedModules(seed: number) {
  const rng = mulberry32(seed);
  const shuffledModules = shuffleArray(focusModules, rng);
  const accentSlots = shuffleArray(
    shuffledModules.map((_, index) => index),
    rng,
  ).slice(0, 3);
  const accentTones = shuffleArray<FocusTone>(["lime", "blue", "pink"], rng);
  const neutralTones = shuffleArray<FocusTone>(
    ["dark", "light", "dark", "light", "dark", "light", "dark", "light", "dark"],
    rng,
  );

  return shuffledModules.map((module, index) => {
    const accentIndex = accentSlots.indexOf(index);
    const tone = accentIndex >= 0 ? accentTones[accentIndex] : neutralTones.shift() ?? "light";
    return {
      ...module,
      tone,
    };
  });
}

const TILE_COUNT = 12;

function computeFluidColumns(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 3;

  // Desktop: prefer 4x3 grid, fit both dimensions with square tiles >= MIN_TILE_SIZE.
  for (let cols = 4; cols >= 2; cols -= 1) {
    const rows = Math.ceil(TILE_COUNT / cols);
    const tileW = (width - GAP_ESTIMATE * (cols - 1)) / cols;
    const tileH = (height - GAP_ESTIMATE * (rows - 1)) / rows;
    if (Math.min(tileW, tileH) >= MIN_TILE_SIZE) {
      return cols;
    }
  }

  // Mobile fallback: tiles sized by width, grid scrolls vertically.
  const widthFor2 = (width - GAP_ESTIMATE) / 2;
  return widthFor2 >= 160 ? 2 : 1;
}

function computeTileSize(width: number, height: number, columns: number): number {
  if (width <= 0 || height <= 0) return 0;
  const rows = Math.ceil(TILE_COUNT / columns);
  const tileW = (width - GAP_ESTIMATE * (columns - 1)) / columns;
  const tileH = (height - GAP_ESTIMATE * (rows - 1)) / rows;
  const fitted = Math.floor(Math.min(tileW, tileH));
  // If square tiles can't fit both dimensions, use width-based sizing (scrollable).
  if (fitted < MIN_TILE_SIZE) {
    return Math.min(MAX_TILE_SIZE, Math.floor(tileW));
  }
  return Math.min(MAX_TILE_SIZE, fitted);
}

function isScrollableGrid(width: number, height: number, columns: number, tileSize: number): boolean {
  if (width <= 0 || height <= 0 || tileSize <= 0) return false;
  const rows = Math.ceil(TILE_COUNT / columns);
  const totalHeight = rows * tileSize + GAP_ESTIMATE * (rows - 1);
  return totalHeight > height;
}

function buildExitMetadata(
  modules: readonly FocusDisplayModule[],
  columns: number,
) {
  const leftColumn = 0;
  const rightColumn = columns - 1;

  const grouped = new Map<number, Array<{ id: string; order: number }>>();

  modules.forEach((module, index) => {
    const column = index % columns;
    const seed = seededValue(`${module.id}-${column}`);
    const items = grouped.get(column) ?? [];
    items.push({ id: module.id, order: seed });
    grouped.set(column, items);
  });

  const rightGroup = [...(grouped.get(rightColumn) ?? [])].sort((a, b) => a.order - b.order);
  const leftGroup = [...(grouped.get(leftColumn) ?? [])].sort((a, b) => a.order - b.order);

  const middleGroup = [...grouped.entries()]
    .filter(([column]) => column !== leftColumn && column !== rightColumn)
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, items]) => [...items].sort((a, b) => a.order - b.order))
    .sort((a, b) => a.order - b.order);

  const exitOrder = [...rightGroup, ...middleGroup, ...leftGroup];

  return {
    columnsById: Object.fromEntries(
      modules.map((module, index) => [
        module.id,
        index % columns,
      ]),
    ) as Record<string, number>,
    exitRanksById: Object.fromEntries(
      exitOrder.map((item, index) => [item.id, index]),
    ) as Record<string, number>,
  };
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
  style: React.CSSProperties;
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
      } as React.CSSProperties}
    >
      <motion.span
        className="relative block h-5 w-5"
        style={{ x: driftX, y: driftY }}
      >
        <span
          className={cn(
            "absolute left-1/2 top-0 h-[35%] w-px -translate-x-1/2",
            dark ? "bg-white/32" : "bg-black/26",
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-1/2 h-[35%] w-px -translate-x-1/2",
            dark ? "bg-white/32" : "bg-black/26",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-1/2 h-px w-[35%] -translate-y-1/2",
            dark ? "bg-white/32" : "bg-black/26",
          )}
        />
        <span
          className={cn(
            "absolute right-0 top-1/2 h-px w-[35%] -translate-y-1/2",
            dark ? "bg-white/32" : "bg-black/26",
          )}
        />
      </motion.span>
    </span>
  );
}

function FocusTile({
  detail,
  exitRank,
  id,
  parallaxX,
  parallaxY,
  progress,
  tag,
  title,
  tone,
  visualColumn,
}: FocusDisplayModule & {
  exitRank: number;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  progress: MotionValue<number>;
  visualColumn: number;
}) {
  const driftSeed = seededValue(id);
  const exitStart = 0.18 + exitRank * 0.018;
  const exitMid = exitStart + 0.05;
  const exitEnd = exitStart + 0.11;
  const travel = 90 + visualColumn * 18 + driftSeed * 34;
  const isDark = tone === "dark";
  const accentA = {
    top: `${18 + driftSeed * 44}%`,
    right: -8 - visualColumn * 2,
  };
  const accentB = {
    bottom: `${14 + driftSeed * 36}%`,
    left: -8 - ((driftSeed * 10) % 6),
  };
  const accentAX = useTransform(parallaxX, (value) => value * (8 + driftSeed * 10));
  const accentAY = useTransform(parallaxY, (value) => value * (10 + driftSeed * 12));
  const accentBX = useTransform(parallaxX, (value) => value * (-12 - driftSeed * 8));
  const accentBY = useTransform(parallaxY, (value) => value * (-8 - driftSeed * 10));
  const tileRef = useRef<HTMLElement | null>(null);
  const accentBarRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [underlinePath, setUnderlinePath] = useState<{
    width: number;
    height: number;
    d: string;
  }>({
    width: 0,
    height: 0,
    d: "",
  });
  const accentStroke =
    tone === "dark"
      ? "var(--acid)"
      : tone === "lime"
        ? "#060606"
        : tone === "blue"
          ? "var(--neon-pink)"
          : tone === "pink"
            ? "var(--neon-blue)"
            : "var(--graphite)";

  const opacity = useTransform(progress, [0, exitStart, exitMid, exitEnd], [1, 1, 0.45, 0]);
  const x = useTransform(progress, [0, exitStart, exitEnd], [0, 0, travel]);
  const y = useTransform(
    progress,
    [0, exitStart, exitEnd],
    [0, 0, (driftSeed - 0.5) * 26],
  );
  const blur = useTransform(progress, [0, exitStart, exitEnd], [0, 0, 12]);
  const filter = useTransform(blur, (value) => `blur(${value.toFixed(2)}px)`);

  useEffect(() => {
    const tile = tileRef.current;
    const accentBar = accentBarRef.current;
    const titleElement = titleRef.current;
    if (!tile || !accentBar || !titleElement) {
      return;
    }

    const measurePath = () => {
      const tileRect = tile.getBoundingClientRect();
      const accentRect = accentBar.getBoundingClientRect();
      const titleRect = titleElement.getBoundingClientRect();
      const width = tile.clientWidth;
      const height = tile.clientHeight;

      if (width <= 0 || height <= 0) {
        return;
      }

      const startX = Math.min(width - 1, Math.max(1, accentRect.right - tileRect.left));
      const startY = Math.min(
        height - 1,
        Math.max(1, accentRect.top - tileRect.top + accentRect.height / 2),
      );
      const stemX = Math.max(1, startX - 2);
      const titleRight = Math.min(width - 2, Math.max(2, titleRect.right - tileRect.left));
      const titleLeft = Math.min(
        width - 2,
        Math.max(2, titleRect.left - tileRect.left),
      );
      const underlineY = Math.min(
        height - 2,
        Math.max(startY + 2, titleRect.bottom - tileRect.top + 5),
      );
      const bendSize = Math.max(
        4,
        Math.min(12, Math.floor((underlineY - startY) / 2), Math.floor((stemX - titleRight) / 2)),
      );
      const bendReach = bendSize + 3;
      const bendJoinY = underlineY - bendReach;
      const bendJoinX = stemX - bendReach;

      const nextD = [
        `M ${stemX.toFixed(2)} ${startY.toFixed(2)}`,
        `L ${stemX.toFixed(2)} ${bendJoinY.toFixed(2)}`,
        `L ${bendJoinX.toFixed(2)} ${underlineY.toFixed(2)}`,
        `L ${titleLeft.toFixed(2)} ${underlineY.toFixed(2)}`,
      ].join(" ");

      setUnderlinePath((current) => {
        if (
          current.d === nextD &&
          Math.abs(current.width - width) < 0.5 &&
          Math.abs(current.height - height) < 0.5
        ) {
          return current;
        }
        return {
          width,
          height,
          d: nextD,
        };
      });
    };

    const observer = new ResizeObserver(() => measurePath());
    observer.observe(tile);
    observer.observe(accentBar);
    observer.observe(titleElement);

    measurePath();
    window.addEventListener("resize", measurePath);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measurePath);
    };
  }, [title]);

  return (
    <motion.article
      ref={tileRef}
      style={{ x, y, opacity, filter }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextTarget)) {
          setIsHovered(false);
        }
      }}
      className={cn(
        "flag-indent-y relative flex min-h-0 select-none flex-col justify-between overflow-hidden border border-black/12 p-4 md:p-5 lg:p-6",
        tone === "dark" && "border-black/55 bg-[var(--graphite)] text-[var(--paper)]",
        tone === "lime" && "border-black/15 bg-[var(--acid)] text-[var(--ink)]",
        tone === "light" && "bg-[rgba(252,251,247,0.94)] text-[var(--ink)]",
        tone === "blue" && "border-black/15 bg-[var(--neon-blue)] text-[var(--ink)]",
        tone === "pink" && "border-black/15 bg-[var(--neon-pink)] text-[var(--ink)]",
      )}
    >
      <CrosshairAccent
        dark={isDark}
        driftX={accentAX}
        driftY={accentAY}
        seed={driftSeed}
        style={accentA}
      />
      <CrosshairAccent
        dark={isDark}
        driftX={accentBX}
        driftY={accentBY}
        seed={driftSeed + 0.41}
        style={accentB}
      />

      {underlinePath.d ? (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[4]"
          width={underlinePath.width}
          height={underlinePath.height}
          viewBox={`0 0 ${underlinePath.width} ${underlinePath.height}`}
        >
          <motion.path
            d={underlinePath.d}
            fill="none"
            stroke={accentStroke}
            strokeWidth={1.5}
            strokeLinecap="square"
            initial={false}
            animate={{
              pathLength: isHovered ? 1 : 0,
              opacity: isHovered ? 0.95 : 0,
            }}
            transition={{
              duration: 0.42,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </svg>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "label",
            isDark ? "text-white/45" : "text-black/45",
          )}
        >
          {id}
        </div>
        <div
          ref={accentBarRef}
          className={cn(
            "h-[10px] w-[72px]",
            tone === "dark"
              ? "bg-[var(--acid)]"
              : tone === "lime"
                ? "bg-black"
                : tone === "blue"
                  ? "bg-[var(--neon-pink)]"
                  : tone === "pink"
                    ? "bg-[var(--neon-blue)]"
                    : "bg-[var(--graphite)]",
          )}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col ">
          <div
            className={cn(
              "label mb-3 text-left",
              isDark ? "text-white/56" : "text-black/52",
            )}
          >
            {tag}
          </div>
          <h3
            ref={titleRef}
            className="display ml-auto max-w-[14ch] text-right text-[clamp(1.18rem,1.72vw,2rem)] leading-[0.94] pr-2"
          >
            {title}
          </h3>
        </div>
        <p
          className={cn(
            "max-w-[26rem] text-[10px] leading-[1.45] md:text-[11px]",
            isDark ? "text-white/72" : "text-black/70",
          )}
        >
          {detail}
        </p>
      </div>
    </motion.article>
  );
}

export default function HomeSection({ progress }: { progress: MotionValue<number> }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [seed] = useState(() => createSeed());
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.45 });
  const parallaxY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.45 });

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    // Height for layout decisions must come from the viewport ancestor
    // (the overflow-hidden container in ScrollRoutes), not from self.
    // When the grid overflows, this element's height grows to content height,
    // which would create a circular dependency in column/tile computation.
    let viewportAncestor: HTMLElement | null = element.parentElement;
    while (viewportAncestor) {
      if (getComputedStyle(viewportAncestor).overflow === "hidden") {
        break;
      }
      viewportAncestor = viewportAncestor.parentElement;
    }
    const heightSource = viewportAncestor ?? element;

    const updateSize = () => {
      setContainerSize((current) => {
        const nextW = element.clientWidth;
        const nextH = heightSource.clientHeight;
        if (Math.abs(current.width - nextW) < 2 && Math.abs(current.height - nextH) < 2) {
          return current;
        }
        return { width: nextW, height: nextH };
      });
    };

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    if (heightSource !== element) {
      observer.observe(heightSource);
    }
    updateSize();

    return () => observer.disconnect();
  }, []);

  const columns = useMemo(
    () => computeFluidColumns(containerSize.width, containerSize.height),
    [containerSize.width, containerSize.height],
  );
  const rows = Math.ceil(TILE_COUNT / columns);
  const tileSize = useMemo(
    () => computeTileSize(containerSize.width, containerSize.height, columns),
    [containerSize.width, containerSize.height, columns],
  );
  const scrollable = isScrollableGrid(containerSize.width, containerSize.height, columns, tileSize);

  const modules = useMemo(() => buildRandomizedModules(seed), [seed]);
  const exitMetadata = useMemo(
    () => buildExitMetadata(modules, columns),
    [columns, modules],
  );

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const boundsRect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - boundsRect.left) / boundsRect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - boundsRect.top) / boundsRect.height - 0.5) * 2;
    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex w-full justify-center",
        scrollable ? "min-h-full items-start py-4" : "h-full items-center overflow-visible",
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="grid gap-2 bg-transparent transition-[grid-template-columns,grid-template-rows] duration-300 ease-out md:gap-3"
        style={{
          gridTemplateColumns: tileSize > 0 ? `repeat(${columns}, ${tileSize}px)` : `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: tileSize > 0 ? `repeat(${rows}, ${tileSize}px)` : undefined,
        }}
      >
        {modules.map((module) => (
          <FocusTile
            key={module.id}
            exitRank={exitMetadata.exitRanksById[module.id]}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
            progress={progress}
            visualColumn={exitMetadata.columnsById[module.id]}
            {...module}
          />
        ))}
      </div>
    </div>
  );
}
