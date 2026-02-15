"use client";

import { useEffect } from "react";
import { TimerDisplay } from "@/components/TimerDisplay";
import { CurrentTaskHeader } from "@/components/CurrentTaskHeader";
import { TaskTree } from "@/components/TaskTree";
import { TimerEngine } from "@/components/TimerEngine";
import { useTaskStore } from "@/stores/useTaskStore";

export default function HomePage() {
  const hasHydrated = useTaskStore((state) => state.hasHydrated);
  const taskCount = useTaskStore(
    (state) => Object.keys(state.tasksById).length
  );
  const seedIfNeeded = useTaskStore((state) => state.seedIfNeeded);

  useEffect(() => {
    if (hasHydrated && taskCount === 0) {
      seedIfNeeded();
    }
  }, [hasHydrated, taskCount, seedIfNeeded]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10 sm:px-10">
      <TimerEngine />
      <header className="sticky top-0 z-10 rounded-2xl border border-slate-800/70 bg-slate-950/85 px-6 py-10 shadow-xl shadow-slate-950/40 backdrop-blur">
        <TimerDisplay />
        <CurrentTaskHeader />
      </header>
      <section className="mt-6">
        <TaskTree />
      </section>
    </main>
  );
}
