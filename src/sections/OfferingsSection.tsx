"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { Panel } from "@/components/ui/Panel";

const groups = [
  {
    title: "Software",
    items: [
      "AI agents",
      "App development",
      "Custom websites",
      "UI/UX",
      "User journeys",
      "Monetization",
    ],
  },
  {
    title: "Hard Tech",
    items: [
      "AutoCAD",
      "Rapid prototyping of small electronics",
      "Firmware and hardware",
      "User interface development",
    ],
  },
  {
    title: "3D Printing",
    items: [
      "Low to medium complexity parts manufacturing and assembly",
      "General consulting",
    ],
  },
  {
    title: "Business / Startup Consulting",
    items: [
      "Technology product feasibility analysis",
      "Business structure",
      "Startup pitch deck",
      "Market research",
      "Company structuring",
      "Technology discovery",
    ],
  },
];

function OfferingCard({
  index,
  title,
  items,
  progress,
}: {
  index: number;
  title: string;
  items: string[];
  progress: MotionValue<number>;
}) {
  const fadeInStart = 0.33 + index * 0.03;
  const fadeInEnd = 0.46 + index * 0.03;
  const fadeOutStart = 0.62 + index * 0.02;
  const fadeOutEnd = 0.78 + index * 0.02;

  const opacity = useTransform(
    progress,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0],
  );
  const x = useTransform(
    progress,
    [fadeInStart, fadeInEnd],
    [index % 2 === 0 ? -52 : 52, 0],
  );

  return (
    <motion.div
      style={{ opacity, x }}
      className={index % 2 === 0 ? "justify-self-start" : "justify-self-end"}
    >
      <Panel magnetStrength={1.2} className="w-[min(720px,92vw)] p-6">
        <div className="bbh-bartle-regular mb-4 text-2xl text-white">{title}</div>
        <div className="mono text-[13px] text-white/80">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-white/30">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </motion.div>
  );
}

export default function OfferingsSection({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  return (
    <div className="w-full">
      <div className="bbh-bartle-regular mb-8 text-[clamp(28px,3.5vw,44px)]">
        Offerings
      </div>

      <div className="grid grid-cols-1 gap-5">
        {groups.map((group, index) => (
          <OfferingCard
            key={group.title}
            index={index}
            title={group.title}
            items={group.items}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}
