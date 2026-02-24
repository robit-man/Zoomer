"use client";

import { useState, useEffect } from "react";
import { loadTuning, LAB, type LabConfig } from "./config";

/**
 * Loads /scene-tuning.json on mount, merges into LAB, and triggers a re-render.
 * Returns true once tuning is loaded (or failed gracefully).
 */
export function useTuning(): { ready: boolean; config: LabConfig } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadTuning().then(() => setReady(true));
  }, []);

  return { ready, config: LAB };
}
