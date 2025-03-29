import { AppError } from "../services/common/error.js";
import type { User } from "../storage/postgres/types/user.types.js";

export type UserError = {
	message: string;
	statusCode: number;
	error: AppError;
};

export const generateUserError = (
	user: User | undefined,
	options?: Partial<{
		notFoundMessage: string;
		notVerifiedMessage: string;
		bannedMessage: string;
		notFoundCode: 404 | 400;
	}>,
): UserError => {
	const message =
		(!user
			? (options?.notFoundMessage ?? "User not found")
			: !user.isVerified
				? (options?.notVerifiedMessage ?? "User is not verified")
				: (options?.bannedMessage ?? "User is banned")) ?? "User doesn't exist";

	const statusCode = !user
		? (options?.notFoundCode ?? 404)
		: !user.isVerified
			? 400
			: 403;

	return {
		message,
		statusCode,
		error: new AppError(message, statusCode),
	};
};
