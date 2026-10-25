"use client";
import { useCallback, useEffect, useRef } from "react";
import { createBrowserEngine } from "@/engine/uci-engine";
import type { ChessEngine } from "@/engine/types";
export function useChessEngine() {
  const engine = useRef<ChessEngine | null>(null);
  useEffect(
    () => () => {
      engine.current?.dispose();
      engine.current = null;
    },
    [],
  );
  return useCallback(
    () => engine.current ?? (engine.current = createBrowserEngine()),
    [],
  );
}
