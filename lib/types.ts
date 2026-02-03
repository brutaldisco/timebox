export type TaskDepth = 1 | 2 | 3;

export type TaskStatus = "idle" | "running" | "paused" | "completed";

export type Task = {
  id: string;
  title: string;
  depth: TaskDepth;
  parentId?: string;
  blocks: number;
  completedBlocks: number;
  status: TaskStatus;
  order: number;
};

export type TimerState = {
  activeTaskId: string | null;
  isRunning: boolean;
  blockIndex: number;
  blockDurationMs: number;
  startPerfMs: number | null;
  accumulatedMs: number;
  remainingMs: number;
  lastTickPerfMs: number | null;
};
