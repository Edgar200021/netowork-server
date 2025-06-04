import type { User } from "../../storage/postgres/types/user.types.js";
import type { MyTaskRepliesReturn } from "../../types/tasks.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     MyTaskRepliesResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         freelancer:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             avatar:
 *               type: string
 */
export class MyTaskRepliesResponseDto {
	id: string;
	description: string;
	createdAt: Date;
	freelancer: Pick<User, "avatar" | "firstName" | "lastName" | "id">;

	constructor(taskReply: MyTaskRepliesReturn) {
		this.id = taskReply.id;
		this.description = taskReply.description;
		this.createdAt = taskReply.createdAt;
		this.freelancer = taskReply.freelancer;
	}
}
