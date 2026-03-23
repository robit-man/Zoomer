"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/components/ui/cn";
import { BlockRevealText } from "@/components/ui/BlockRevealText";
import { RevealPanel } from "@/components/ui/RevealPanel";

const EggScene = lazy(() => import("@/components/EggScene"));

type ExpandPhase = "idle" | "dismissing" | "expanded" | "restoring";

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
    .sort((a, b) => a[0] - b[0])
    .flatMap(([, items]) => [...items].sort((a, b) => a.order - b.order))
    .sort((a, b) => a.order - b.order);

  const exitOrder = [...leftGroup, ...middleGroup, ...rightGroup];

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
  expandedId,
  expandPhase,
  id,
  onSelect,
  parallaxX,
  parallaxY,
  progress,
  tag,
  title,
  tone,
  visualColumn,
}: FocusDisplayModule & {
  exitRank: number;
  expandedId: string | null;
  expandPhase: ExpandPhase;
  onSelect: (id: string) => void;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  progress: MotionValue<number>;
  visualColumn: number;
}) {
  const driftSeed = seededValue(id);
  const exitStart = 0.18 + exitRank * 0.018;
  const exitMid = exitStart + 0.05;
  const exitEnd = exitStart + 0.11;
  const travel = -(90 + visualColumn * 18 + driftSeed * 34);
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
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const titleMeasureRef = useRef<HTMLSpanElement | null>(null);
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
  const accentStroke = "#ffae00";

  const isSelected = expandedId === id;
  const isOtherDismissing = expandedId !== null && !isSelected && (expandPhase === "dismissing" || expandPhase === "expanded");
  const isRestoring = expandPhase === "restoring" && !isSelected;
  const isHiddenByExpand = expandPhase === "expanded" && !isSelected;
  const dismissDelay = seededValue(`dismiss-${id}`) * 0.22;

  const opacity = useTransform(progress, [0, exitStart, exitMid, exitEnd], [1, 1, 0.45, 0]);
  const x = useTransform(progress, [0, exitStart, exitEnd], [0, 0, travel]);
  const y = useTransform(
    progress,
    [0, exitStart, exitEnd],
    [0, 0, (driftSeed - 0.5) * 26],
  );
  const blur = useTransform(progress, [0, exitStart, exitEnd], [0, 0, 12]);
  const filter = useTransform(blur, (value) => `blur(${value.toFixed(2)}px)`);

  useLayoutEffect(() => {
    const tile = tileRef.current;
    const titleElement = titleRef.current;
    const titleMeasureElement = titleMeasureRef.current ?? titleElement;

    if (!tile || !titleElement || !titleMeasureElement) {
      return;
    }

    const measurePath = () => {
      const tileRect = tile.getBoundingClientRect();
      const titleRects = Array.from(titleMeasureElement.getClientRects());
      const titleRect =
        titleRects[titleRects.length - 1] ?? titleMeasureElement.getBoundingClientRect();
      const titleFullRect = titleElement.getBoundingClientRect();
      const width = tile.clientWidth;
      const height = tile.clientHeight;
      const tileStyles = window.getComputedStyle(tile);
      const paddingTop = Number.parseFloat(tileStyles.paddingTop) || 0;
      const paddingRight = Number.parseFloat(tileStyles.paddingRight) || 0;

      if (width <= 0 || height <= 0) {
        return;
      }

      const startX = Math.min(width - 1, Math.max(1, width - paddingRight));
      const startY = Math.min(height - 1, Math.max(1, paddingTop + 5));
      const stemX = Math.max(1, startX - 2);
      const titleRight = Math.min(width - 2, Math.max(2, titleRect.right - tileRect.left));
      const titleLeft = Math.min(
        width - 2,
        Math.max(2, titleRect.left - tileRect.left),
      );
      const titleLineHeight = Math.max(1, titleRect.height);
      const titleElementBottom = titleFullRect.bottom - tileRect.top;
      const underlineY = Math.min(
        height - 2,
        Math.max(startY + 2, titleElementBottom + 24),
      );
      const availableDiagonalRun = Math.max(4, stemX - titleRight - Math.max(4, titleLineHeight * 0.18));
      const bendReach = Math.max(
        5,
        Math.min(
          Math.max(8, titleLineHeight * 0.42),
          underlineY - startY - 2,
          availableDiagonalRun,
        ),
      );
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
    if (titleMeasureElement !== titleElement) {
      observer.observe(titleMeasureElement);
    }

    measurePath();
    window.addEventListener("resize", measurePath);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measurePath);
    };
  }, [title]);

  return (
    <RevealPanel delay={exitRank * 60} className={cn("min-h-0", isHiddenByExpand && "invisible")}>
    <motion.article
      ref={tileRef}
      style={expandPhase === "idle" || expandPhase === "restoring" ? { x, y, opacity, filter } : undefined}
      animate={
        isOtherDismissing
          ? { opacity: 0, scale: 0.86, filter: "blur(4px)" }
          : isRestoring
            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
            : isSelected && expandPhase === "dismissing"
              ? { opacity: 1, scale: 1 }
              : {}
      }
      transition={
        isOtherDismissing
          ? { delay: dismissDelay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }
          : isRestoring
            ? { delay: dismissDelay + 0.1, duration: 0.38, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0.3 }
      }
      onClick={() => {
        if (expandPhase === "idle") onSelect(id);
      }}
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
        "flag-indent-y relative flex h-full min-h-0 select-none flex-col justify-between overflow-hidden border border-black/12 p-4 md:p-5 lg:p-6",
        expandPhase === "idle" && "cursor-pointer",
        isSelected && expandPhase === "expanded" && "invisible",
        tone === "dark" && "border-black/55 bg-[var(--graphite)] text-[var(--paper)]",
        tone === "lime" && "border-black/15 bg-[#4a4744] text-[var(--paper)]",
        tone === "light" && "bg-[rgba(252,251,247,0.94)] text-[var(--ink)]",
        tone === "blue" && "border-black/15 bg-[var(--grey-mid)] text-[var(--paper)]",
        tone === "pink" && "border-black/15 bg-[var(--grey-deep)] text-[var(--paper)]",
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
            isDark ? "text-white/64" : "text-black/45",
          )}
        >
          <BlockRevealText depth={0} delay={exitRank * 100}>{id}</BlockRevealText>
        </div>
        <div className="h-[10px] w-[72px] bg-[#ffae00]" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col ">
          <div
            className={cn(
              "label mb-3 text-left",
              isDark ? "text-white/70" : "text-black/52",
            )}
          >
            <BlockRevealText depth={1} delay={exitRank * 100}>{tag}</BlockRevealText>
          </div>
          <h3
            ref={titleRef}
            className="display relative ml-auto max-w-[14ch] text-right text-[clamp(1.18rem,1.72vw,2rem)] leading-[0.94]"
          >
            <span ref={titleMeasureRef} aria-hidden className="invisible mr-3 mb-1">
              {title}
            </span>
            <span className="pointer-events-none absolute inset-0 mr-3 mb-1 block">
              <BlockRevealText depth={2} delay={exitRank * 100}>{title}</BlockRevealText>
            </span>
          </h3>
        </div>
        <p
          className={cn(
            "max-w-[26rem] text-[10px] leading-[1.45] md:text-[11px]",
            isDark ? "text-white/85" : "text-black/70",
          )}
        >
          <BlockRevealText depth={3} delay={exitRank * 100}>{detail}</BlockRevealText>
        </p>
      </div>
    </motion.article>
    </RevealPanel>
  );
}

function ExpandedPanel({
  module,
  onClose,
  containerWidth,
  containerHeight,
  tileSize,
}: {
  module: FocusDisplayModule;
  onClose: () => void;
  containerWidth: number;
  containerHeight: number;
  tileSize: number;
}) {
  // Opening: step 0 (width expand) → 1 (height expand, fully open)
  // Closing: step 2 (height shrink) → 3 (width shrink + fade) → onClose()
  const [step, setStep] = useState(0);
  const isDark = module.tone === "dark" || module.tone === "lime" || module.tone === "blue" || module.tone === "pink";

  const getAnimateTarget = () => {
    switch (step) {
      case 0: return { width: containerWidth, height: tileSize, opacity: 1 };
      case 1: return { width: containerWidth, height: containerHeight, opacity: 1 };
      case 2: return { width: containerWidth, height: tileSize, opacity: 1 };
      case 3: return { width: tileSize, height: tileSize, opacity: 0 };
      default: return {};
    }
  };

  return (
    <motion.div
      className={cn(
        "absolute z-30 flex flex-col overflow-hidden border border-black/12",
        module.tone === "dark" && "border-black/55 bg-[var(--graphite)] text-[var(--paper)]",
        module.tone === "lime" && "border-black/15 bg-[#4a4744] text-[var(--paper)]",
        module.tone === "light" && "bg-[rgba(252,251,247,0.94)] text-[var(--ink)]",
        module.tone === "blue" && "border-black/15 bg-[var(--grey-mid)] text-[var(--paper)]",
        module.tone === "pink" && "border-black/15 bg-[var(--grey-deep)] text-[var(--paper)]",
      )}
      style={{
        left: "50%",
        top: "50%",
        x: "-50%",
        y: "-50%",
      }}
      initial={{ width: tileSize, height: tileSize, opacity: 1 }}
      animate={getAnimateTarget()}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (step === 0) setStep(1);
        else if (step === 2) setStep(3);
        else if (step === 3) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-current/10 px-5 py-4">
        <div className="flex items-center gap-4">
          <span className={cn("label", isDark ? "text-white/64" : "text-black/45")}>{module.id}</span>
          <span className={cn("label", isDark ? "text-white/70" : "text-black/52")}>{module.tag}</span>
        </div>
        <button
          type="button"
          onClick={() => { if (step === 1) setStep(2); }}
          className={cn(
            "label cursor-pointer px-3 py-1 transition-colors",
            isDark ? "text-white/64 hover:text-white" : "text-black/45 hover:text-black",
          )}
        >
          Close
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <h3 className="display text-[clamp(1.4rem,2.2vw,2.6rem)] leading-[0.92]">
          {module.title}
        </h3>
        <p className={cn(
          "max-w-[36rem] text-[11px] leading-[1.5] md:text-[12px]",
          isDark ? "text-white/85" : "text-black/70",
        )}>
          {module.detail}
        </p>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {step === 1 && (
            <Suspense fallback={
              <div className="flex h-full items-center justify-center">
                <div className={cn("label animate-pulse", isDark ? "text-white/40" : "text-black/30")}>
                  Loading scene...
                </div>
              </div>
            }>
              <motion.div
                className="h-full w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <EggScene />
              </motion.div>
            </Suspense>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomeSection({ progress }: { progress: MotionValue<number> }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [seed] = useState(() => createSeed());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>("idle");
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.45 });
  const parallaxY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.45 });

  const handleSelect = useCallback((id: string) => {
    if (expandPhase !== "idle") return;
    setExpandedId(id);
    setExpandPhase("dismissing");
    dismissTimerRef.current = setTimeout(() => {
      setExpandPhase("expanded");
    }, 520);
  }, [expandPhase]);

  const handleClose = useCallback(() => {
    if (expandPhase !== "expanded") return;
    setExpandPhase("restoring");
    restoreTimerRef.current = setTimeout(() => {
      setExpandedId(null);
      setExpandPhase("idle");
    }, 620);
  }, [expandPhase]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, []);

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
        className="relative grid gap-2 bg-transparent transition-[grid-template-columns,grid-template-rows] duration-300 ease-out md:gap-3"
        style={{
          gridTemplateColumns: tileSize > 0 ? `repeat(${columns}, ${tileSize}px)` : `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: tileSize > 0 ? `repeat(${rows}, ${tileSize}px)` : undefined,
        }}
      >
        {modules.map((module) => (
          <FocusTile
            key={module.id}
            exitRank={exitMetadata.exitRanksById[module.id]}
            expandedId={expandedId}
            expandPhase={expandPhase}
            onSelect={handleSelect}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
            progress={progress}
            visualColumn={exitMetadata.columnsById[module.id]}
            {...module}
          />
        ))}

        <AnimatePresence>
          {expandPhase === "expanded" && expandedId && (() => {
            const expandedModule = modules.find((m) => m.id === expandedId);
            if (!expandedModule) return null;
            const gridEl = rootRef.current?.querySelector(".grid") as HTMLElement | null;
            const gridWidth = gridEl?.clientWidth ?? containerSize.width;
            const gridHeight = gridEl?.clientHeight ?? containerSize.height;
            return (
              <ExpandedPanel
                key="expanded-panel"
                module={expandedModule}
                onClose={handleClose}
                containerWidth={gridWidth}
                containerHeight={gridHeight}
                tileSize={tileSize}
              />
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
