"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/stores/useTimerStore";

export function TimerEngine() {
  const isRunning = useTimerStore((state) => state.isRunning);
  const tick = useTimerStore((state) => state.tick);

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      tick(performance.now());
    }, 10);
    return () => window.clearInterval(interval);
  }, [isRunning, tick]);

  return null;
}
