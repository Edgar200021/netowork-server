import type { TaskFiles } from "../storage/db.js";
import type { Category } from "../storage/postgres/types/category.type.js";
import type { TaskReply } from "../storage/postgres/types/task-reply.type.js";
import type { Task } from "../storage/postgres/types/task.type.js";
import type { User } from "../storage/postgres/types/user.types.js";

export type TasksSort =
	`${Extract<keyof Task, "createdAt" | "price">}-${"desc" | "asc"}`;

export type TaskReturn = Omit<Task, "notifyAboutReplies"> & {
	category: Category["name"];
	subcategory: Category["name"] | null;
	creator: `${User["firstName"]} ${User["lastName"]}`;
	files: Pick<TaskFiles, "fileId" | "fileUrl" | "fileName">[];
	views?: number;
};

export type MyTaskRepliesReturn = Pick<
	TaskReply,
	"createdAt" | "description" | "id"
> & {
	freelancer: Pick<User, "avatar" | "firstName" | "lastName" | "id">;
};
