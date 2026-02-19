"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import HomeSection from "@/sections/HomeSection";
import OfferingsSection from "@/sections/OfferingsSection";
import ContactSection from "@/sections/ContactSection";
import { cn } from "@/components/ui/cn";

type SectionKey = "home" | "offerings" | "contact";

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

export default function ScrollRoutes({ initial }: { initial: SectionKey }) {
  const initialPosition = sections[initial].timelinePosition;
  const progress = useMotionValue(initialPosition);
  const [targetProgress, setTargetProgress] = useState(initialPosition);
  const [activeKey, setActiveKey] = useState<SectionKey>(initial);
  const activeRef = useRef<SectionKey>(initial);

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
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setTargetProgress((previous) =>
        clamp01(previous + event.deltaY * 0.00045),
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        setTargetProgress((previous) => clamp01(previous + 0.08));
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        setTargetProgress((previous) => clamp01(previous - 0.08));
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
  }, []);

  useMotionValueEvent(progress, "change", (value) => {
    const nextKey = sectionFromProgress(value);
    if (nextKey === activeRef.current) {
      return;
    }

    activeRef.current = nextKey;
    setActiveKey(nextKey);
    window.history.replaceState(null, "", sections[nextKey].path);
  });

  const goToSection = (key: SectionKey) => {
    activeRef.current = key;
    setActiveKey(key);
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
  const offeringsX = useTransform(progress, [0.3, 0.44, 0.8], [24, 0, -26]);
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
            "absolute inset-0 flex items-center",
            activeKey === "home" ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <HomeSection progress={progress} />
        </motion.section>

        <motion.section
          style={{ x: offeringsX, opacity: offeringsOpacity }}
          className={cn(
            "absolute inset-0 flex items-center py-16",
            activeKey === "offerings"
              ? "pointer-events-auto"
              : "pointer-events-none",
          )}
        >
          <OfferingsSection progress={progress} />
        </motion.section>

        <motion.section
          style={{ x: contactX, opacity: contactOpacity }}
          className={cn(
            "absolute inset-0 flex items-center py-20",
            activeKey === "contact"
              ? "pointer-events-auto"
              : "pointer-events-none",
          )}
        >
          <ContactSection />
        </motion.section>
      </div>
    </main>
  );
}
