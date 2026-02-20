import React, { createContext, useContext, useState, useCallback } from "react";

type HideModeContextValue = {
  hideMode: boolean;
  enterHideMode: () => void;
  exitHideMode: () => void;
  toggleHideMode: () => void;
};

const HideModeContext = createContext<HideModeContextValue | undefined>(undefined);

export function HideModeProvider({ children }: { children: React.ReactNode }) {
  const [hideMode, setHideMode] = useState(false);

  const enterHideMode = useCallback(() => setHideMode(true), []);
  const exitHideMode = useCallback(() => setHideMode(false), []);
  const toggleHideMode = useCallback(() => setHideMode((prev) => !prev), []);

  return (
    <HideModeContext.Provider value={{ hideMode, enterHideMode, exitHideMode, toggleHideMode }}>
      {children}
    </HideModeContext.Provider>
  );
}

export function useHideMode(): HideModeContextValue {
  const ctx = useContext(HideModeContext);
  if (!ctx) {
    throw new Error("useHideMode must be used within a HideModeProvider");
  }
  return ctx;
}

