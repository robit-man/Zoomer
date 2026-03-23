"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Stable 0-1 hash from string content, used to jitter delays between siblings. */
function stableHash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 1000) / 1000;
}

export function BlockRevealText({
  children: text,
  depth = 0,
  delay = 0,
  depthDelay = 250,
  typeDuration = 800,
  revealDuration = 1200,
  jitter = 150,
}: {
  children: string;
  /** Nesting depth — deeper elements start later. */
  depth?: number;
  /** Extra delay in ms added before any animation starts (use for tile-level stagger). */
  delay?: number;
  /** Ms added per depth level. */
  depthDelay?: number;
  /** Duration of the block-typing phase. */
  typeDuration?: number;
  /** Duration of the character-reveal phase. */
  revealDuration?: number;
  /** Max random jitter in ms, seeded by text content for stable variation. */
  jitter?: number;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const count = chars.length;

  // typed = how many chars are visible as blocks, revealed = how many show real text
  const [typed, setTyped] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);

  const ref = useRef<HTMLSpanElement>(null);
  const animating = useRef(false);

  useEffect(() => {
    if (count === 0 || animating.current) return;

    const el = ref.current;
    if (!el) return;

    let delayId: ReturnType<typeof setTimeout>;
    let rafId: number;
    const totalDelay = delay + depth * depthDelay + stableHash(text) * jitter;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animating.current) return;
        animating.current = true;
        observer.disconnect();

        delayId = setTimeout(() => {
          const t0 = performance.now();

          const tick = (now: number) => {
            const elapsed = now - t0;

            if (elapsed < typeDuration) {
              const n = Math.min(count, Math.ceil((elapsed / typeDuration) * count));
              setTyped(n);
            } else {
              setTyped(count);
              const revealElapsed = elapsed - typeDuration;
              if (revealElapsed < revealDuration) {
                const n = Math.min(
                  count,
                  Math.ceil((revealElapsed / revealDuration) * count),
                );
                setRevealed(n);
              } else {
                setRevealed(count);
                setDone(true);
                return;
              }
            }
            rafId = requestAnimationFrame(tick);
          };

          rafId = requestAnimationFrame(tick);
        }, totalDelay);
      },
      { threshold: 0 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(delayId);
      cancelAnimationFrame(rafId);
      // Allow re-setup if effect re-runs (e.g. React strict mode double-invocation)
      animating.current = false;
    };
  }, [text, depth, delay, depthDelay, typeDuration, revealDuration, jitter, count]);

  return (
    <span ref={ref}>
      {count === 0
        ? "\u00A0"
        : chars.map((char, i) => (
            <span
              key={i}
              style={
                done || i < revealed
                  ? undefined
                  : i < typed
                    ? { backgroundColor: "currentColor", WebkitTextFillColor: "transparent" }
                    : { opacity: 0 }
              }
            >
              {char}
            </span>
          ))}
    </span>
  );
}
