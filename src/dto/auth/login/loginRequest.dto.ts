import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { MIN_PASSWORD_LENGTH } from "../../../const/validator.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequestDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           default: "6L2W9@example.com"
 *         password:
 *           type: string
 *           minLength: 8
 *           default: "password"
 */
export const loginSchema = vine.object({
	email: vine.string().trim().email(),
	password: vine.string().trim().minLength(MIN_PASSWORD_LENGTH),
});

export type LoginRequestDto = InferInput<typeof loginSchema>;
