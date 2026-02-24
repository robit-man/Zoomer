"use client";

import { useState, useCallback } from "react";

export interface DebugSettings {
  showCables: boolean;
  showWallStrips: boolean;
  bloomEnabled: boolean;
  bloomStrength: number;
  exposure: number;
}

const defaults: DebugSettings = {
  showCables: true,
  showWallStrips: true,
  bloomEnabled: true,
  bloomStrength: 0.3,
  exposure: 1.15,
};

interface DebugUIProps {
  onChange: (settings: DebugSettings) => void;
}

export default function DebugUI({ onChange }: DebugUIProps) {
  const [settings, setSettings] = useState<DebugSettings>(defaults);
  const [open, setOpen] = useState(false);

  const update = useCallback(
    (patch: Partial<DebugSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#ccc",
        pointerEvents: "auto",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "#aaa",
          border: "1px solid #444",
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 11,
        }}
      >
        {open ? "Close Debug" : "Debug"}
      </button>
      {open && (
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            padding: 10,
            marginTop: 4,
            borderRadius: 4,
            minWidth: 200,
          }}
        >
          <label style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={settings.showCables}
              onChange={(e) => update({ showCables: e.target.checked })}
            />{" "}
            Cables
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={settings.showWallStrips}
              onChange={(e) => update({ showWallStrips: e.target.checked })}
            />{" "}
            Wall Strips
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={settings.bloomEnabled}
              onChange={(e) => update({ bloomEnabled: e.target.checked })}
            />{" "}
            Bloom
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            Bloom Strength:{" "}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bloomStrength}
              onChange={(e) => update({ bloomStrength: parseFloat(e.target.value) })}
              style={{ width: 80 }}
            />
            {" "}{settings.bloomStrength.toFixed(2)}
          </label>
          <label style={{ display: "block", marginBottom: 6 }}>
            Exposure:{" "}
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings.exposure}
              onChange={(e) => update({ exposure: parseFloat(e.target.value) })}
              style={{ width: 80 }}
            />
            {" "}{settings.exposure.toFixed(2)}
          </label>
        </div>
      )}
    </div>
  );
}
