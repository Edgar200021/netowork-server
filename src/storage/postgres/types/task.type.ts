import type { Insertable, Selectable, Updateable } from "kysely";
import type { Task as T } from "../../db.js";

export type Task = Selectable<T>;
export type NewTask = Insertable<T>;
export type TaskUpdate = Updateable<T>;
