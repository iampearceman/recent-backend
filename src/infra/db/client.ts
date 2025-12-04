import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import type { AppConfig } from '../../config/config'
import * as schema from './schema'

/**
 * Create a Drizzle database client
 * @param config - Application configuration
 * @returns Drizzle database client instance
 */
export function createDb(config: AppConfig) {
	if (!config.database.url) {
		throw new Error('Database URL is required to create database client')
	}

	// Create Neon HTTP client
	const sql = neon(config.database.url)

	// Create and return Drizzle client with schema
	return drizzle(sql, { schema: schema as any })
}

export type DbClient = ReturnType<typeof createDb>
