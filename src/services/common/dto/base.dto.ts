/**
 * @openapi
 * components:
 *   schemas:
 *     SuccessResponseDto:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           default: "success"
 *         data:
 *           type: object
 */
export class SuccessResponseDto<T> {
	readonly status = "success" as const;
	constructor(readonly data: T) {}
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponseDto:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           default: "error"
 *         error:
 *           type: string
 *           example: "Something went wrong"
 */
export class ErrorResponseDto {
	readonly status = "error" as const;
	constructor(readonly error: string) {}
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ValidationErrorResponseDto:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           default: "error"
 *         errors:
 *           type: object
 *           example:
 *             "email": "Email is not valid"
 *             "password": "Password must be at least 8 characters"
 */
export class ValidationErrorResponseDto {
	readonly status = "error" as const;
	constructor(readonly errors: Record<string, string>) {}
}
