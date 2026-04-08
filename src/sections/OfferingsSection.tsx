"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/components/ui/cn";
import { BlockRevealText } from "@/components/ui/BlockRevealText";
import {
  NODES,
  EDGES,
  buildPath,
  computeLayout,
  createNodeRuntimes,
  type FlowNodeDef,
  type NodeRuntime,
  type TileTone,
} from "@/sections/offerings/flow";

function seededValue(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33 + value.charCodeAt(i)) % 2147483647;
  }
  return (hash % 1000) / 1000;
}

function toneClass(tone: TileTone) {
  if (tone === "dark") return "border-black/55 bg-[var(--graphite)] text-[var(--paper)]";
  if (tone === "light") return "border-black/12 bg-[rgba(252,251,247,0.94)] text-[var(--ink)]";
  if (tone === "lime") return "border-black/15 bg-[#4a4744] text-[var(--paper)]";
  if (tone === "blue") return "border-black/15 bg-[var(--grey-mid)] text-[var(--paper)]";
  return "border-black/15 bg-[var(--grey-deep)] text-[var(--paper)]";
}

const usesLightText = (tone: TileTone) => tone !== "light";

function CrosshairAccent({
  dark, driftX, driftY, seed, style,
}: {
  dark: boolean;
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  seed: number;
  style: CSSProperties;
}) {
  const driftClass =
    seed < 0.33 ? "crosshair-drift-a" : seed < 0.66 ? "crosshair-drift-b" : "crosshair-drift-c";
  const duration = 8 + seed * 12;
  return (
    <span
      className={cn("pointer-events-none absolute z-10", driftClass)}
      style={{ ...style, "--crosshair-dur": `${duration.toFixed(1)}s` } as CSSProperties}
    >
      <motion.span className="relative block h-5 w-5" style={{ x: driftX, y: driftY }}>
        <span className={cn("absolute left-1/2 top-0 h-[35%] w-px -translate-x-1/2", dark ? "bg-white/32" : "bg-black/24")} />
        <span className={cn("absolute bottom-0 left-1/2 h-[35%] w-px -translate-x-1/2", dark ? "bg-white/32" : "bg-black/24")} />
        <span className={cn("absolute left-0 top-1/2 h-px w-[35%] -translate-y-1/2", dark ? "bg-white/32" : "bg-black/24")} />
        <span className={cn("absolute right-0 top-1/2 h-px w-[35%] -translate-y-1/2", dark ? "bg-white/32" : "bg-black/24")} />
      </motion.span>
    </span>
  );
}

function FlowNodeCard({
  def, index, progress, driftX, driftY, registerRef,
  onPointerDown, onPointerMove, onPointerUp,
}: {
  def: FlowNodeDef;
  index: number;
  progress: MotionValue<number>;
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  registerRef: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const start = 0.12 + index * 0.04;
  const end = 0.58 + index * 0.04;
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const seed = seededValue(`${def.id}-${def.title}`);
  const light = usesLightText(def.tone);
  const aX = useTransform(driftX, (v) => v * (8 + seed * 8));
  const aY = useTransform(driftY, (v) => v * (10 + seed * 9));
  const bX = useTransform(driftX, (v) => v * (-10 - seed * 9));
  const bY = useTransform(driftY, (v) => v * (-8 - seed * 8));

  return (
    <div
      ref={registerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: def.w,
        height: def.h,
        touchAction: "none",
        willChange: "transform",
      }}
      className="select-none cursor-grab active:cursor-grabbing"
    >
      <motion.div style={{ opacity }} className="h-full w-full">
        <div
          className={cn(
            "relative flex h-full w-full flex-col justify-between overflow-hidden border p-4 shadow-[0_18px_44px_rgba(0,0,0,0.14)] md:p-5",
            toneClass(def.tone),
          )}
        >
          <CrosshairAccent dark={light} driftX={aX} driftY={aY} seed={seed} style={{ top: 14, right: -8 }} />
          <CrosshairAccent dark={light} driftX={bX} driftY={bY} seed={seed + 0.42} style={{ bottom: 16, left: -8 }} />
          <div className={cn("label", light ? "text-white/62" : "text-black/44")}>
            <BlockRevealText depth={0} delay={index * 80}>{def.label}</BlockRevealText>
          </div>
          <div>
            <h3 className="display max-w-[13ch] text-[clamp(1rem,1.35vw,1.55rem)] leading-[0.92]">
              <BlockRevealText depth={1} delay={index * 80}>{def.title}</BlockRevealText>
            </h3>
            <p className={cn("mt-2.5 max-w-[22rem] text-[10px] leading-[1.45] md:text-[11px]", light ? "text-white/82" : "text-black/68")}>
              <BlockRevealText depth={2} delay={index * 80}>{def.detail}</BlockRevealText>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
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

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeElsRef = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const edgeElsRef = useRef<Map<string, SVGPathElement | null>>(new Map());
  const nodesRef = useRef<NodeRuntime[]>(createNodeRuntimes());
  const panRef = useRef({
    x: 0,
    y: 0,
    panning: false,
    startPointerX: 0,
    startPointerY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const [canvasH, setCanvasH] = useState(620);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const recompute = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const { homes, totalH } = computeLayout(w);
      for (const n of nodesRef.current) {
        const home = homes.get(n.def.id);
        if (!home) continue;
        n.homeX = home.x;
        n.homeY = home.y;
        if (!n.initialized) {
          n.x = home.x;
          n.y = home.y;
          n.initialized = true;
        }
      }
      setCanvasH(totalH);
    };
    recompute();
    const obs = new ResizeObserver(recompute);
    obs.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const idMap = new Map<string, NodeRuntime>();
    for (const n of nodesRef.current) idMap.set(n.def.id, n);

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const nodes = nodesRef.current;

      // Gentle spring toward layout home — soft enough that boxes "float freely".
      const k = 4.5;
      const damp = 0.88;
      for (const n of nodes) {
        if (n.dragging) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        const dx = n.homeX - n.x;
        const dy = n.homeY - n.y;
        n.vx = (n.vx + dx * k * dt) * damp;
        n.vy = (n.vy + dy * k * dt) * damp;
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
      }

      // Pairwise AABB repulsion so neighbors make room for each other.
      const PAD = 16;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x + b.def.w / 2 - (a.x + a.def.w / 2);
          const dy = b.y + b.def.h / 2 - (a.y + a.def.h / 2);
          const halfW = (a.def.w + b.def.w) / 2 + PAD;
          const halfH = (a.def.h + b.def.h) / 2 + PAD;
          const ox = halfW - Math.abs(dx);
          const oy = halfH - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            let px = 0;
            let py = 0;
            if (ox < oy) px = dx < 0 ? ox : -ox;
            else py = dy < 0 ? oy : -oy;
            const af = !a.dragging;
            const bf = !b.dragging;
            if (af && bf) {
              a.x += px * 0.5;
              a.y += py * 0.5;
              b.x -= px * 0.5;
              b.y -= py * 0.5;
            } else if (af) {
              a.x += px;
              a.y += py;
            } else if (bf) {
              b.x -= px;
              b.y -= py;
            }
          }
        }
      }

      // Generous clamp — with pan enabled the viewport can chase nodes that
      // have been dragged far from their home positions.
      const cw = containerRef.current?.clientWidth ?? 0;
      const ch = containerRef.current?.clientHeight ?? 0;
      for (const n of nodes) {
        if (cw > 0) n.x = Math.max(-cw, Math.min(cw * 2, n.x));
        n.y = Math.max(-ch, Math.min(ch * 2, n.y));
      }

      for (const n of nodes) {
        const el = nodeElsRef.current.get(n.def.id);
        if (el) el.style.transform = `translate(${n.x.toFixed(2)}px, ${n.y.toFixed(2)}px)`;
      }
      for (const e of EDGES) {
        const pa = idMap.get(e.from);
        const pb = idMap.get(e.to);
        const path = edgeElsRef.current.get(e.id);
        if (pa && pb && path) path.setAttribute("d", buildPath(pa, pb, e.kind));
      }

      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    pointerY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };
  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const beginDrag = (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const n = nodesRef.current.find((x) => x.def.id === id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!n || !rect) return;
    const pan = panRef.current;
    n.dragging = true;
    n.dragOffX = e.clientX - rect.left - pan.x - n.x;
    n.dragOffY = e.clientY - rect.top - pan.y - n.y;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* ignored */
    }
  };
  const moveDrag = (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    const n = nodesRef.current.find((x) => x.def.id === id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!n || !rect || !n.dragging) return;
    const pan = panRef.current;
    n.x = e.clientX - rect.left - pan.x - n.dragOffX;
    n.y = e.clientY - rect.top - pan.y - n.dragOffY;
  };
  const endDrag = (id: string) => (e: ReactPointerEvent<HTMLDivElement>) => {
    const n = nodesRef.current.find((x) => x.def.id === id);
    if (!n) return;
    n.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignored */
    }
  };

  const beginPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Nodes stopPropagation on their own pointerDown and the SVG has
    // pointer-events: none, so this handler only fires on empty canvas.
    const pan = panRef.current;
    pan.panning = true;
    pan.startPointerX = e.clientX;
    pan.startPointerY = e.clientY;
    pan.startPanX = pan.x;
    pan.startPanY = pan.y;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* ignored */
    }
  };
  const movePan = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan.panning) return;
    pan.x = pan.startPanX + (e.clientX - pan.startPointerX);
    pan.y = pan.startPanY + (e.clientY - pan.startPointerY);
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${pan.x.toFixed(2)}px, ${pan.y.toFixed(2)}px)`;
    }
  };
  const endPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan.panning) return;
    pan.panning = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignored */
    }
  };

  return (
    <div
      className="w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="mx-auto w-full max-w-[96rem] px-1 md:px-2">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <div className="label text-black/42">02 · Delivery flow</div>
            <h2 className="display mt-2 text-[clamp(1.25rem,1.78vw,2.05rem)] leading-[0.9]">
              <BlockRevealText depth={0}>INTAKE → REFINE → HARDEN → SHIP</BlockRevealText>
            </h2>
          </div>
          <p className="max-w-[26rem] text-[10px] leading-[1.5] text-black/60 md:text-[11px]">
            <BlockRevealText depth={1}>
              Every stage is visible, draggable, and wired together with live splines. Drag a box — the neighbors make room, the flow stays intact, and stages wrap downward when space runs out.
            </BlockRevealText>
          </p>
        </header>

        <motion.div
          ref={containerRef}
          style={{ height: canvasH, opacity: entryProgress, touchAction: "none" }}
          className="relative w-full overflow-hidden border border-black/10 cursor-grab active:cursor-grabbing"
          onPointerDown={beginPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          <div
            ref={contentRef}
            className="absolute inset-0"
            style={{ transform: "translate(0px, 0px)", willChange: "transform" }}
          >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <marker
                id="flow-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" fillOpacity="0.72" />
              </marker>
              <marker
                id="loop-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" fillOpacity="0.52" />
              </marker>
            </defs>
            {EDGES.map((e) => (
              <path
                key={e.id}
                ref={(el) => {
                  edgeElsRef.current.set(e.id, el);
                }}
                d=""
                fill="none"
                stroke="var(--ink)"
                strokeWidth={e.kind === "loop-return" ? 1 : 1.4}
                strokeOpacity={e.kind === "flow" ? 0.72 : e.kind === "loop" ? 0.56 : 0.4}
                strokeDasharray={e.kind === "loop-return" ? "5 4" : "8 5"}
                strokeLinecap="round"
                className="marching-ants"
                markerEnd={e.kind === "flow" ? "url(#flow-arrow)" : "url(#loop-arrow)"}
              />
            ))}
          </svg>

          {NODES.map((def, i) => (
            <FlowNodeCard
              key={def.id}
              def={def}
              index={i}
              progress={entryProgress}
              driftX={driftX}
              driftY={driftY}
              registerRef={(el) => {
                nodeElsRef.current.set(def.id, el);
              }}
              onPointerDown={beginDrag(def.id)}
              onPointerMove={moveDrag(def.id)}
              onPointerUp={endDrag(def.id)}
            />
          ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
