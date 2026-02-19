"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useMemo } from "react";
import { Panel } from "@/components/ui/Panel";

function splitLetters(value: string) {
  return value.split("");
}

function seededOffsets(length: number) {
  const values: number[] = [];
  let seed = 1337;
  for (let index = 0; index < length; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const random = seed / 2147483647;
    values.push(220 + random * 900);
  }
  return values;
}

function ScatterLetter({
  char,
  index,
  progress,
  xOffset,
}: {
  char: string;
  index: number;
  progress: MotionValue<number>;
  xOffset: number;
}) {
  const x = useTransform(progress, [0, 0.33], [0, xOffset]);
  const y = useTransform(progress, [0, 0.33], [0, index % 2 === 0 ? 14 : -18]);
  const rotate = useTransform(progress, [0, 0.33], [0, (index % 3 - 1) * 10]);

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

export default function HomeSection({ progress }: { progress: MotionValue<number> }) {
  const title = "ZOOMER";
  const letters = useMemo(() => splitLetters(title), [title]);
  const offsets = useMemo(() => seededOffsets(title.length), [title.length]);

  return (
    <div className="w-full">
      <div className="relative">
        <div className="bbh-bartle-regular text-[clamp(56px,8vw,112px)] leading-[0.92]">
          <div className="flex flex-wrap gap-x-1 tracking-tight">
            {letters.map((char, index) => (
              <ScatterLetter
                key={`${char}-${index}`}
                char={char}
                index={index}
                progress={progress}
                xOffset={offsets[index]}
              />
            ))}
          </div>
          <div className="mt-2 text-[clamp(16px,2vw,24px)] tracking-normal opacity-50">
            consulting
          </div>
        </div>

        <div className="mt-10 max-w-[520px]">
          <Panel className="p-5 mono">
            <div className="label mb-3">Styleguide baseline</div>
            <div className="text-[13px] leading-relaxed text-white/80">
              Monochrome graphite surfaces, translucent panels, hairline borders,
              mono UI, and eased transitions driven by a fixed timeline.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
