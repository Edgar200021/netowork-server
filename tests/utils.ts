import path from "node:path";
import type { ValidationErrorResponseDto } from "../src/common/dto/base.dto.js";

export const createValidationError = (
	...fields: string[]
): ValidationErrorResponseDto => {
	const errors = fields.reduce(
		(acc, field) => {
			acc[field] = `${field} is not valid`;

			return acc;
		},
		{} as Record<string, string>,
	);

	return {
		status: "error",
		errors,
	};
};

export const createBaseError = () => {
	return {
		status: "error",
		error: "Something went wrong",
	};
};

export const imagePath = path.join(import.meta.dirname, "test.jpg");
