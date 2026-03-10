"use client";

import { LAB, type LabConfig } from "./config";

/**
 * The lab config is seeded synchronously from the tuning JSON so the scene
 * does not mount with one lighting state and then flip to another.
 */
export function useTuning(): { ready: boolean; config: LabConfig } {
  return { ready: true, config: LAB };
}
