import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

/**
 * @openapi
 * components:
 *   schemas:
 *     VerifyAccountRequestDto:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 */
export const verifyAccountSchema = vine.object({
	token: vine.string(),
});

export type VerifyAccountRequestDto = InferInput<typeof verifyAccountSchema>;
