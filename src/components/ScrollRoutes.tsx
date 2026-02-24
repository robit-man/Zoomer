"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import HomeSection from "@/sections/HomeSection";
import OfferingsSection from "@/sections/OfferingsSection";
import ContactSection from "@/sections/ContactSection";
import { cn } from "@/components/ui/cn";

type SectionKey = "home" | "offerings" | "contact";
type SectionMetricMap = Record<SectionKey, number>;

const sectionOrder: SectionKey[] = ["home", "offerings", "contact"];

const zeroMetrics: SectionMetricMap = {
  home: 0,
  offerings: 0,
  contact: 0,
};

const sectionIndex: Record<SectionKey, number> = {
  home: 0,
  offerings: 1,
  contact: 2,
};

const sections: Record<
  SectionKey,
  { label: string; path: string; timelinePosition: number }
> = {
  home: { label: "Home", path: "/", timelinePosition: 0 },
  offerings: { label: "Offerings", path: "/offerings", timelinePosition: 0.52 },
  contact: { label: "Contact", path: "/contact", timelinePosition: 1 },
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sectionFromProgress(value: number): SectionKey {
  if (value < 0.36) {
    return "home";
  }
  if (value < 0.78) {
    return "offerings";
  }
  return "contact";
}

function metricsDiffer(
  current: SectionMetricMap,
  next: SectionMetricMap,
  epsilon = 0.5,
) {
  return sectionOrder.some((key) => Math.abs(current[key] - next[key]) > epsilon);
}

export default function ScrollRoutes({ initial }: { initial: SectionKey }) {
  const initialPosition = sections[initial].timelinePosition;
  const progress = useMotionValue(initialPosition);
  const [targetProgress, setTargetProgress] = useState(initialPosition);
  const [activeKey, setActiveKey] = useState<SectionKey>(initial);
  const activeRef = useRef<SectionKey>(initial);

  const [sectionOverflow, setSectionOverflow] =
    useState<SectionMetricMap>(zeroMetrics);
  const [sectionOffsets, setSectionOffsets] =
    useState<SectionMetricMap>(zeroMetrics);

  const overflowRef = useRef<SectionMetricMap>(zeroMetrics);
  const offsetsRef = useRef<SectionMetricMap>(zeroMetrics);

  const viewportRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    home: null,
    offerings: null,
    contact: null,
  });
  const contentRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    home: null,
    offerings: null,
    contact: null,
  });

  useEffect(() => {
    const controls = animate(progress, targetProgress, {
      type: "spring",
      stiffness: 120,
      damping: 28,
      mass: 0.9,
    });
    return () => controls.stop();
  }, [progress, targetProgress]);

  useEffect(() => {
    overflowRef.current = sectionOverflow;
  }, [sectionOverflow]);

  useEffect(() => {
    offsetsRef.current = sectionOffsets;
  }, [sectionOffsets]);

  useEffect(() => {
    const measureOverflow = () => {
      const nextOverflow: SectionMetricMap = { ...overflowRef.current };

      for (const key of sectionOrder) {
        const viewport = viewportRefs.current[key];
        const content = contentRefs.current[key];
        if (!viewport || !content) {
          continue;
        }

        const viewportHeight = viewport.clientHeight;
        const contentHeight = content.scrollHeight;
        nextOverflow[key] = Math.max(0, contentHeight - viewportHeight);
      }

      if (metricsDiffer(overflowRef.current, nextOverflow)) {
        overflowRef.current = nextOverflow;
        setSectionOverflow(nextOverflow);
      }

      const clampedOffsets: SectionMetricMap = { ...offsetsRef.current };
      let offsetsChanged = false;

      for (const key of sectionOrder) {
        const maxOffset = nextOverflow[key];
        if (clampedOffsets[key] > maxOffset) {
          clampedOffsets[key] = maxOffset;
          offsetsChanged = true;
        }
      }

      if (offsetsChanged) {
        offsetsRef.current = clampedOffsets;
        setSectionOffsets(clampedOffsets);
      }
    };

    const observer = new ResizeObserver(() => measureOverflow());
    for (const key of sectionOrder) {
      const viewport = viewportRefs.current[key];
      const content = contentRefs.current[key];
      if (viewport) {
        observer.observe(viewport);
      }
      if (content) {
        observer.observe(content);
      }
    }

    window.addEventListener("resize", measureOverflow);
    measureOverflow();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureOverflow);
    };
  }, []);

  const applyDirectionalInput = useCallback(
    (timelineDelta: number, intraDelta: number) => {
      if (timelineDelta === 0) {
        return;
      }

      setTargetProgress((previous) => {
        const direction = Math.sign(timelineDelta);
        if (direction === 0) {
          return previous;
        }

        const sectionKey = sectionFromProgress(previous);
        const anchor = sections[sectionKey].timelinePosition;
        const maxOffset = overflowRef.current[sectionKey];

        if (maxOffset > 1) {
          const offsetStep = Math.abs(intraDelta) * 0.92;
          const currentOffset = offsetsRef.current[sectionKey];

          if (direction > 0) {
            if (previous < anchor) {
              return clamp01(Math.min(anchor, previous + timelineDelta));
            }

            const nextOffset = Math.min(maxOffset, currentOffset + offsetStep);
            if (nextOffset > currentOffset + 0.1) {
              const nextOffsets = {
                ...offsetsRef.current,
                [sectionKey]: nextOffset,
              };
              offsetsRef.current = nextOffsets;
              setSectionOffsets(nextOffsets);
              return anchor;
            }
          }

          if (direction < 0) {
            if (previous > anchor) {
              return clamp01(Math.max(anchor, previous + timelineDelta));
            }

            const nextOffset = Math.max(0, currentOffset - offsetStep);
            if (nextOffset < currentOffset - 0.1) {
              const nextOffsets = {
                ...offsetsRef.current,
                [sectionKey]: nextOffset,
              };
              offsetsRef.current = nextOffsets;
              setSectionOffsets(nextOffsets);
              return anchor;
            }
          }
        }

        return clamp01(previous + timelineDelta);
      });
    },
    [],
  );

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyDirectionalInput(event.deltaY * 0.00045, event.deltaY);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        applyDirectionalInput(0.08, 120);
      }
      if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        applyDirectionalInput(-0.08, -120);
      }
    };

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [applyDirectionalInput]);

  useMotionValueEvent(progress, "change", (value) => {
    const nextKey = sectionFromProgress(value);
    if (nextKey === activeRef.current) {
      return;
    }

    const previousKey = activeRef.current;
    const movingDown = sectionIndex[nextKey] > sectionIndex[previousKey];
    const sectionEdgeOffset = movingDown ? 0 : overflowRef.current[nextKey];

    if (Math.abs(offsetsRef.current[nextKey] - sectionEdgeOffset) > 0.5) {
      const nextOffsets = {
        ...offsetsRef.current,
        [nextKey]: sectionEdgeOffset,
      };
      offsetsRef.current = nextOffsets;
      setSectionOffsets(nextOffsets);
    }

    activeRef.current = nextKey;
    setActiveKey(nextKey);
    window.history.replaceState(null, "", sections[nextKey].path);
  });

  const goToSection = (key: SectionKey) => {
    activeRef.current = key;
    setActiveKey(key);
    const nextOffsets = {
      ...offsetsRef.current,
      [key]: 0,
    };
    offsetsRef.current = nextOffsets;
    setSectionOffsets(nextOffsets);
    setTargetProgress(sections[key].timelinePosition);
    window.history.replaceState(null, "", sections[key].path);
  };

  const homeX = useTransform(progress, [0, 0.34], [0, 380]);
  const homeOpacity = useTransform(progress, [0, 0.2, 0.36], [1, 1, 0]);
  const offeringsOpacity = useTransform(
    progress,
    [0.3, 0.44, 0.66, 0.8],
    [0, 1, 1, 0],
  );
  const offeringsX = useTransform(
    progress,
    [0.3, 0.44, 0.66, 0.74, 0.8],
    [28, 0, 0, 172, 246],
  );
  const offeringsY = useTransform(progress, [0.66, 0.73, 0.8], [0, -20, 12]);
  const offeringsRotate = useTransform(
    progress,
    [0.66, 0.73, 0.8],
    [0, 3.5, -6],
  );
  const contactX = useTransform(progress, [0.74, 0.94], [-140, 0]);
  const contactOpacity = useTransform(progress, [0.74, 0.94], [0, 1]);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <div className="relative mx-auto h-full w-full max-w-[1120px] px-6">
        <div className="absolute right-6 top-4 z-40 flex justify-end">
          <nav className="panel panel-strong mono flex items-center gap-2 p-2">
            {(Object.keys(sections) as SectionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => goToSection(key)}
                aria-current={activeKey === key ? "page" : undefined}
                className={cn(
                  "control px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition",
                  "border border-transparent",
                  activeKey === key
                    ? "border-white/20 bg-white/10 text-white"
                    : "text-white/55 hover:border-white/15 hover:text-white/85",
                )}
              >
                {sections[key].label}
              </button>
            ))}
          </nav>
        </div>

        <motion.section
          style={{ x: homeX, opacity: homeOpacity }}
          className={cn(
            "absolute inset-0",
            activeKey === "home" ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div
            ref={(element) => {
              viewportRefs.current.home = element;
            }}
            className="h-full w-full overflow-hidden"
          >
            <motion.div
              ref={(element) => {
                contentRefs.current.home = element;
              }}
              style={{ y: -sectionOffsets.home }}
              className={cn(
                "min-h-full",
                sectionOverflow.home > 1 ? "" : "flex items-center",
              )}
            >
              <HomeSection progress={progress} />
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          style={{
            x: offeringsX,
            y: offeringsY,
            rotate: offeringsRotate,
            opacity: offeringsOpacity,
          }}
          className={cn(
            "absolute inset-0 py-16",
            activeKey === "offerings"
              ? "pointer-events-auto"
              : "pointer-events-none",
          )}
        >
          <div
            ref={(element) => {
              viewportRefs.current.offerings = element;
            }}
            className="h-full w-full overflow-hidden"
          >
            <motion.div
              ref={(element) => {
                contentRefs.current.offerings = element;
              }}
              style={{ y: -sectionOffsets.offerings }}
              className="min-h-full"
            >
              <OfferingsSection progress={progress} />
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          style={{ x: contactX, opacity: contactOpacity }}
          className={cn(
            "absolute inset-0 py-20",
            activeKey === "contact"
              ? "pointer-events-auto"
              : "pointer-events-none",
          )}
        >
          <div
            ref={(element) => {
              viewportRefs.current.contact = element;
            }}
            className="h-full w-full overflow-hidden"
          >
            <motion.div
              ref={(element) => {
                contentRefs.current.contact = element;
              }}
              style={{ y: -sectionOffsets.contact }}
              className={cn(
                "min-h-full",
                sectionOverflow.contact > 1 ? "" : "flex items-center",
              )}
            >
              <ContactSection />
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
