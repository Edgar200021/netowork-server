import type { Insertable, Selectable, Updateable } from 'kysely';
import type { TaskReplies } from '../../db.js';

export type TaskReply = Selectable<TaskReplies>
export type NewTaskReply = Insertable<TaskReplies>
export type TaskReplyUpdate = Updateable<TaskReplies>