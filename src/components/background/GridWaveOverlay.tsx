"use client";

import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const GRID_SIZE = 46;
const WAVE_BAND = 5;
const MAX_TILES = 64;
const MAX_BLUR = 8;
const IDLE_ENERGY = 0.12;
const IDLE_DRIFT_SPEED = 0.15;
const IDLE_SEED_SPEED = 0.08;
const IDLE_INTERVAL = 180;

type WaveTile = {
  id: string;
  row: number;
  col: number;
  blur: number;
  brightness: number;
  opacity: number;
  wash: number;
  hue: number;
};

function hashNoise(a: number, b: number, c: number) {
  const value = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function buildWaveTiles({
  rows,
  columns,
  front,
  seed,
  energy,
  time,
}: {
  rows: number;
  columns: number;
  front: number;
  seed: number;
  energy: number;
  time: number;
}) {
  const tiles = new Map<string, WaveTile>();

  for (let row = 0; row < rows; row += 1) {
    const rowPhase =
      Math.sin((row + seed * 0.22) * 0.57) * 1.5 +
      Math.cos((row + seed * 0.11) * 0.31) * 0.8;

    for (let lane = -WAVE_BAND; lane <= WAVE_BAND; lane += 1) {
      const col = Math.round(front + rowPhase + lane * 0.92);
      if (col < 0 || col >= columns) {
        continue;
      }

      const normalizedDistance = Math.abs(lane) / WAVE_BAND;
      const falloff = 1 - normalizedDistance;
      const n = hashNoise(row, col, Math.floor(seed * 3));

      if (n < 0.12 + normalizedDistance * 0.32) {
        continue;
      }

      const intensity = falloff * (0.6 + n * 0.7) * energy;
      if (intensity < 0.08) {
        continue;
      }

      const id = `${row}:${col}`;
      const blur = Math.min(MAX_BLUR, 2.5 + intensity * (10 + n * 12));
      const brightness = 0.78 + intensity * 0.7 + n * 0.3;
      const opacity = Math.min(0.34, 0.05 + intensity * 0.32);
      const wash = Math.min(0.16, 0.02 + intensity * 0.14);

      const hue = 38 + ((time * 3 + row * 5 + col * 7 + n * 20) % 16);

      const existing = tiles.get(id);
      if (!existing || opacity > existing.opacity) {
        tiles.set(id, {
          id,
          row,
          col,
          blur,
          brightness,
          opacity,
          wash,
          hue,
        });
      }
    }
  }

  const result = Array.from(tiles.values());
  if (result.length > MAX_TILES) {
    result.sort((a, b) => b.opacity - a.opacity);
    return result.slice(0, MAX_TILES);
  }
  return result;
}

export default function GridWaveOverlay({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [tiles, setTiles] = useState<WaveTile[]>([]);

  const previousProgressRef = useRef(progress.get());
  const frontRef = useRef(-WAVE_BAND);
  const seedRef = useRef(0);
  const energyRef = useRef(0);
  const idleFramesRef = useRef(0);
  const rafRef = useRef(0);
  const pendingTilesRef = useRef<WaveTile[] | null>(null);
  const timeRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScrollingRef = useRef(false);

  const flushTiles = useCallback(() => {
    rafRef.current = 0;
    if (pendingTilesRef.current !== null) {
      setTiles(pendingTilesRef.current);
      pendingTilesRef.current = null;
    }
  }, []);

  const startIdleLoop = useCallback(() => {
    if (idleTimerRef.current) return;
    idleTimerRef.current = setInterval(() => {
      if (isScrollingRef.current || viewport.width <= 0 || viewport.height <= 0) return;

      const columns = Math.max(1, Math.ceil(viewport.width / GRID_SIZE));
      const rows = Math.max(1, Math.ceil(viewport.height / GRID_SIZE));

      timeRef.current += IDLE_INTERVAL / 1000;
      frontRef.current += IDLE_DRIFT_SPEED;
      if (frontRef.current > columns + WAVE_BAND) {
        frontRef.current = -WAVE_BAND;
      }
      seedRef.current += IDLE_SEED_SPEED;
      energyRef.current = IDLE_ENERGY + Math.sin(timeRef.current * 0.4) * 0.04;

      const next = buildWaveTiles({
        rows,
        columns,
        front: frontRef.current,
        seed: seedRef.current,
        energy: energyRef.current,
        time: timeRef.current,
      });

      setTiles(next);
    }, IDLE_INTERVAL);
  }, [viewport.width, viewport.height]);

  const stopIdleLoop = useCallback(() => {
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startIdleLoop();
    return () => {
      stopIdleLoop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [startIdleLoop, stopIdleLoop]);

  useEffect(() => {
    const measure = () => {
      const next = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewport((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    setTiles([]);
    frontRef.current = -WAVE_BAND;
  }, [viewport.width, viewport.height]);

  useMotionValueEvent(progress, "change", (value) => {
    if (viewport.width <= 0 || viewport.height <= 0) {
      return;
    }

    const delta = value - previousProgressRef.current;
    previousProgressRef.current = value;
    const absDelta = Math.abs(delta);

    if (absDelta < 0.00025) {
      idleFramesRef.current += 1;
      energyRef.current *= 0.9;
      if (idleFramesRef.current > 6) {
        isScrollingRef.current = false;
        startIdleLoop();
      }
      return;
    }

    idleFramesRef.current = 0;
    isScrollingRef.current = true;
    stopIdleLoop();

    const direction = delta > 0 ? 1 : -1;

    const columns = Math.max(1, Math.ceil(viewport.width / GRID_SIZE));
    const rows = Math.max(1, Math.ceil(viewport.height / GRID_SIZE));
    const waveSpan = columns + WAVE_BAND * 2;
    const travelSpeed = waveSpan * 2.5;

    frontRef.current += direction * absDelta * travelSpeed;
    if (frontRef.current > columns + WAVE_BAND) {
      frontRef.current = -WAVE_BAND;
    } else if (frontRef.current < -WAVE_BAND) {
      frontRef.current = columns + WAVE_BAND;
    }

    seedRef.current += absDelta * 95;
    energyRef.current = Math.min(1, energyRef.current * 0.7 + absDelta * 540);

    pendingTilesRef.current = buildWaveTiles({
      rows,
      columns,
      front: frontRef.current,
      seed: seedRef.current,
      energy: energyRef.current,
      time: timeRef.current,
    });

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushTiles);
    }
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
      {tiles.map((tile) => (
        <span
          key={tile.id}
          className="absolute"
          style={{
            left: tile.col * GRID_SIZE,
            top: tile.row * GRID_SIZE,
            width: GRID_SIZE,
            height: GRID_SIZE,
            opacity: tile.opacity,
            backgroundColor: `hsla(${Math.round(tile.hue)},${Math.round(tile.wash * 5)}%,${Math.round(82 + tile.brightness * 12)}%,${tile.wash.toFixed(3)})`,
            backdropFilter: `blur(${tile.blur.toFixed(2)}px) brightness(${tile.brightness.toFixed(2)})`,
            WebkitBackdropFilter: `blur(${tile.blur.toFixed(2)}px) brightness(${tile.brightness.toFixed(2)})`,
            transition:
              "opacity 180ms linear, backdrop-filter 220ms linear, background-color 220ms linear",
          }}
        />
      ))}
    </div>
  );
}
