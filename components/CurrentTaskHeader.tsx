"use client";

import { useTaskStore } from "@/stores/useTaskStore";
import { useTimerStore } from "@/stores/useTimerStore";

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

  return (
    <div className="mt-6 text-center">
      <div className="text-lg font-medium text-slate-200">
        {task?.title ?? "タスク未選択"}
      </div>
      <div className="mt-1 text-sm uppercase tracking-widest text-slate-400">
        {task ? statusLabel[task.status] : "Idle"}
      </div>
    </div>
  );
}
