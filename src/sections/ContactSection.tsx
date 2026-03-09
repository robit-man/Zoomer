"use client";

import {
  ArrowUpRight,
  Calendar,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/components/ui/cn";

type TileTone = "dark" | "light" | "lime" | "blue" | "pink";

const contactLinks = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@zoomer.example",
    href: "mailto:hello@zoomer.example",
    tone: "dark" as TileTone,
  },
  {
    icon: Calendar,
    label: "Schedule",
    value: "cal.com/zoomer",
    href: "https://cal.com",
    tone: "lime" as TileTone,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "linkedin.com/company/zoomer",
    href: "https://www.linkedin.com",
    tone: "light" as TileTone,
  },
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/zoomer-studio",
    href: "https://github.com",
    tone: "blue" as TileTone,
  },
] as const;

function seededValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) % 2147483647;
  }
  return (hash % 1000) / 1000;
}

function cellularDiffusionOffset(time: number, seed: number, axis: "x" | "y") {
  const t = time * 0.00033;
  const phase = seed * Math.PI * 2;
  const waveA = Math.sin(t * (axis === "x" ? 0.76 : 1.04) + phase);
  const waveB = Math.cos(t * (axis === "x" ? 1.39 : 1.17) - phase * 0.68);
  const coupled = Math.sin((waveA + waveB) * 1.3 + t * 0.56);
  const diffusion = Math.cos(t * 0.41 + phase * 1.63 + coupled * 1.08);

  return waveA * 0.34 + waveB * 0.22 + coupled * 0.28 + diffusion * 0.16;
}

function CrosshairAccent({
  dark,
  driftX,
  driftY,
  seed,
  style,
}: {
  dark: boolean;
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  seed: number;
  style: CSSProperties;
}) {
  const time = useTime();
  const x = useTransform(() => {
    const organicX = cellularDiffusionOffset(time.get(), seed, "x") * 12;
    return driftX.get() + organicX;
  });
  const y = useTransform(() => {
    const organicY = cellularDiffusionOffset(time.get(), seed + 0.19, "y") * 14;
    return driftY.get() + organicY;
  });

  return (
    <motion.span
      className="pointer-events-none absolute z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2"
      style={{ ...style, x, y }}
    >
      <span
        className={cn(
          "absolute left-1/2 top-0 h-[35%] w-px -translate-x-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 left-1/2 h-[35%] w-px -translate-x-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 h-px w-[35%] -translate-y-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
      <span
        className={cn(
          "absolute right-0 top-1/2 h-px w-[35%] -translate-y-1/2",
          dark ? "bg-white/32" : "bg-black/24",
        )}
      />
    </motion.span>
  );
}

function ToneBlock({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: TileTone;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-black/12",
        tone === "dark" && "border-black/55 bg-[var(--graphite)] text-[var(--paper)]",
        tone === "light" && "bg-[rgba(252,251,247,0.94)] text-[var(--ink)]",
        tone === "lime" && "border-black/15 bg-[var(--acid)] text-[var(--ink)]",
        tone === "blue" && "border-black/15 bg-[var(--neon-blue)] text-[var(--ink)]",
        tone === "pink" && "border-black/15 bg-[var(--neon-pink)] text-[var(--ink)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ContactLinkTile({
  driftX,
  driftY,
  index,
  item,
}: {
  driftX: MotionValue<number>;
  driftY: MotionValue<number>;
  index: number;
  item: (typeof contactLinks)[number];
}) {
  const Icon = item.icon;
  const seed = seededValue(`${item.label}-${index}`);
  const isDark = item.tone === "dark";
  const accentAX = useTransform(driftX, (value) => value * (8 + seed * 7));
  const accentAY = useTransform(driftY, (value) => value * (10 + seed * 8));
  const accentBX = useTransform(driftX, (value) => value * (-10 - seed * 9));
  const accentBY = useTransform(driftY, (value) => value * (-8 - seed * 8));

  return (
    <a
      href={item.href}
      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
      rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
      className="group min-h-0 xl:h-full"
    >
      <ToneBlock
        tone={item.tone}
        className="flex h-full min-h-[168px] min-w-0 flex-col justify-between gap-4 p-4 transition-transform duration-300 group-hover:-translate-y-1 md:p-5 xl:min-h-0"
      >
        <CrosshairAccent
          dark={isDark}
          driftX={accentAX}
          driftY={accentAY}
          seed={seed}
          style={{ top: `${18 + seed * 34}%`, right: -8 }}
        />
        <CrosshairAccent
          dark={isDark}
          driftX={accentBX}
          driftY={accentBY}
          seed={seed + 0.28}
          style={{ bottom: `${16 + seed * 28}%`, left: -8 }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className={cn("label", isDark ? "text-white/46" : "text-black/44")}>
            {item.label}
          </div>
          <ArrowUpRight
            size={17}
            className={cn(
              "transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
              isDark ? "text-white/54" : "text-black/42",
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-2.5">
            <Icon
              size={16}
              className={cn("mt-0.5 shrink-0", isDark ? "text-[var(--acid)]" : "text-black/78")}
            />
            <div className="min-w-0 break-all text-[0.96rem] font-medium leading-[1.08] tracking-[-0.03em] md:text-[1.02rem] xl:text-[1.05rem]">
              {item.value}
            </div>
          </div>
        </div>
      </ToneBlock>
    </a>
  );
}

export default function ContactSection() {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const driftX = useSpring(pointerX, { stiffness: 82, damping: 24, mass: 0.5 });
  const driftY = useSpring(pointerY, { stiffness: 82, damping: 24, mass: 0.5 });
  const heroSeed = seededValue("contact-hero");
  const noteSeed = seededValue("contact-note");
  const heroAX = useTransform(driftX, (value) => value * 12);
  const heroAY = useTransform(driftY, (value) => value * 14);
  const heroBX = useTransform(driftX, (value) => value * -10);
  const heroBY = useTransform(driftY, (value) => value * -12);
  const noteAX = useTransform(driftX, (value) => value * 8);
  const noteAY = useTransform(driftY, (value) => value * 10);
  const noteBX = useTransform(driftX, (value) => value * -9);
  const noteBY = useTransform(driftY, (value) => value * -7);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    pointerX.set(normalizedX);
    pointerY.set(normalizedY);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      className="w-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="mx-auto grid w-full max-w-[86rem] gap-2 md:gap-3 xl:h-[min(52rem,calc(100svh-4rem))] xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,460px)]">
        <ToneBlock
          tone="light"
          className="grid h-full min-h-[620px] grid-rows-[minmax(0,1fr)_auto] xl:min-h-0"
        >
          <CrosshairAccent
            dark={false}
            driftX={heroAX}
            driftY={heroAY}
            seed={heroSeed}
            style={{ top: 34, right: -8 }}
          />
          <CrosshairAccent
            dark={false}
            driftX={heroBX}
            driftY={heroBY}
            seed={heroSeed + 0.24}
            style={{ bottom: 38, left: -8 }}
          />

          <div className="grid min-h-0 gap-8 px-4 py-5 md:px-5 md:py-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-h-0 flex-col justify-between gap-8">
              <div>
                <div className="label text-black/44">Open line</div>
                <h2 className="display mt-4 max-w-[11ch] text-[clamp(3.4rem,6.2vw,6.2rem)] leading-[0.82] text-[var(--ink)]">
                  Build with intent, then get it moving.
                </h2>
                <p className="mt-5 max-w-[34rem] text-[11px] leading-[1.55] text-black/68 md:text-[12px]">
                  The contact stage should feel like the same system, not a separate
                  landing page. Keep the ask direct, keep the structure spare, and
                  use a few strong routes instead of a crowded form.
                </p>
              </div>

              <ToneBlock tone="dark" className="max-w-[28rem] p-4 md:p-5">
                <CrosshairAccent
                  dark
                  driftX={noteAX}
                  driftY={noteAY}
                  seed={noteSeed}
                  style={{ top: 28, right: -8 }}
                />
                <CrosshairAccent
                  dark
                  driftX={noteBX}
                  driftY={noteBY}
                  seed={noteSeed + 0.31}
                  style={{ bottom: 30, left: -8 }}
                />

                <div className="label text-white/44">Working note</div>
                <p className="mt-4 max-w-[22rem] text-[10px] leading-[1.5] text-white/72 md:text-[11px]">
                  Placeholder links are active here for now. Replace them with live
                  destinations once scheduling, inbox routing, and outbound profiles
                  are finalized.
                </p>
              </ToneBlock>
            </div>

            <ToneBlock tone="pink" className="flex flex-col justify-between p-4 md:p-5">
              <div>
                <div className="label text-black/48">Mode</div>
                <div className="display mt-4 text-[clamp(2rem,2.8vw,3rem)] leading-[0.88]">
                  Remote-first
                </div>
              </div>

              <div className="space-y-4 text-[10px] uppercase tracking-[0.18em] text-black/68 md:text-[11px]">
                <div>Distributed collaboration</div>
                <div>Response target: 1-2 business days</div>
                <div>Best for build, planning, and launch-stage asks</div>
              </div>
            </ToneBlock>
          </div>

          <div className="border-t border-black/10 px-4 py-4 md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-[0.18em] text-black/42 md:text-[11px]">
              <span>Concept / structure / impact</span>
              <span>Choose a route, start a conversation</span>
            </div>
          </div>
        </ToneBlock>

        <div className="grid min-h-[620px] gap-2 md:gap-3 xl:h-full xl:min-h-0 xl:grid-rows-[repeat(5,minmax(0,1fr))]">
          {contactLinks.map((item, index) => (
            <ContactLinkTile
              key={item.label}
              driftX={driftX}
              driftY={driftY}
              index={index}
              item={item}
            />
          ))}

          <ToneBlock tone="lime" className="flex flex-col justify-between p-4 md:p-5">
            <div className="label text-black/48">Availability</div>
            <div>
              <div className="display max-w-[10ch] text-[clamp(1.7rem,2.2vw,2.4rem)] leading-[0.9]">
                Project intake open.
              </div>
              <p className="mt-4 max-w-[22rem] text-[10px] leading-[1.5] text-black/72 md:text-[11px]">
                Placeholder block for a sharper CTA, current booking state, or a
                project-fit note once the real outbound flow is settled.
              </p>
            </div>
          </ToneBlock>
        </div>
      </div>
    </div>
  );
}
