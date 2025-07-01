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

export const genUuid = () => {
	return "00000000-0000-0000-0000-000000000000";
};

export const imagePath = path.join(import.meta.dirname, "./assets/test.jpg");
export const pdfPath = path.join(
	import.meta.dirname,
	"./assets/rezhim-monaha_1.pdf",
);
export const txtPath = path.join(import.meta.dirname, "./assets/test.txt");
export const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
