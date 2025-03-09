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
export type SuccessResponseDto<T> = {
	status: 'success'
	data: T
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
  export type ErrorResponseDto = {
	status: 'error'
	error: string
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
  export type ValidationErrorResponseDto = {
	status: 'error'
	errors: Record<string, string>
  }
  