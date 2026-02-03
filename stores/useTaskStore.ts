import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Task, TaskStatus } from "@/lib/types";
import { seedTasks } from "@/lib/seed";

export const ROOT_PARENT_ID = "root";

type TaskStore = {
  tasksById: Record<string, Task>;
  childrenByParentId: Record<string, string[]>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  seedIfNeeded: () => void;
  addTask: (input: { title: string; parentId?: string; blocks: number }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  incrementCompletedBlocks: (id: string, count: number) => void;
  resetTask: (id: string) => void;
  moveTask: (draggedId: string, targetId: string, placeAfter?: boolean) => void;
  moveTaskToParent: (draggedId: string, targetParentId?: string) => void;
  indentTask: (taskId: string) => void;
  outdentTask: (taskId: string) => void;
  enforceFlat: () => void;
};

const parentKey = (parentId?: string) => parentId ?? ROOT_PARENT_ID;

const buildStateFromTasks = (tasks: Task[]) => {
  const tasksById: Record<string, Task> = {};
  const childrenByParentId: Record<string, string[]> = {
    [ROOT_PARENT_ID]: []
  };

  tasks.forEach((task) => {
    tasksById[task.id] = task;
  });

  tasks.forEach((task) => {
    const key = parentKey(task.parentId);
    childrenByParentId[key] ??= [];
    childrenByParentId[key].push(task.id);
  });

  Object.keys(childrenByParentId).forEach((key) => {
    childrenByParentId[key].sort(
      (a, b) => (tasksById[a]?.order ?? 0) - (tasksById[b]?.order ?? 0)
    );
  });

  Object.entries(childrenByParentId).forEach(([_, ids]) => {
    ids.forEach((id, index) => {
      const task = tasksById[id];
      if (task) {
        tasksById[id] = { ...task, order: index + 1 };
      }
    });
  });

  return { tasksById, childrenByParentId };
};

const updateOrderForParent = (
  tasksById: Record<string, Task>,
  childrenByParentId: Record<string, string[]>,
  parentId?: string
) => {
  const key = parentKey(parentId);
  const ids = childrenByParentId[key] ?? [];
  ids.forEach((id, index) => {
    const task = tasksById[id];
    if (task && task.order !== index + 1) {
      tasksById[id] = { ...task, order: index + 1 };
    }
  });
};

const getDescendants = (
  draggedId: string,
  childrenByParentId: Record<string, string[]>
) => {
  const descendants: string[] = [];
  const stack = [...(childrenByParentId[draggedId] ?? [])];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id) continue;
    descendants.push(id);
    const children = childrenByParentId[id] ?? [];
    stack.push(...children);
  }
  return descendants;
};

const flattenOrder = (childrenByParentId: Record<string, string[]>) => {
  const ordered: string[] = [];
  const walk = (parentId?: string) => {
    const key = parentKey(parentId);
    const children = childrenByParentId[key] ?? [];
    children.forEach((id) => {
      ordered.push(id);
      walk(id);
    });
  };
  walk(undefined);
  return ordered;
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasksById: {},
      childrenByParentId: { [ROOT_PARENT_ID]: [] },
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      seedIfNeeded: () => {
        const { tasksById, hasHydrated } = get();
        if (!hasHydrated) return;
        if (Object.keys(tasksById).length === 0) {
          set(buildStateFromTasks(seedTasks));
        }
      },
      addTask: ({ title, parentId, blocks }) =>
        set((state) => {
          const parent = parentId ? state.tasksById[parentId] : undefined;
          const depth = parent ? ((parent.depth + 1) as Task["depth"]) : 1;
          if (depth > 3) return state;
          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `task-${Date.now()}`;
          const newTask: Task = {
            id,
            title,
            depth,
            parentId,
            blocks,
            completedBlocks: 0,
            status: "idle",
            order: 0
          };
          const key = parentKey(parentId);
          const nextChildren = {
            ...state.childrenByParentId,
            [key]: [...(state.childrenByParentId[key] ?? []), id]
          };
          const nextTasksById = { ...state.tasksById, [id]: newTask };
          updateOrderForParent(nextTasksById, nextChildren, parentId);
          return {
            tasksById: nextTasksById,
            childrenByParentId: nextChildren
          };
        }),
      updateTask: (id, patch) =>
        set((state) => ({
          tasksById: {
            ...state.tasksById,
            [id]: { ...state.tasksById[id], ...patch }
          }
        })),
      setTaskStatus: (id, status) =>
        set((state) => ({
          tasksById: {
            ...state.tasksById,
            [id]: { ...state.tasksById[id], status }
          }
        })),
      incrementCompletedBlocks: (id, count) =>
        set((state) => {
          const task = state.tasksById[id];
          if (!task) return state;
          const nextCompleted = Math.min(task.blocks, task.completedBlocks + count);
          const status = nextCompleted >= task.blocks ? "completed" : task.status;
          return {
            tasksById: {
              ...state.tasksById,
              [id]: { ...task, completedBlocks: nextCompleted, status }
            }
          };
        }),
      resetTask: (id) =>
        set((state) => {
          const task = state.tasksById[id];
          if (!task) return state;
          return {
            tasksById: {
              ...state.tasksById,
              [id]: { ...task, completedBlocks: 0, status: "idle" }
            }
          };
        }),
      moveTask: (draggedId, targetId, placeAfter = false) =>
        set((state) => {
          if (draggedId === targetId) return state;
          const dragged = state.tasksById[draggedId];
          const target = state.tasksById[targetId];
          if (!dragged || !target) return state;
          if (dragged.parentId !== target.parentId) return state;

          const key = parentKey(dragged.parentId);
          const current = state.childrenByParentId[key] ?? [];
          const withoutDragged = current.filter((id) => id !== draggedId);
          const targetIndex = withoutDragged.indexOf(targetId);
          if (targetIndex === -1) return state;
          const insertIndex = targetIndex + (placeAfter ? 1 : 0);
          const nextChildrenIds = [
            ...withoutDragged.slice(0, insertIndex),
            draggedId,
            ...withoutDragged.slice(insertIndex)
          ];

          const nextChildren = {
            ...state.childrenByParentId,
            [key]: nextChildrenIds
          };
          const nextTasksById = { ...state.tasksById };
          updateOrderForParent(nextTasksById, nextChildren, dragged.parentId);
          return {
            tasksById: nextTasksById,
            childrenByParentId: nextChildren
          };
        }),
      moveTaskToParent: (draggedId, targetParentId) =>
        set((state) => {
          const dragged = state.tasksById[draggedId];
          if (!dragged) return state;
          if (dragged.status === "running" || dragged.status === "paused") {
            return state;
          }
          if (targetParentId === draggedId) return state;

          const targetParent = targetParentId
            ? state.tasksById[targetParentId]
            : undefined;
          if (targetParentId && !targetParent) return state;

          const newDepth = targetParent ? ((targetParent.depth + 1) as Task["depth"]) : 1;
          if (newDepth > 3 || newDepth < 1) return state;

          const descendants = getDescendants(draggedId, state.childrenByParentId);
          if (targetParentId && descendants.includes(targetParentId)) return state;

          const depthDelta = newDepth - dragged.depth;
          const nextTasksById = { ...state.tasksById };
          const nextChildren = { ...state.childrenByParentId };

          const sourceKey = parentKey(dragged.parentId);
          const sourceIds = nextChildren[sourceKey] ?? [];
          nextChildren[sourceKey] = sourceIds.filter((id) => id !== draggedId);
          updateOrderForParent(nextTasksById, nextChildren, dragged.parentId);

          const targetKey = parentKey(targetParentId);
          nextChildren[targetKey] = [...(nextChildren[targetKey] ?? []), draggedId];
          updateOrderForParent(nextTasksById, nextChildren, targetParentId);

          nextTasksById[draggedId] = {
            ...dragged,
            parentId: targetParentId,
            depth: newDepth
          };

          descendants.forEach((id) => {
            const child = nextTasksById[id];
            if (!child) return;
            const nextDepth = (child.depth + depthDelta) as Task["depth"];
            nextTasksById[id] = { ...child, depth: nextDepth };
          });

          return {
            tasksById: nextTasksById,
            childrenByParentId: nextChildren
          };
        }),
      indentTask: (taskId) => {
        const state = get();
        const task = state.tasksById[taskId];
        if (!task) return;
        if (task.status === "running" || task.status === "paused") return;
        const siblings = state.childrenByParentId[parentKey(task.parentId)] ?? [];
        const index = siblings.indexOf(taskId);
        if (index <= 0) return;
        const newParentId = siblings[index - 1];
        if (!newParentId) return;
        const parentTask = state.tasksById[newParentId];
        if (!parentTask || parentTask.depth >= 3) return;
        if (getDescendants(taskId, state.childrenByParentId).includes(newParentId)) {
          return;
        }
        state.moveTaskToParent(taskId, newParentId);
      },
      outdentTask: (taskId) => {
        const state = get();
        const task = state.tasksById[taskId];
        if (!task) return;
        if (task.status === "running" || task.status === "paused") return;
        if (!task.parentId) return;
        const parentTask = state.tasksById[task.parentId];
        const newParentId = parentTask?.parentId;
        state.moveTaskToParent(taskId, newParentId);
      },
      enforceFlat: () =>
        set((state) => {
          const needsFlatten = Object.values(state.tasksById).some(
            (task) => task.parentId || task.depth !== 1
          );
          if (!needsFlatten) return state;

          const orderedIds = flattenOrder(state.childrenByParentId);
          const nextTasksById: Record<string, Task> = { ...state.tasksById };
          orderedIds.forEach((id, index) => {
            const task = nextTasksById[id];
            if (!task) return;
            nextTasksById[id] = {
              ...task,
              parentId: undefined,
              depth: 1,
              order: index + 1
            };
          });

          return {
            tasksById: nextTasksById,
            childrenByParentId: {
              [ROOT_PARENT_ID]: orderedIds
            }
          };
        }),
    }),
    {
      name: "timebox-task-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (state) => {
        const legacy = state as { tasks?: Task[] };
        if (legacy?.tasks) {
          return {
            ...(state ?? {}),
            ...buildStateFromTasks(legacy.tasks)
          };
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
