import type { Task } from '../storage/postgres/types/task.type.js';

export type TasksSort = `${Extract<keyof Task, "createdAt" | "price">}-${"desc" | "asc"}`