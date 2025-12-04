import type { Env } from '../../config/config'
import { createConfig } from '../../config/config'
import { createDb, type DbClient } from './client'

/**
 * Get database client for request handlers
 * Wraps config parsing and client creation
 * @param env - Environment bindings from Cloudflare Workers
 * @returns Drizzle database client instance
 */
export function getDb(env: Env): DbClient {
	const config = createConfig(env)
	return createDb(config)
}

// Re-export types and schema for convenience
export { createDb, type DbClient } from './client'
export * as schema from './schema'
