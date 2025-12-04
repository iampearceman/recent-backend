/**
 * Base domain error class
 * All domain-specific errors should extend this class
 */
export class DomainError extends Error {
	public readonly code: string
	public readonly statusCode: number
	public readonly details?: unknown

	constructor(message: string, code: string, statusCode: number, details?: unknown) {
		super(message)
		this.name = this.constructor.name
		this.code = code
		this.statusCode = statusCode
		this.details = details

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if ((Error as any).captureStackTrace) {
			;(Error as any).captureStackTrace(this, this.constructor)
		}
	}
}

/**
 * Not Found Error (404)
 * Thrown when a requested resource does not exist
 */
export class NotFoundError extends DomainError {
	constructor(message = 'Resource not found', details?: unknown) {
		super(message, 'NOT_FOUND', 404, details)
	}
}

/**
 * Validation Error (400)
 * Thrown when input validation fails
 */
export class ValidationError extends DomainError {
	constructor(message = 'Validation failed', details?: unknown) {
		super(message, 'VALIDATION_ERROR', 400, details)
	}
}

/**
 * Unauthorized Error (401)
 * Thrown when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends DomainError {
	constructor(message = 'Authentication required', details?: unknown) {
		super(message, 'UNAUTHORIZED', 401, details)
	}
}

/**
 * Forbidden Error (403)
 * Thrown when user lacks permission to access a resource
 */
export class ForbiddenError extends DomainError {
	constructor(message = 'Access forbidden', details?: unknown) {
		super(message, 'FORBIDDEN', 403, details)
	}
}

/**
 * Conflict Error (409)
 * Thrown when a request conflicts with current state (e.g., duplicate resource)
 */
export class ConflictError extends DomainError {
	constructor(message = 'Resource conflict', details?: unknown) {
		super(message, 'CONFLICT', 409, details)
	}
}

/**
 * Internal Error (500)
 * Thrown for unexpected server errors
 */
export class InternalError extends DomainError {
	constructor(message = 'Internal server error', details?: unknown) {
		super(message, 'INTERNAL_ERROR', 500, details)
	}
}

/**
 * Bad Request Error (400)
 * Thrown when request is malformed or invalid
 */
export class BadRequestError extends DomainError {
	constructor(message = 'Bad request', details?: unknown) {
		super(message, 'BAD_REQUEST', 400, details)
	}
}

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
	return error instanceof DomainError
}
