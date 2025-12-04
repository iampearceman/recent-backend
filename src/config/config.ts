import { z } from 'zod'

/**
 * Environment bindings schema
 * Define the shape of environment variables from Cloudflare Workers bindings
 */
const EnvSchema = z.object({
	// Database
	DB_URL: z.string().optional(),

	// API Keys
	OPENAI_API_KEY: z.string().optional(),

	// Environment
	ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),

	// Add other bindings as needed
})

export type Env = z.infer<typeof EnvSchema>

/**
 * Application configuration
 * Typed configuration object derived from environment bindings
 */
export interface AppConfig {
	database: {
		url?: string
	}
	openai: {
		apiKey?: string
	}
	environment: 'development' | 'staging' | 'production'
	isDevelopment: boolean
	isProduction: boolean
}

/**
 * Parse and validate environment bindings
 * @param env - Raw environment bindings from Cloudflare Workers
 * @returns Validated and typed environment object
 */
export function parseEnv(env: unknown): Env {
	const result = EnvSchema.safeParse(env)

	if (!result.success) {
		throw new Error(`Invalid environment configuration: ${result.error.message}`)
	}

	return result.data
}

/**
 * Create application configuration from environment bindings
 * @param env - Environment bindings from Cloudflare Workers
 * @returns Typed AppConfig object
 */
export function createConfig(env: unknown): AppConfig {
	const validatedEnv = parseEnv(env)

	return {
		database: {
			url: validatedEnv.DB_URL,
		},
		openai: {
			apiKey: validatedEnv.OPENAI_API_KEY,
		},
		environment: validatedEnv.ENVIRONMENT,
		isDevelopment: validatedEnv.ENVIRONMENT === 'development',
		isProduction: validatedEnv.ENVIRONMENT === 'production',
	}
}
