import { z } from 'zod'

/**
 * Standard API error response schema
 * Provides consistent error shape across all API responses
 */
export const ErrorResponseSchema = z.object({
	/**
	 * Error status - always 'error' for error responses
	 */
	status: z.literal('error'),

	/**
	 * Error code - machine-readable error identifier
	 * Examples: 'NOT_FOUND', 'VALIDATION_ERROR', 'INTERNAL_ERROR'
	 */
	code: z.string(),

	/**
	 * Human-readable error message
	 */
	message: z.string(),

	/**
	 * Additional error details (optional)
	 * Can include validation errors, stack traces in dev, etc.
	 */
	details: z.unknown().optional(),

	/**
	 * Request ID for tracing (optional)
	 */
	requestId: z.string().optional(),

	/**
	 * Timestamp when the error occurred
	 */
	timestamp: z.string().datetime(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * Helper function to create a standard error response
 */
export function createErrorResponse(params: {
	code: string
	message: string
	details?: unknown
	requestId?: string
}): ErrorResponse {
	return {
		status: 'error',
		code: params.code,
		message: params.message,
		details: params.details,
		requestId: params.requestId,
		timestamp: new Date().toISOString(),
	}
}
