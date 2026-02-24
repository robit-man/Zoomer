/**
 * Smooth flicker noise using layered sine waves.
 * Returns a value in [0, 1].
 */
export function flickerNoise(time: number, phase: number, speed: number): number {
  const t = time * speed + phase;
  const v =
    Math.sin(t * 1.0) * 0.4 +
    Math.sin(t * 2.3 + 1.7) * 0.3 +
    Math.sin(t * 4.1 + 3.2) * 0.2 +
    Math.sin(t * 7.9 + 5.1) * 0.1;
  // Normalize from [-1,1] to [0,1]
  return v * 0.5 + 0.5;
}
