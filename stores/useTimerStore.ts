import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TimerState } from "@/lib/types";
import { useTaskStore } from "@/stores/useTaskStore";

type TaskTimerSnapshot = {
  blockIndex: number;
  accumulatedMs: number;
  remainingMs: number;
};

type TimerStore = TimerState & {
  hasHydrated: boolean;
  taskSnapshots: Record<string, TaskTimerSnapshot>;
  setHasHydrated: (value: boolean) => void;
  handleTaskClick: (taskId: string, perfNow: number) => void;
  pauseActive: (perfNow: number) => void;
  tick: (perfNow: number) => void;
  resetForTask: (taskId: string) => void;
};

const BLOCK_DURATION_MS = 300_000;

const initialTimerState: TimerState = {
  activeTaskId: null,
  isRunning: false,
  blockIndex: 0,
  blockDurationMs: BLOCK_DURATION_MS,
  startPerfMs: null,
  accumulatedMs: 0,
  remainingMs: BLOCK_DURATION_MS,
  lastTickPerfMs: null
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      ...initialTimerState,
      hasHydrated: false,
      taskSnapshots: {},
      setHasHydrated: (value) => set({ hasHydrated: value }),
      handleTaskClick: (taskId, perfNow) => {
        const { tasksById, resetTask, setTaskStatus } = useTaskStore.getState();
        const target = tasksById[taskId];
        if (!target) return;

        const state = get();

        if (target.status === "completed") {
          resetTask(taskId);
          set((prev) => {
            const { [taskId]: _, ...rest } = prev.taskSnapshots;
            const shouldResetActive = prev.activeTaskId === taskId;
            return {
              ...prev,
              ...(!shouldResetActive ? {} : initialTimerState),
              taskSnapshots: rest
            };
          });
          return;
        }

        if (state.activeTaskId === taskId) {
          if (state.isRunning) {
            get().pauseActive(perfNow);
            setTaskStatus(taskId, "paused");
            return;
          }
          const snapshot = state.taskSnapshots[taskId];
          set({
            activeTaskId: taskId,
            isRunning: true,
            blockIndex: snapshot?.blockIndex ?? target.completedBlocks,
            accumulatedMs: snapshot?.accumulatedMs ?? 0,
            remainingMs: snapshot?.remainingMs ?? BLOCK_DURATION_MS,
            startPerfMs: perfNow,
            lastTickPerfMs: perfNow
          });
          setTaskStatus(taskId, "running");
          return;
        }

        if (state.isRunning && state.activeTaskId) {
          get().pauseActive(perfNow);
          const { activeTaskId } = get();
          if (activeTaskId) {
            useTaskStore.getState().setTaskStatus(activeTaskId, "paused");
          }
        }

        const snapshot = state.taskSnapshots[taskId];
        set({
          activeTaskId: taskId,
          isRunning: true,
          blockIndex: snapshot?.blockIndex ?? target.completedBlocks,
          accumulatedMs: snapshot?.accumulatedMs ?? 0,
          remainingMs: snapshot?.remainingMs ?? BLOCK_DURATION_MS,
          startPerfMs: perfNow,
          lastTickPerfMs: perfNow
        });
        setTaskStatus(taskId, "running");
      },
      pauseActive: (perfNow) => {
        const state = get();
        if (!state.isRunning || !state.activeTaskId || state.startPerfMs === null) {
          return;
        }
        const elapsed = state.accumulatedMs + (perfNow - state.startPerfMs);
        const remaining = Math.max(0, state.blockDurationMs - elapsed);
        set((prev) => ({
          isRunning: false,
          startPerfMs: null,
          accumulatedMs: elapsed,
          remainingMs: remaining,
          lastTickPerfMs: perfNow,
          taskSnapshots: {
            ...prev.taskSnapshots,
            [prev.activeTaskId as string]: {
              blockIndex: prev.blockIndex,
              accumulatedMs: elapsed,
              remainingMs: remaining
            }
          }
        }));
      },
      tick: (perfNow) => {
        const state = get();
        if (!state.isRunning || !state.activeTaskId || state.startPerfMs === null) {
          return;
        }

        const taskStore = useTaskStore.getState();
        const task = taskStore.tasksById[state.activeTaskId];
        if (!task) return;

        const elapsed = state.accumulatedMs + (perfNow - state.startPerfMs);
        const completedNow = Math.floor(elapsed / state.blockDurationMs);
        const remainder = elapsed % state.blockDurationMs;
        const remainingBlocks = task.blocks - task.completedBlocks;

        if (completedNow >= remainingBlocks) {
          taskStore.incrementCompletedBlocks(state.activeTaskId, remainingBlocks);
          taskStore.setTaskStatus(state.activeTaskId, "completed");
          set((prev) => {
            const { [state.activeTaskId as string]: _, ...rest } = prev.taskSnapshots;
            return {
              ...initialTimerState,
              activeTaskId: state.activeTaskId,
              taskSnapshots: rest,
              lastTickPerfMs: perfNow
            };
          });
          return;
        }

        if (completedNow > 0) {
          taskStore.incrementCompletedBlocks(state.activeTaskId, completedNow);
        }

        set((prev) => ({
          blockIndex: task.completedBlocks + completedNow,
          accumulatedMs: completedNow > 0 ? remainder : prev.accumulatedMs,
          remainingMs:
            completedNow > 0
              ? prev.blockDurationMs - remainder
              : Math.max(0, prev.blockDurationMs - elapsed),
          startPerfMs: completedNow > 0 ? perfNow : prev.startPerfMs,
          lastTickPerfMs: perfNow,
          taskSnapshots: {
            ...prev.taskSnapshots,
            [state.activeTaskId as string]: {
              blockIndex: task.completedBlocks + completedNow,
              accumulatedMs: completedNow > 0 ? remainder : prev.accumulatedMs,
              remainingMs:
                completedNow > 0
                  ? prev.blockDurationMs - remainder
                  : Math.max(0, prev.blockDurationMs - elapsed)
            }
          }
        }));
      },
      resetForTask: (taskId) => {
        set((prev) => {
          const { [taskId]: _, ...rest } = prev.taskSnapshots;
          const isActive = prev.activeTaskId === taskId;
          if (!isActive) {
            return { taskSnapshots: rest };
          }
          return {
            ...initialTimerState,
            activeTaskId: null,
            taskSnapshots: rest
          };
        });
      }
    }),
    {
      name: "timebox-timer-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
