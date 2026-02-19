"use client";

import { motion } from "framer-motion";
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

export default function OfferingsSection() {
  return (
    <div className="w-full">
      <div className="bbh-bartle-regular mb-10 text-[clamp(28px,3.5vw,44px)]">
        Offerings
      </div>

      <div className="grid grid-cols-1 gap-6">
        {groups.map((group, index) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -48 : 48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className={index % 2 === 0 ? "justify-self-start" : "justify-self-end"}
          >
            <Panel magnetStrength={1.2} className="w-[min(720px,92vw)] p-6">
              <div className="bbh-bartle-regular mb-4 text-2xl text-white">
                {group.title}
              </div>
              <div className="mono text-[13px] text-white/80">
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="text-white/30">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
