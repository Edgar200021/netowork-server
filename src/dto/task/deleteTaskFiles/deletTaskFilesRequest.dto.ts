import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

/**
 * @openapi
 * components:
 *   schemas:
 *     DeleteTaskFilesRequestDto:
 *       type: object
 *       properties:
 *         fileId:
 *           type: string
 *           description: File ID
 *           required: true
 */

export const deleteTaskFilesRequestSchema = vine.object({
	fileId: vine.string()
});

export const deleteTaskFilesRequestParamsSchema = vine.object({
	taskId: vine.number(),
});

export type DeleteTaskFilesRequestDto = InferInput<
	typeof deleteTaskFilesRequestSchema
>;
export type DeleteTaskFilesRequestParamsDto = InferInput<
	typeof deleteTaskFilesRequestParamsSchema
>;
