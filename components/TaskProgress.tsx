"use client";

type Props = {
  blocks: number;
  completedBlocks: number;
  onChangeBlocks?: (nextBlocks: number) => void;
  size?: "sm" | "md";
};

const MAX_BLOCKS = 4;

export function TaskProgress({
  blocks,
  completedBlocks,
  onChangeBlocks,
  size = "sm"
}: Props) {
  const remainingBlocks = Math.max(0, blocks - completedBlocks);
  const dotClass = size === "md" ? "h-2 w-6" : "h-1.5 w-4";
  const textClass = size === "md" ? "text-sm" : "text-xs";
  const handleClick = (index: number) => {
    if (!onChangeBlocks) return;
    const nextBlocks = Math.max(1, Math.min(MAX_BLOCKS, index + 1));
    onChangeBlocks(nextBlocks);
  };

  return (
    <div className={`flex items-center gap-3 text-slate-400 ${textClass}`}>
      <div className="flex items-center gap-1">
        {Array.from({ length: MAX_BLOCKS }).map((_, index) => (
          <span
            key={index}
            onClick={(event) => {
              event.stopPropagation();
              handleClick(index);
            }}
            className={`${dotClass} rounded-full transition ${
              index < remainingBlocks
                ? "bg-accent"
                : index < blocks
                ? "bg-slate-800"
                : "bg-slate-900/40"
            } ${
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
