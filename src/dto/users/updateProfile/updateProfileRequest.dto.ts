import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";

import {
	MAX_ABOUT_ME_LENGTH,
	MAX_FIRST_NAME_LENGTH,
	MAX_LAST_NAME_LENGTH,
} from "../../../const/validator.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateProfileRequestDto:
 *       type: object
 *       properties:
 *         aboutMe:
 *           type: string
 *           maxLength: 1000
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *           maxLength: 50
 *         lastName:
 *           type: string
 *           maxLength: 50
 */
export const updateProfileSchema = vine.object({
	aboutMe: vine.string().trim().maxLength(MAX_ABOUT_ME_LENGTH).optional(),
	email: vine.string().trim().email().optional(),
	firstName: vine.string().trim().maxLength(MAX_FIRST_NAME_LENGTH).optional(),
	lastName: vine.string().trim().maxLength(MAX_LAST_NAME_LENGTH).optional(),
});

export type UpdateProfileRequestDto = InferInput<typeof updateProfileSchema>;
