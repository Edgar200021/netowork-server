import vine from '@vinejs/vine';
import type {  InferInput } from '@vinejs/vine/types';


/**
 * @openapi
 * components:
 *   schemas:
 *     SetNewEmailRequestDto:
 *       type: object
 *       required:
 *         - newEmail
 *       properties:
 *         newEmail:
 *           type: string
 *           format: email
 */
export const setNewEmailSchema = vine.object({
	newEmail: vine.string().trim().email(),
});

export type SetNewEmailRequestDto = InferInput<typeof setNewEmailSchema>;