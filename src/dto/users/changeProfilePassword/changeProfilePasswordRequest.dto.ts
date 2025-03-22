import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { MIN_PASSWORD_LENGTH } from "../../../const/validator.js";

export const changeProfilePasswordSchema = vine.object({
	oldPassword: vine.string().trim(),
	newPassword: vine
		.string()
		.trim()
		.minLength(MIN_PASSWORD_LENGTH)
		.confirmed({ confirmationField: "newPasswordConfirmation" })
		.notSameAs("oldPassword"),
});

export type ChangeProfilePasswordRequestDto = InferInput<
	typeof changeProfilePasswordSchema
>;
