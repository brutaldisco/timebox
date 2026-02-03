import { Task } from "@/lib/types";

export const seedTasks: Task[] = [
  {
    id: "t-morning",
    title: "朝のルーティン",
    depth: 1,
    blocks: 1,
    completedBlocks: 0,
    status: "idle",
    order: 1
  },
  {
    id: "t-english",
    title: "英語",
    depth: 2,
    parentId: "t-morning",
    blocks: 1,
    completedBlocks: 0,
    status: "idle",
    order: 1
  },
  {
    id: "t-instant",
    title: "瞬間英作文",
    depth: 3,
    parentId: "t-english",
    blocks: 2,
    completedBlocks: 0,
    status: "idle",
    order: 1
  },
  {
    id: "t-shadowing",
    title: "シャドーイング",
    depth: 3,
    parentId: "t-english",
    blocks: 1,
    completedBlocks: 0,
    status: "idle",
    order: 2
  },
  {
    id: "t-health",
    title: "体調管理",
    depth: 2,
    parentId: "t-morning",
    blocks: 1,
    completedBlocks: 0,
    status: "idle",
    order: 2
  },
  {
    id: "t-stretch",
    title: "ストレッチ",
    depth: 3,
    parentId: "t-health",
    blocks: 1,
    completedBlocks: 0,
    status: "idle",
    order: 1
  }
];
