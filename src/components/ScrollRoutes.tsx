"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Background from "@/components/background/Background";
import ContactSection from "@/sections/ContactSection";
import HomeSection from "@/sections/HomeSection";
import OfferingsSection from "@/sections/OfferingsSection";
import { cn } from "@/components/ui/cn";

type SectionKey = "home" | "offerings" | "contact";
type SectionAxis = "x" | "y";
type SectionMetricMap = Record<SectionKey, number>;
type SectionAxisMap = Record<SectionKey, SectionAxis>;

const sectionOrder: SectionKey[] = ["home", "offerings", "contact"];

const zeroMetrics: SectionMetricMap = {
  home: 0,
  offerings: 0,
  contact: 0,
};

const zeroAxes: SectionAxisMap = {
  home: "y",
  offerings: "y",
  contact: "y",
};

const sectionIndex: Record<SectionKey, number> = {
  home: 0,
  offerings: 1,
  contact: 2,
};

const sections: Record<
  SectionKey,
  {
    counter: string;
    label: string;
    path: string;
    timelinePosition: number;
    title: string;
  }
> = {
  home: {
    counter: "01",
    label: "Focus",
    path: "/",
    timelinePosition: 0,
    title: "Focus Matrix",
  },
  offerings: {
    counter: "02",
    label: "Tiles",
    path: "/offerings",
    timelinePosition: 0.54,
    title: "Operating Lanes",
  },
  contact: {
    counter: "03",
    label: "Contact",
    path: "/contact",
    timelinePosition: 1,
    title: "Contact Window",
  },
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sectionFromProgress(value: number): SectionKey {
  if (value < 0.36) {
    return "home";
  }
  if (value < 0.82) {
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

function axesDiffer(current: SectionAxisMap, next: SectionAxisMap) {
  return sectionOrder.some((key) => current[key] !== next[key]);
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
  const [sectionAxes, setSectionAxes] = useState<SectionAxisMap>(zeroAxes);

  const overflowRef = useRef<SectionMetricMap>(zeroMetrics);
  const offsetsRef = useRef<SectionMetricMap>(zeroMetrics);
  const axesRef = useRef<SectionAxisMap>(zeroAxes);

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
      stiffness: 122,
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
    axesRef.current = sectionAxes;
  }, [sectionAxes]);

  useEffect(() => {
    const measureOverflow = () => {
      const nextOverflow: SectionMetricMap = { ...overflowRef.current };
      const nextAxes: SectionAxisMap = { ...axesRef.current };

      for (const key of sectionOrder) {
        const viewport = viewportRefs.current[key];
        const content = contentRefs.current[key];
        if (!viewport || !content) {
          continue;
        }

        const viewportHeight = viewport.clientHeight;
        const contentHeight = content.scrollHeight;
        const viewportWidth = viewport.clientWidth;
        const contentWidth = content.scrollWidth;
        const widthOverflow = Math.max(0, contentWidth - viewportWidth);
        const heightOverflow = Math.max(0, contentHeight - viewportHeight);
        const axis =
          widthOverflow > 1 && widthOverflow > heightOverflow + 0.5 ? "x" : "y";

        nextAxes[key] = axis;
        nextOverflow[key] = axis === "x" ? widthOverflow : heightOverflow;
      }

      if (metricsDiffer(overflowRef.current, nextOverflow)) {
        overflowRef.current = nextOverflow;
        setSectionOverflow(nextOverflow);
      }

      if (axesDiffer(axesRef.current, nextAxes)) {
        axesRef.current = nextAxes;
        setSectionAxes(nextAxes);
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
    let touchY = 0;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyDirectionalInput(event.deltaY * 0.00044, event.deltaY);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey)
      ) {
        event.preventDefault();
        applyDirectionalInput(0.085, 120);
      }

      if (
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey)
      ) {
        event.preventDefault();
        applyDirectionalInput(-0.085, -120);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const nextTouchY = event.touches[0]?.clientY;
      if (nextTouchY == null) {
        return;
      }

      const delta = touchY - nextTouchY;
      if (Math.abs(delta) < 4) {
        return;
      }

      event.preventDefault();
      applyDirectionalInput(delta * 0.0013, delta * 2.1);
      touchY = nextTouchY;
    };

    const handleTouchEnd = () => {
      touchY = 0;
    };

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
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

  const homeOffsetStyle =
    sectionAxes.home === "x"
      ? { x: -sectionOffsets.home }
      : { y: -sectionOffsets.home };
  const offeringsOffsetStyle =
    sectionAxes.offerings === "x"
      ? { x: -sectionOffsets.offerings }
      : { y: -sectionOffsets.offerings };
  const contactOffsetStyle =
    sectionAxes.contact === "x"
      ? { x: -sectionOffsets.contact }
      : { y: -sectionOffsets.contact };

  const homeOpacity = useTransform(progress, [0, 0.4, 0.52], [1, 1, 0]);
  const offeringsOpacity = useTransform(
    progress,
    [0.28, 0.44, 0.76, 0.86],
    [0, 1, 1, 0],
  );
  const offeringsX = useTransform(
    progress,
    [0.28, 0.44, 0.76, 0.84],
    [-140, 0, 0, 220],
  );
  const offeringsRotate = useTransform(progress, [0.62, 0.78, 0.86], [0, 1.5, -2]);
  const contactX = useTransform(progress, [0.74, 0.94], [-160, 0]);
  const contactOpacity = useTransform(progress, [0.74, 0.94], [0, 1]);

  return (
    <main className="site-shell relative h-dvh w-full overflow-hidden">
      <Background progress={progress} />
      <div className="relative z-10 mx-auto grid h-full w-full max-w-[1680px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="relative flex min-h-[240px] flex-col overflow-hidden border-b border-black/15 bg-[var(--acid)] px-5 py-5 text-[var(--ink)] md:px-6 md:py-6 lg:h-full lg:border-b-0 lg:border-r lg:border-l">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="label text-black/58">Zoomer consulting</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-black/48">
                plan / arch / make
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-8 py-6 lg:py-10">
            <div className="display text-[clamp(4.8rem,14vw,12rem)] m-auto tracking-[0.02em] lg:[writing-mode:vertical-rl] lg:rotate-180 lg:self-start">
              ZOOMER
            </div>

            <div className="max-w-[18rem] space-y-5">
              <div className="grid gap-2.5">
                {sectionOrder.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => goToSection(key)}
                    aria-current={activeKey === key ? "page" : undefined}
                    className={cn(
                      "control flex items-center justify-between border px-4 py-3 text-left transition-colors duration-200",
                      activeKey === key
                        ? "border-black bg-black text-[var(--acid)]"
                        : "border-black/14 bg-black/5 text-black/66 hover:bg-black/9",
                    )}
                  >
                    <span className="label">{sections[key].counter}</span>
                    <span className="display text-[1.45rem] leading-none">
                      {sections[key].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <div className="absolute inset-0" />

          <motion.section
            style={{ opacity: homeOpacity }}
            className={cn(
              "absolute inset-0 px-0 pb-0 pt-0",
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
                style={homeOffsetStyle}
                className={cn(
                  "h-full min-w-full",
                  sectionAxes.home === "y" && sectionOverflow.home <= 1
                    ? "flex items-center"
                    : "",
                )}
              >
                <HomeSection progress={progress} />
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            style={{ x: offeringsX, rotate: offeringsRotate, opacity: offeringsOpacity }}
            className={cn(
              "absolute inset-0 px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-8",
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
                style={offeringsOffsetStyle}
                className={cn(
                  sectionAxes.offerings === "x" ? "h-full min-w-full" : "w-full",
                  sectionAxes.offerings === "y" && sectionOverflow.offerings <= 1
                    ? "flex h-full items-center"
                    : "",
                )}
              >
                <OfferingsSection progress={progress} />
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            style={{ x: contactX, opacity: contactOpacity }}
            className={cn(
              "absolute inset-0 px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-8",
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
                style={contactOffsetStyle}
                className={cn(
                  sectionAxes.contact === "x" ? "h-full min-w-full" : "w-full",
                  sectionAxes.contact === "y" && sectionOverflow.contact <= 1
                    ? "flex h-full items-center"
                    : "",
                )}
              >
                <ContactSection />
              </motion.div>
            </div>
          </motion.section>
        </section>
      </div>
    </main>
  );
}
