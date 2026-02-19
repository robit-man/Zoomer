"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type MagnetItem = {
  el: HTMLElement;
  strength: number;
};

type MagnetTargetsContextValue = {
  register: (el: HTMLElement, strength?: number) => () => void;
  getItems: () => MagnetItem[];
};

const MagnetTargetsContext = createContext<MagnetTargetsContextValue | null>(
  null,
);

export function MagnetTargetsProvider({ children }: { children: ReactNode }) {
  const itemsRef = useRef<MagnetItem[]>([]);

  const value = useMemo<MagnetTargetsContextValue>(
    () => ({
      register: (el, strength = 1) => {
        const item = { el, strength };
        itemsRef.current.push(item);

        return () => {
          itemsRef.current = itemsRef.current.filter((entry) => entry !== item);
        };
      },
      getItems: () => itemsRef.current,
    }),
    [],
  );

  return (
    <MagnetTargetsContext.Provider value={value}>
      {children}
    </MagnetTargetsContext.Provider>
  );
}

export function useMagnetTargets() {
  const context = useContext(MagnetTargetsContext);
  if (!context) {
    throw new Error(
      "useMagnetTargets must be used within MagnetTargetsProvider",
    );
  }
  return context;
}

export type { MagnetItem };
