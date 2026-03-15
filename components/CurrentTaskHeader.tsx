"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { useTimerStore } from "@/stores/useTimerStore";
import { TaskProgress } from "@/components/TaskProgress";
import {
  getAlwaysOnTopStorageKey,
  isDesktopRuntime,
  setDesktopAlwaysOnTop
} from "@/lib/desktop";

const statusLabel: Record<string, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
  completed: "Completed"
};

export function CurrentTaskHeader() {
  const activeTaskId = useTimerStore((state) => state.activeTaskId);
  const task = useTaskStore((state) =>
    activeTaskId ? state.tasksById[activeTaskId] : undefined
  );
  const [isDesktop, setIsDesktop] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);

  useEffect(() => {
    if (!isDesktopRuntime()) return;
    setIsDesktop(true);
    const storageKey = getAlwaysOnTopStorageKey();
    const saved = window.localStorage.getItem(storageKey);
    const initial = saved == null ? true : saved === "true";
    setAlwaysOnTop(initial);
    void setDesktopAlwaysOnTop(initial);
  }, []);

  const handleToggleAlwaysOnTop = async () => {
    const next = !alwaysOnTop;
    const ok = await setDesktopAlwaysOnTop(next);
    if (!ok) return;
    setAlwaysOnTop(next);
    window.localStorage.setItem(getAlwaysOnTopStorageKey(), String(next));
  };

  return (
    <div className="mt-6 text-center">
      <div className="text-lg font-medium text-slate-200">
        {task?.title ?? "タスク未選択"}
      </div>
      <div className="mt-1 text-sm uppercase tracking-widest text-slate-400">
        {task ? statusLabel[task.status] : "Idle"}
      </div>
      {task ? (
        <div className="mt-4 flex items-center justify-center">
          <TaskProgress
            blocks={task.blocks}
            completedBlocks={task.completedBlocks}
            size="md"
          />
        </div>
      ) : null}
      {isDesktop ? (
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleToggleAlwaysOnTop}
            className="rounded-md border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500"
          >
            最前面表示: {alwaysOnTop ? "ON" : "OFF"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
