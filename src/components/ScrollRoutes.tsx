"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import HomeSection from "@/sections/HomeSection";
import OfferingsSection from "@/sections/OfferingsSection";
import ContactSection from "@/sections/ContactSection";
import { cn } from "@/components/ui/cn";

type SectionKey = "home" | "offerings" | "contact";

const sections: Record<SectionKey, { label: string; path: string }> = {
  home: { label: "Home", path: "/" },
  offerings: { label: "Offerings", path: "/offerings" },
  contact: { label: "Contact", path: "/contact" },
};

export default function ScrollRoutes({ initial }: { initial: SectionKey }) {
  const [activeKey, setActiveKey] = useState<SectionKey>(initial);
  const homeRef = useRef<HTMLElement | null>(null);
  const offeringsRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);

  const refsByKey = useMemo(
    () => ({
      home: homeRef,
      offerings: offeringsRef,
      contact: contactRef,
    }),
    [],
  );

  useEffect(() => {
    const target = refsByKey[initial].current;
    if (!target) {
      return;
    }
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [initial, refsByKey]);

  useEffect(() => {
    const ratioMap: Record<SectionKey, number> = {
      home: 0,
      offerings: 0,
      contact: 0,
    };

    const observed: Array<{ key: SectionKey; el: HTMLElement }> = [];
    const homeEl = homeRef.current;
    const offeringsEl = offeringsRef.current;
    const contactEl = contactRef.current;
    if (homeEl) {
      observed.push({ key: "home", el: homeEl });
    }
    if (offeringsEl) {
      observed.push({ key: "offerings", el: offeringsEl });
    }
    if (contactEl) {
      observed.push({ key: "contact", el: contactEl });
    }

    if (!observed.length) {
      return;
    }

    const elToKey = new Map<HTMLElement, SectionKey>();
    for (const item of observed) {
      elToKey.set(item.el, item.key);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = elToKey.get(entry.target as HTMLElement);
          if (!key) {
            continue;
          }
          ratioMap[key] = entry.intersectionRatio;
        }

        const sorted = (Object.keys(ratioMap) as SectionKey[]).sort(
          (a, b) => ratioMap[b] - ratioMap[a],
        );
        const bestKey = sorted[0];
        const bestRatio = ratioMap[bestKey];

        if (bestRatio < 0.45) {
          return;
        }

        setActiveKey((prev) => {
          if (prev === bestKey) {
            return prev;
          }
          window.history.replaceState(null, "", sections[bestKey].path);
          return bestKey;
        });
      },
      { threshold: [0.35, 0.45, 0.55, 0.65] },
    );

    for (const item of observed) {
      observer.observe(item.el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-6">
      <div className="sticky top-4 z-30 flex justify-end pt-4">
        <nav className="panel panel-strong mono flex items-center gap-2 p-2">
          {(Object.keys(sections) as SectionKey[]).map((key) => (
            <Link
              key={key}
              href={sections[key].path}
              aria-current={activeKey === key ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition",
                "border border-transparent",
                activeKey === key
                  ? "border-white/20 bg-white/10 text-white"
                  : "text-white/55 hover:border-white/15 hover:text-white/85",
              )}
              prefetch
              scroll={false}
            >
              {sections[key].label}
            </Link>
          ))}
        </nav>
      </div>

      <section ref={homeRef} className="min-h-screen flex items-center">
        <HomeSection />
      </section>

      <section ref={offeringsRef} className="min-h-screen py-24 flex items-center">
        <OfferingsSection />
      </section>

      <section ref={contactRef} className="min-h-screen py-24 flex items-center">
        <ContactSection />
      </section>
    </main>
  );
}
