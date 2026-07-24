"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Generic undo/redo history stack for a piece of state. Every call to `set`
 * pushes a new entry onto the history; `undo`/`redo` step through it. Bound
 * to Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z by the consuming component.
 */
export function useUndoRedo<T>(initial: T, limit = 50) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, forceRender] = useState(0);

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setPresent((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        past.current = [...past.current, prev].slice(-limit);
        future.current = [];
        return next;
      });
    },
    [limit]
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setPresent((current) => {
      const previous = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [current, ...future.current];
      return previous;
    });
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setPresent((current) => {
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current, current];
      return next;
    });
    forceRender((n) => n + 1);
  }, []);

  return {
    value: present,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
