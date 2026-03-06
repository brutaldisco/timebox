# Timebox PWA Status

## Project goal
- Build a minimal, single-screen PWA timeboxing app (Next.js App Router + TypeScript + Tailwind).
- Fixed 5-minute blocks with centisecond display.
- Local-only persistence (Zustand + localStorage).

## Current progress
- App bootstrapped with Next.js App Router, Tailwind, and PWA manifest/icon.
- Timer logic implemented with performance.now() drift compensation.
- Task model/state persisted with Zustand.
- Task list UI with selection, inline title edit (IME-safe), and fixed-height rows.
- Task progress uses 4-bar (max 20 minutes) editable blocks, with remaining blocks highlighted.
- Drag reordering within a flat list works (dnd-kit).
- Data model flattened: all tasks are stored as a single level; visual indentation only.
- Sticky timer header stays visible while scrolling.
- Editing UX:
  - Enter splits at cursor and creates a new task below (keeps visual indent).
  - Backspace on empty deletes the task and focuses the previous task at line end.
  - Arrow Up/Down at line start/end navigates to adjacent task.
  - Tab/Shift+Tab while editing adjusts visual indent.
  - Ctrl/Cmd+X cut updates the input value normally.
- Current active task progress is shown in the header.

## Key design decisions and rationale
- **Flat task structure**: Tasks are stored as one-level data to avoid complex tree mutations and bugs. Visual indent is purely presentational.
- **Immediate interactions**: No confirm dialogs; edits and changes apply instantly.
- **Timer accuracy**: performance.now() used for elapsed time to handle sleep/background drift.
- **IME-friendly editing**: Composition events prevent premature commits.
- **PWA**: next-pwa and manifest/icon included; dev disables PWA by default.
- **Header visibility**: Timer header is sticky for constant visibility.

## Known issues / open questions
- Indentation is **visual only** and not persisted as hierarchy (intentional). If persistence is desired, a dedicated visual-indent store or metadata is needed.
- Timer start/stop is now only on the right-side round button; row click is selection only (intentional).
- Indent (Tab/Shift+Tab and swipe) operates on selected row, using a global keydown handler when not editing; while editing, TaskItem handles Tab keys locally.
- Ensure dnd-kit reorder and selection behaviors are intuitive on touch devices.

## Next steps
- Decide whether visual indent should persist across sessions (store in Zustand or derive).
- If desired, add a small, subtle hint for indent controls (without adding UI clutter).
- Consider adding tests or runtime sanity checks for timer + persistence.

## File map (key parts)
- `app/page.tsx` – main layout.
- `stores/useTaskStore.ts` – task state, flat storage, persistence.
- `stores/useTimerStore.ts` – timer state and tick logic.
- `components/TaskTree.tsx` – selection + reorder + indent/outdent wiring.
- `components/TaskItem.tsx` – row UI, editing, checkbox, timer button.
- `components/TaskProgress.tsx` – 4-slot block control.

