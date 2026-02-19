"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useMemo, useRef } from "react";
import { Panel } from "@/components/ui/Panel";

function splitLetters(value: string) {
  return value.split("");
}

function seededOffsets(len: number) {
  const values: number[] = [];
  let seed = 1337;
  for (let index = 0; index < len; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const random = seed / 2147483647;
    values.push(220 + random * 900);
  }
  return values;
}

function ScatterLetter({
  char,
  index,
  scrollYProgress,
  xOffset,
}: {
  char: string;
  index: number;
  scrollYProgress: MotionValue<number>;
  xOffset: number;
}) {
  const x = useTransform(scrollYProgress, [0, 0.55], [0, xOffset]);
  const y = useTransform(
    scrollYProgress,
    [0, 0.55],
    [0, index % 2 === 0 ? 14 : -18],
  );
  const rotate = useTransform(
    scrollYProgress,
    [0, 0.55],
    [0, (index % 3 - 1) * 10],
  );

  return (
    <motion.span
      style={{ x, y, rotate }}
      className="inline-block text-white"
      transition={{ ease: [0.2, 0.8, 0.2, 1] }}
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

export default function HomeSection() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end start"],
  });

  const title = "ZOOMER";
  const letters = useMemo(() => splitLetters(title), [title]);
  const offsets = useMemo(() => seededOffsets(title.length), [title.length]);

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative">
        <div className="bbh-bartle-regular leading-[0.92] text-[clamp(56px,8vw,112px)] tracking-tight">
          <div className="flex flex-wrap gap-x-1">
            {letters.map((char, index) => (
              <ScatterLetter
                key={`${char}-${index}`}
                char={char}
                index={index}
                scrollYProgress={scrollYProgress}
                xOffset={offsets[index]}
              />
            ))}
          </div>
          <div className="mt-2 text-[clamp(16px,2vw,24px)] opacity-50">
            consulting
          </div>
        </div>

        <div className="mt-10 max-w-[520px]">
          <Panel className="glow p-5 mono">
            <div className="label mb-3">Styleguide baseline</div>
            <div className="text-[13px] leading-relaxed text-white/80">
              Graphite background, translucent panels, hairline borders, mono
              UI, eased motion. Panels and buttons attract the particle field.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
