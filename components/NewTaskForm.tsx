"use client";

import { useState } from "react";
import { useTaskStore } from "@/stores/useTaskStore";

export function NewTaskForm() {
  const addTask = useTaskStore((state) => state.addTask);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(1);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      blocks: Math.max(1, blocks)
    });
    setTitle("");
    setBlocks(1);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800/70 bg-slate-900/50 px-5 py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新しいタスク"
          className="flex-1 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="number"
          min={1}
          value={blocks}
          onChange={(event) => setBlocks(Number(event.target.value))}
          className="w-20 rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
        >
          追加
        </button>
      </div>
    </form>
  );
}
