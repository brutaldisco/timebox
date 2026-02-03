"use client";

import { useTimerStore } from "@/stores/useTimerStore";
import { formatMs } from "@/lib/time";

export function TimerDisplay() {
  const remainingMs = useTimerStore((state) => state.remainingMs);
  return (
    <div className="text-center">
      <div className="text-6xl font-semibold tabular-nums tracking-tight text-slate-50 sm:text-7xl">
        {formatMs(remainingMs)}
      </div>
    </div>
  );
}
