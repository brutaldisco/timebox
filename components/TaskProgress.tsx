"use client";

type Props = {
  blocks: number;
  completedBlocks: number;
  onChangeBlocks?: (nextBlocks: number) => void;
};

const MAX_BLOCKS = 4;

export function TaskProgress({ blocks, completedBlocks, onChangeBlocks }: Props) {
  const handleClick = (index: number) => {
    if (!onChangeBlocks) return;
    const nextBlocks = Math.max(1, Math.min(MAX_BLOCKS, index + 1));
    onChangeBlocks(nextBlocks);
  };

  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_BLOCKS }).map((_, index) => (
          <span
            key={index}
            onClick={(event) => {
              event.stopPropagation();
              handleClick(index);
            }}
            className={`h-1.5 w-4 rounded-full transition ${
              index < blocks ? "bg-slate-500" : "bg-slate-800"
            } ${index < completedBlocks ? "bg-accent" : ""} ${
              onChangeBlocks ? "cursor-pointer hover:bg-slate-400" : ""
            }`}
          />
        ))}
      </div>
      <span>
        {completedBlocks}/{blocks}
      </span>
    </div>
  );
}
