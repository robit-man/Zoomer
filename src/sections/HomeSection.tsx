"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/components/ui/cn";

const COMPACT_HEIGHT_THRESHOLD = 840;
const GRID_UNIT = 46;
const VISIBLE_COLUMNS = 3;
const FULL_ROWS = 3;
const COMPACT_ROWS = 2;

type FocusTone = "dark" | "light" | "lime" | "blue" | "pink";

type FocusModule = {
  id: string;
  title: string;
  tag: string;
  detail: string;
};

type FocusDisplayModule = FocusModule & { tone: FocusTone };

type LayoutMetrics = {
  compact: boolean;
  cellSize: number;
  totalColumns: number;
  totalRows: number;
  contentWidth: number;
  contentHeight: number;
  offsetX: number;
  offsetY: number;
};

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
    ["dark", "light", "dark", "light", "dark", "light"],
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

function reorderCompactModules(modules: readonly FocusDisplayModule[]) {
  const ordered: FocusDisplayModule[] = [];
  for (let index = 0; index < modules.length; index += 3) {
    const first = modules[index];
    const second = modules[index + 1];
    const third = modules[index + 2];

    if (first) {
      ordered.push(first);
    }
    if (modules[index + 3]) {
      ordered.push(modules[index + 3]);
    }
    if (second) {
      ordered.push(second);
    }
    if (modules[index + 4]) {
      ordered.push(modules[index + 4]);
    }
    if (third) {
      ordered.push(third);
    }
    if (modules[index + 5]) {
      ordered.push(modules[index + 5]);
    }

    break;
  }

  if (modules[6]) {
    ordered.push(modules[6]);
  }
  if (modules[8]) {
    ordered.push(modules[8]);
  }
  if (modules[7]) {
    ordered.push(modules[7]);
  }

  return ordered;
}

function buildExitMetadata(
  modules: readonly FocusDisplayModule[],
  compact: boolean,
) {
  const columnCount = compact ? Math.ceil(modules.length / COMPACT_ROWS) : VISIBLE_COLUMNS;
  const leftColumn = 0;
  const rightColumn = columnCount - 1;

  const grouped = new Map<number, Array<{ id: string; order: number }>>();

  modules.forEach((module, index) => {
    const column = compact ? Math.floor(index / COMPACT_ROWS) : index % VISIBLE_COLUMNS;
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
        compact ? Math.floor(index / COMPACT_ROWS) : index % VISIBLE_COLUMNS,
      ]),
    ) as Record<string, number>,
    exitRanksById: Object.fromEntries(
      exitOrder.map((item, index) => [item.id, index]),
    ) as Record<string, number>,
  };
}

function computeLayoutMetrics(width: number, height: number): LayoutMetrics {
  if (width <= 0 || height <= 0) {
    const fallbackCell = GRID_UNIT * 4;
    return {
      compact: false,
      cellSize: fallbackCell,
      totalColumns: VISIBLE_COLUMNS,
      totalRows: FULL_ROWS,
      contentWidth: fallbackCell * VISIBLE_COLUMNS,
      contentHeight: fallbackCell * FULL_ROWS,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const compact = height < COMPACT_HEIGHT_THRESHOLD;
  const visibleRows = compact ? COMPACT_ROWS : FULL_ROWS;
  const maxCellSize = Math.min(width / VISIBLE_COLUMNS, height / visibleRows);
  const snappedCellSize = Math.max(
    GRID_UNIT * 2,
    Math.floor(maxCellSize / GRID_UNIT) * GRID_UNIT,
  );
  const cellSize = snappedCellSize > 0 ? snappedCellSize : Math.max(96, Math.floor(maxCellSize));
  const totalColumns = compact ? Math.ceil(focusModules.length / COMPACT_ROWS) : VISIBLE_COLUMNS;
  const totalRows = compact ? COMPACT_ROWS : FULL_ROWS;
  const visibleWidth = cellSize * VISIBLE_COLUMNS;
  const visibleHeight = cellSize * visibleRows;
  const contentWidth = cellSize * totalColumns;
  const contentHeight = cellSize * totalRows;
  const offsetX = compact
    ? 0
    : Math.max(
        0,
        Math.floor(Math.max(0, width - visibleWidth) / 2 / GRID_UNIT) * GRID_UNIT,
      );
  const offsetY = Math.max(
    0,
    Math.floor(Math.max(0, height - visibleHeight) / 2 / GRID_UNIT) * GRID_UNIT,
  );

  return {
    compact,
    cellSize,
    totalColumns,
    totalRows,
    contentWidth,
    contentHeight,
    offsetX,
    offsetY,
  };
}

function cellularDiffusionOffset(time: number, seed: number, axis: "x" | "y") {
  const t = time * 0.00035;
  const phase = seed * Math.PI * 2;
  const lane = axis === "x" ? 0.78 : 1.06;
  const neighbor = axis === "x" ? 1.43 : 1.21;
  const waveA = Math.sin(t * lane + phase);
  const waveB = Math.cos(t * neighbor - phase * 0.72);
  const coupled = Math.sin((waveA + waveB) * 1.35 + t * 0.58);
  const diffusion = Math.cos(t * 0.42 + phase * 1.7 + coupled * 1.15);

  return (waveA * 0.34 + waveB * 0.24 + coupled * 0.26 + diffusion * 0.16);
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
  const time = useTime();
  const x = useTransform(() => {
    const organicX = cellularDiffusionOffset(time.get(), seed, "x") * 12;
    return driftX.get() + organicX;
  });
  const y = useTransform(() => {
    const organicY = cellularDiffusionOffset(time.get(), seed + 0.173, "y") * 14;
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
  const exitStart = 0.03 + exitRank * 0.028;
  const exitMid = exitStart + 0.065;
  const exitEnd = exitStart + 0.14;
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

  const opacity = useTransform(progress, [0, exitStart, exitMid, exitEnd], [1, 1, 0.45, 0]);
  const x = useTransform(progress, [0, exitStart, exitEnd], [0, 0, travel]);
  const y = useTransform(
    progress,
    [0, exitStart, exitEnd],
    [0, 0, (driftSeed - 0.5) * 26],
  );
  const blur = useTransform(progress, [0, exitStart, exitEnd], [0, 0, 12]);
  const filter = useTransform(blur, (value) => `blur(${value.toFixed(2)}px)`);

  return (
    <motion.article
      style={{ x, y, opacity, filter }}
      className={cn(
        "relative flex h-full min-h-0 flex-col justify-between border border-black/12 p-4 md:p-5 lg:p-6",
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

      <div>
        <div
          className={cn(
            "label mb-3",
            isDark ? "text-white/56" : "text-black/52",
          )}
        >
          {tag}
        </div>
        <h3 className="display max-w-[10ch] text-[clamp(1.18rem,1.72vw,2.18rem)] leading-[0.94]">
          {title}
        </h3>
        <p
          className={cn(
            "mt-3 max-w-[26rem] text-[10px] leading-[1.45] md:text-[11px]",
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
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
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

    const updateBounds = () => {
      setBounds({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    const observer = new ResizeObserver(() => updateBounds());
    observer.observe(element);
    updateBounds();

    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => computeLayoutMetrics(bounds.width, bounds.height),
    [bounds.height, bounds.width],
  );

  const randomizedModules = useMemo(() => buildRandomizedModules(seed), [seed]);
  const modules = useMemo(
    () => (layout.compact ? reorderCompactModules(randomizedModules) : randomizedModules),
    [layout.compact, randomizedModules],
  );
  const exitMetadata = useMemo(
    () => buildExitMetadata(modules, layout.compact),
    [layout.compact, modules],
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
      className="relative h-full overflow-visible"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ width: layout.compact ? layout.contentWidth : "100%" }}
    >
      <div
        className="absolute left-0 top-0 transition-[width,height,left,top] duration-300 ease-out"
        style={{
          left: layout.offsetX,
          top: layout.offsetY,
          width: layout.contentWidth,
          height: layout.contentHeight,
        }}
      >
        <div
          className="grid h-full w-full gap-2 bg-transparent transition-[grid-template-columns,grid-template-rows] duration-300 ease-out md:gap-3"
          style={
            layout.compact
              ? {
                  gridTemplateRows: `repeat(${COMPACT_ROWS}, minmax(0, ${layout.cellSize}px))`,
                  gridAutoFlow: "column",
                  gridAutoColumns: `${layout.cellSize}px`,
                }
              : {
                  gridTemplateColumns: `repeat(${VISIBLE_COLUMNS}, minmax(0, ${layout.cellSize}px))`,
                  gridTemplateRows: `repeat(${FULL_ROWS}, minmax(0, ${layout.cellSize}px))`,
                }
          }
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
    </div>
  );
}
