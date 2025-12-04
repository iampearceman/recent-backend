import type { Context } from 'hono'
import { Hono } from 'hono'
import { ZodError } from 'zod'
import { createErrorResponse } from './app/schemas/error-schema'
import { createConfig, type Env } from './config/config'
import { InternalError, isDomainError } from './core/shared/errors'

const app = new Hono<{ Bindings: Env }>()

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
app.onError((err, c: Context) => {
	console.error('Error caught:', err)

	// Handle DomainError types
	if (isDomainError(err)) {
		return c.json(
			createErrorResponse({
				code: err.code,
				message: err.message,
				details: err.details,
			}),
			err.statusCode as any,
		)
	}

	// Handle Zod validation errors
	if (err instanceof ZodError) {
		return c.json(
			createErrorResponse({
				code: 'VALIDATION_ERROR',
				message: 'Invalid request data',
				details: err.issues,
			}),
			400 as any,
		)
	}

	// Handle unknown errors
	const config = createConfig(c.env)
	const isInternalError = new InternalError('An unexpected error occurred')

	return c.json(
		createErrorResponse({
			code: isInternalError.code,
			message: isInternalError.message,
			// Only expose stack trace in development
			details: config.isDevelopment ? { stack: err.stack, message: err.message } : undefined,
		}),
		500 as any,
	)
})

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
