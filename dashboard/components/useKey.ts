"use client";

import { useEffect } from "react";

export function useKey(keys: Record<string, () => void>) {
  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
      const act = keys[event.key.toLowerCase()];
      if (!act) return;
      const target = event.target as HTMLElement;
      if (target.isContentEditable || target.closest("input, textarea, select")) return;
      event.preventDefault();
      act();
    };
    document.addEventListener("keydown", press);
    return () => document.removeEventListener("keydown", press);
  }, [keys]);
}
