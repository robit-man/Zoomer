export type TileTone = "dark" | "light" | "lime" | "blue" | "pink";
export type Stage = "intake" | "refinement" | "readiness" | "production";
export type EdgeKind = "flow" | "loop" | "loop-return";

export type FlowNodeDef = {
  id: string;
  stage: Stage;
  label: string;
  title: string;
  detail: string;
  tone: TileTone;
  w: number;
  h: number;
};

export type EdgeDef = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
};

export const NODES: FlowNodeDef[] = [
  { id: "intake", stage: "intake", label: "00 · INTAKE", title: "Project intake", tone: "dark", w: 258, h: 184,
    detail: "Constraints, outcomes, stakeholders, budget. Start by understanding what is actually being asked — and what is not." },
  { id: "r1", stage: "refinement", label: "R1 · DISCOVER", title: "Discovery", tone: "light", w: 220, h: 150,
    detail: "Map the territory — users, data, existing systems, failure modes worth caring about." },
  { id: "r2", stage: "refinement", label: "R2 · PROTOTYPE", title: "Prototype", tone: "lime", w: 220, h: 150,
    detail: "Smallest runnable artifact that teaches us what to build next without pretending to be the product." },
  { id: "r3", stage: "refinement", label: "R3 · REVIEW", title: "Review + adjust", tone: "blue", w: 220, h: 150,
    detail: "Test with reality. Keep what works, cut what does not, loop back, tighten the scope." },
  { id: "p1", stage: "readiness", label: "P1 · HARDEN", title: "Hardening", tone: "dark", w: 262, h: 168,
    detail: "Security review, error budgets, stress tests, data integrity, dependency audit." },
  { id: "p2", stage: "readiness", label: "P2 · REHEARSE", title: "Deploy rehearsal", tone: "light", w: 262, h: 168,
    detail: "Staging parity, rollback drills, observability wired, on-call playbook signed off." },
  { id: "p3", stage: "readiness", label: "P3 · QA PASS", title: "QA pass", tone: "pink", w: 262, h: 168,
    detail: "Regression, accessibility, performance budgets, a human walk-through of every path." },
  { id: "p4", stage: "readiness", label: "P4 · RUNBOOK", title: "Runbook + handoff", tone: "blue", w: 262, h: 168,
    detail: "Operational docs, alerting, escalation paths, ownership, and the first week of life post-launch." },
  { id: "ship", stage: "production", label: "SHIP", title: "Production", tone: "lime", w: 258, h: 184,
    detail: "Live. Monitored. Owned. With a clear path straight back into intake for the next iteration." },
];

export const EDGES: EdgeDef[] = [
  { id: "e-intake-r1", from: "intake", to: "r1", kind: "flow" },
  { id: "e-r1-r2", from: "r1", to: "r2", kind: "loop" },
  { id: "e-r2-r3", from: "r2", to: "r3", kind: "loop" },
  { id: "e-r3-r1", from: "r3", to: "r1", kind: "loop-return" },
  { id: "e-r3-p1", from: "r3", to: "p1", kind: "flow" },
  { id: "e-p1-p2", from: "p1", to: "p2", kind: "loop" },
  { id: "e-p2-p3", from: "p2", to: "p3", kind: "loop" },
  { id: "e-p3-p4", from: "p3", to: "p4", kind: "loop" },
  { id: "e-p4-p1", from: "p4", to: "p1", kind: "loop-return" },
  { id: "e-p4-ship", from: "p4", to: "ship", kind: "flow" },
];

export const STAGE_ORDER: Stage[] = ["intake", "refinement", "readiness", "production"];

const STAGE_GAP_X = 78;
const STAGE_PAD_X = 10;
const NODE_GAP_Y = 18;
const ROW_GAP_Y = 74;
const CANVAS_PAD_X = 24;
const CANVAS_PAD_TOP = 16;
const CANVAS_PAD_BOT = 28;

export type Layout = {
  homes: Map<string, { x: number; y: number }>;
  totalH: number;
};

export function computeLayout(containerW: number): Layout {
  const groups: Record<Stage, FlowNodeDef[]> = {
    intake: [], refinement: [], readiness: [], production: [],
  };
  for (const n of NODES) groups[n.stage].push(n);

  const widths = {} as Record<Stage, number>;
  const heights = {} as Record<Stage, number>;
  for (const s of STAGE_ORDER) {
    widths[s] = Math.max(...groups[s].map((n) => n.w)) + STAGE_PAD_X * 2;
    heights[s] = groups[s].reduce((acc, n, i) => acc + n.h + (i ? NODE_GAP_Y : 0), 0);
  }

  const availW = Math.max(280, containerW - CANVAS_PAD_X * 2);
  const fits = (per: number) => {
    for (let i = 0; i < STAGE_ORDER.length; i += per) {
      const row = STAGE_ORDER.slice(i, i + per);
      const w = row.reduce((a, s) => a + widths[s], 0) + STAGE_GAP_X * (row.length - 1);
      if (w > availW) return false;
    }
    return true;
  };
  let perRow = STAGE_ORDER.length;
  while (perRow > 1 && !fits(perRow)) perRow -= 1;

  const rows: Stage[][] = [];
  for (let i = 0; i < STAGE_ORDER.length; i += perRow) {
    rows.push(STAGE_ORDER.slice(i, i + perRow));
  }

  const homes = new Map<string, { x: number; y: number }>();
  let yCursor = CANVAS_PAD_TOP;
  for (const row of rows) {
    const rowW = row.reduce((a, s) => a + widths[s], 0) + STAGE_GAP_X * (row.length - 1);
    const rowH = Math.max(...row.map((s) => heights[s]));
    // Bias the flow slightly left of center so the rightmost stage has more
    // breathing room for its arrow-out and any drag headroom.
    const extraSpace = Math.max(0, containerW - rowW);
    const xStart = Math.max(CANVAS_PAD_X, extraSpace * 0.32);
    let xCursor = xStart;
    for (const stage of row) {
      const list = groups[stage];
      const colW = widths[stage];
      const colH = heights[stage];
      const colCenterX = xCursor + colW / 2;
      let ny = yCursor + (rowH - colH) / 2;
      for (const n of list) {
        homes.set(n.id, { x: colCenterX - n.w / 2, y: ny });
        ny += n.h + NODE_GAP_Y;
      }
      xCursor += colW + STAGE_GAP_X;
    }
    yCursor += rowH + ROW_GAP_Y;
  }
  return { homes, totalH: yCursor - ROW_GAP_Y + CANVAS_PAD_BOT };
}

export type NodeRuntime = {
  def: FlowNodeDef;
  x: number; y: number;
  vx: number; vy: number;
  homeX: number; homeY: number;
  dragging: boolean;
  dragOffX: number; dragOffY: number;
  initialized: boolean;
};

export function buildPath(a: NodeRuntime, b: NodeRuntime, kind: EdgeKind): string {
  if (kind === "flow") {
    const sx = a.x + a.def.w;
    const sy = a.y + a.def.h / 2;
    const ex = b.x;
    const ey = b.y + b.def.h / 2;
    if (ex - sx > 6) {
      const mid = (sx + ex) / 2;
      return `M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ey}, ${ex} ${ey}`;
    }
    const sx2 = a.x + a.def.w / 2;
    const sy2 = a.y + a.def.h;
    const ex2 = b.x + b.def.w / 2;
    const ey2 = b.y;
    const bendY = Math.max(sy2, ey2) + 56;
    return `M ${sx2} ${sy2} C ${sx2} ${bendY}, ${ex2} ${bendY}, ${ex2} ${ey2}`;
  }
  if (kind === "loop") {
    const sx = a.x + a.def.w / 2;
    const sy = a.y + a.def.h;
    const ex = b.x + b.def.w / 2;
    const ey = b.y;
    if (ey - sy > 2) {
      const midY = (sy + ey) / 2;
      return `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`;
    }
    const ax = a.x + a.def.w;
    const ay = a.y + a.def.h / 2;
    const bx = b.x;
    const by = b.y + b.def.h / 2;
    const mid = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${mid} ${ay}, ${mid} ${by}, ${bx} ${by}`;
  }
  // loop-return: arc out the left side from bottom node back up to top node
  const sx = a.x;
  const sy = a.y + a.def.h / 2;
  const ex = b.x;
  const ey = b.y + b.def.h / 2;
  const bendX = Math.max(6, Math.min(sx, ex) - 52);
  return `M ${sx} ${sy} C ${bendX} ${sy}, ${bendX} ${ey}, ${ex} ${ey}`;
}

export function createNodeRuntimes(): NodeRuntime[] {
  return NODES.map((def) => ({
    def,
    x: 0, y: 0, vx: 0, vy: 0, homeX: 0, homeY: 0,
    dragging: false, dragOffX: 0, dragOffY: 0, initialized: false,
  }));
}
