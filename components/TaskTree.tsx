"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ROOT_PARENT_ID, useTaskStore } from "@/stores/useTaskStore";
import type { Task } from "@/lib/types";
import { TaskItem } from "@/components/TaskItem";

type VisibleTask = {
  task: Task;
  indentLevel: 0 | 1 | 2;
};

export function TaskTree() {
  const tasksById = useTaskStore((state) => state.tasksById);
  const childrenByParentId = useTaskStore((state) => state.childrenByParentId);
  const moveTask = useTaskStore((state) => state.moveTask);
  const hasHydrated = useTaskStore((state) => state.hasHydrated);
  const enforceFlat = useTaskStore((state) => state.enforceFlat);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [indentLevels, setIndentLevels] = useState<Record<string, 0 | 1 | 2>>(
    {}
  );
  const hasFlattenedRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );


  useEffect(() => {
    if (!hasHydrated || hasFlattenedRef.current) return;
    enforceFlat();
    hasFlattenedRef.current = true;
  }, [enforceFlat, hasHydrated]);

  const getChildren = (parentId?: string) => {
    const key = parentId ?? ROOT_PARENT_ID;
    return childrenByParentId[key] ?? [];
  };

  useEffect(() => {
    setIndentLevels((prev) => {
      const next: Record<string, 0 | 1 | 2> = {};
      const ids = getChildren(undefined);
      ids.forEach((id) => {
        next[id] = prev[id] ?? 0;
      });
      return next;
    });
  }, [childrenByParentId]);

  const visibleTasks = useMemo<VisibleTask[]>(() => {
    const rootChildren = getChildren(undefined);
    return rootChildren
      .map((id) => tasksById[id])
      .filter(Boolean)
      .map((task) => ({
        task,
        indentLevel: indentLevels[task.id] ?? 0
      }));
  }, [childrenByParentId, indentLevels, tasksById]);

  const visibleIds = useMemo(
    () => visibleTasks.map((item) => item.task.id),
    [visibleTasks]
  );

  useEffect(() => {
    if (!selectedTaskId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        const isEditable =
          tag === "input" ||
          tag === "textarea" ||
          target.isContentEditable ||
          target.getAttribute("role") === "textbox";
        if (isEditable) return;
      }
      event.preventDefault();
      setIndentLevels((prev) => {
        const current = prev[selectedTaskId] ?? 0;
        const next = event.shiftKey
          ? Math.max(0, current - 1)
          : Math.min(2, current + 1);
        return { ...prev, [selectedTaskId]: next as 0 | 1 | 2 };
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTaskId]);

  const canReorderWithinParent = (draggedId: string, targetId: string) => {
    const dragged = tasksById[draggedId];
    const target = tasksById[targetId];
    if (!dragged || !target) return false;
    if (dragged.id === target.id) return false;
    return dragged.parentId === target.parentId;
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeIdValue = String(active.id);
    const overIdValue = String(over.id);
    if (!canReorderWithinParent(activeIdValue, overIdValue)) return;
    const siblings = getChildren(tasksById[activeIdValue]?.parentId);
    const activeIndex = siblings.indexOf(activeIdValue);
    const overIndex = siblings.indexOf(overIdValue);
    const placeAfter =
      activeIndex !== -1 && overIndex !== -1 && activeIndex < overIndex;
    moveTask(activeIdValue, overIdValue, placeAfter);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
        <div className="mt-10 space-y-1">
          {visibleTasks.map(({ task, indentLevel }) => (
            <TaskItem
              key={task.id}
              task={task}
              depth={(indentLevel + 1) as 1 | 2 | 3}
              isSelected={selectedTaskId === task.id}
              onSelect={setSelectedTaskId}
              onIndent={(id) =>
                setIndentLevels((prev) => ({
                  ...prev,
                  [id]: Math.min(2, (prev[id] ?? 0) + 1) as 0 | 1 | 2
                }))
              }
              onOutdent={(id) =>
                setIndentLevels((prev) => ({
                  ...prev,
                  [id]: Math.max(0, (prev[id] ?? 0) - 1) as 0 | 1 | 2
                }))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
