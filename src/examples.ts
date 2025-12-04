/**
 * Example: How to use the config, errors, and error handling system
 *
 * This file demonstrates best practices for using the foundational utilities.
 */

import type { Context } from 'hono'
import { Hono } from 'hono'
import { createConfig, type Env } from './config/config'
import { NotFoundError, UnauthorizedError, ValidationError } from './core/shared/errors'

const exampleRouter = new Hono<{ Bindings: Env }>()

/**
 * Example 1: Using config
 */
exampleRouter.get('/config-example', (c: Context) => {
	const config = createConfig(c.env)

	return c.json({
		environment: config.environment,
		isDevelopment: config.isDevelopment,
		hasOpenAI: !!config.openai.apiKey,
	})
})

/**
 * Example 2: Throwing domain errors (will be caught by global error handler)
 */
exampleRouter.get('/user/:id', (c: Context) => {
	const userId = c.req.param('id')

	// Simulate user lookup
	if (userId !== '123') {
		throw new NotFoundError(`User with ID ${userId} not found`)
	}

	return c.json({ id: userId, name: 'John Doe' })
})

/**
 * Example 3: Validation errors with details
 */
exampleRouter.post('/validate-example', async (c: Context) => {
	const body = await c.req.json()

	if (!body.email) {
		throw new ValidationError('Email is required', {
			field: 'email',
			reason: 'missing_field',
		})
	}

	if (!body.email.includes('@')) {
		throw new ValidationError('Invalid email format', {
			field: 'email',
			reason: 'invalid_format',
			provided: body.email,
		})
	}

	return c.json({ message: 'Validation passed' })
})

/**
 * Example 4: Authorization errors
 */
exampleRouter.get('/protected', (c: Context) => {
	const authHeader = c.req.header('Authorization')

	if (!authHeader) {
		throw new UnauthorizedError('Authorization header is required')
	}

	return c.json({ message: 'Access granted' })
})

/**
 * Example 5: Environment-based behavior
 */
exampleRouter.get('/env-example', (c: Context) => {
	const config = createConfig(c.env)

	if (config.isDevelopment) {
		return c.json({
			message: 'Development mode - showing debug info',
			debug: {
				env: config.environment,
				timestamp: new Date().toISOString(),
			},
		})
	}

	return c.json({ message: 'Production mode' })
})

export default exampleRouter
