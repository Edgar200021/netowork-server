import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

/**
 * @openapi
 * components:
 *   schemas:
 *     ForgotPasswordRequestDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           default: "6L2W9@example.com"
 */
export const forgotPasswordSchema = vine.object({
	email: vine.string().trim().email(),
});

export type ForgotPasswordRequestDto = InferInput<typeof forgotPasswordSchema>;
