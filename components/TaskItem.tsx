"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { useTimerStore } from "@/stores/useTimerStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { TaskProgress } from "@/components/TaskProgress";

type Props = {
  task: Task;
  depth: 1 | 2 | 3;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
};

export function TaskItem({
  task,
  depth,
  isSelected,
  onSelect,
  onIndent,
  onOutdent
}: Props) {
  const updateTask = useTaskStore((state) => state.updateTask);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });
  const handleTimerClick = () => {
    const perfNow = performance.now();
    useTimerStore.getState().handleTaskClick(task.id, perfNow);
  };
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const startEdit = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    setDraftTitle(task.title);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const nextTitle = draftTitle.trim();
    if (nextTitle && nextTitle !== task.title) {
      updateTask(task.id, { title: nextTitle });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftTitle(task.title);
    setIsEditing(false);
  };

  useLayoutEffect(() => {
    if (!isEditing) return;
    const el = measureRef.current;
    if (!el) return;
    const width = Math.ceil(el.offsetWidth);
    setInputWidth(Math.max(16, width));
  }, [draftTitle, isEditing]);

  const isCompleted = task.status === "completed";

  const handleIndent = () => {
    if (task.status === "running" || task.status === "paused") return;
    onIndent(task.id);
  };

  const handleOutdent = () => {
    if (task.status === "running" || task.status === "paused") return;
    onOutdent(task.id);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isEditing) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isEditing) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) {
      handleIndent();
    } else {
      handleOutdent();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        marginLeft: `${(depth - 1) * 20}px`,
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <div
        {...(isEditing ? {} : attributes)}
        {...(isEditing ? {} : listeners)}
        ref={rowRef}
        onClick={() => {
          onSelect(task.id);
          rowRef.current?.focus();
        }}
        onFocus={() => {
          if (!isSelected) {
            onSelect(task.id);
          }
        }}
        onBlur={() => {
          // no-op to keep selection until another row focuses
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        className={`group flex h-[62px] items-center justify-between rounded-md border px-4 py-2 transition duration-150 outline-none ${
          task.status === "completed"
            ? "opacity-60"
            : "opacity-100"
        } ${
          isSelected ? "border-accent/60" : "border-slate-900/60"
        } bg-slate-900/40 hover:border-slate-700/70 cursor-text ${
          isDragging ? "opacity-80" : ""
        }`}
      >
        <div className="flex flex-1 items-center gap-3 text-left">
          <span
            className={`mr-1 self-stretch ${
              isSelected ? "w-px bg-accent/70" : "w-px bg-transparent"
            }`}
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isCompleted) {
                useTaskStore.getState().resetTask(task.id);
              } else {
                useTaskStore.getState().updateTask(task.id, {
                  status: "completed",
                  completedBlocks: task.blocks
                });
              }
            }}
            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
              isCompleted
                ? "border-accent/70 bg-accent/70"
                : "border-slate-500 bg-transparent"
            }`}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted ? (
              <svg
                className="h-3 w-3 text-slate-950"
                viewBox="0 0 12 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M1 5l3 3 7-7" />
              </svg>
            ) : null}
          </button>
          <div className="flex-1">
            {isEditing ? (
              <div className="relative flex h-[20px] items-center">
                <span
                  ref={measureRef}
                  className="pointer-events-none absolute left-0 top-0 -z-10 whitespace-pre text-sm font-medium leading-[20px] text-transparent"
                >
                  {draftTitle || " "}
                </span>
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => {
                    if (!isComposing) {
                      commitEdit();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      if (!isComposing) {
                        commitEdit();
                      }
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEdit();
                    }
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onPointerDown={(event) => event.stopPropagation()}
                  style={{ width: inputWidth ? `${inputWidth}px` : "auto" }}
                  className="h-[20px] bg-transparent px-0 py-0 text-sm font-medium leading-[20px] text-slate-100 focus:outline-none"
                />
              </div>
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={startEdit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    startEdit(event as unknown as MouseEvent<HTMLSpanElement>);
                  }
                }}
                className={`flex h-[20px] items-center text-sm font-medium leading-[20px] ${
                  task.status === "completed"
                    ? "text-slate-400 line-through"
                    : "text-slate-100"
                }`}
              >
                {task.title}
              </span>
            )}
            <div className="mt-2">
              <TaskProgress
                blocks={task.blocks}
                completedBlocks={task.completedBlocks}
                onChangeBlocks={(nextBlocks) => {
                  const nextCompleted = Math.min(task.completedBlocks, nextBlocks);
                  updateTask(task.id, {
                    blocks: nextBlocks,
                    completedBlocks: nextCompleted,
                    status:
                      nextCompleted >= nextBlocks ? "completed" : task.status
                  });
                }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(task.id);
            handleTimerClick();
          }}
          className={`ml-4 flex h-8 w-8 items-center justify-center rounded-full border text-slate-100 transition ${
            task.status === "running"
              ? "border-accent/70 bg-slate-900/80 opacity-100"
              : "border-slate-800/70 bg-slate-900/60 opacity-0 group-hover:opacity-100"
          }`}
          aria-label={task.status === "running" ? "Stop timer" : "Start timer"}
        >
          {task.status === "running" ? (
            <span className="block h-3 w-3 rounded-sm bg-slate-100" />
          ) : (
            <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-slate-100" />
          )}
        </button>
      </div>
    </div>
  );
}
