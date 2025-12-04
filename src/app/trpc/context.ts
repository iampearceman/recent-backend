import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import type { AppConfig } from '../../config/config'
import { createConfig } from '../../config/config'
import type { DbClient } from '../../infra/db'
import { getDb } from '../../infra/db'

/**
 * tRPC context shape
 * This is what each tRPC procedure receives in its ctx parameter
 */
export interface TRPCContext {
	/** Database client instance (optional if DB_URL not configured) */
	db: DbClient | null
	/** Application configuration */
	config: AppConfig
	/** Authenticated user (will be populated by Clerk middleware later) */
	user: {
		id: string
		email?: string
	} | null
}

/**
 * Create tRPC context from request
 * This runs for every tRPC request and assembles the context object
 *
 * @param opts - Request options from tRPC fetch adapter
 * @returns Context object for tRPC procedures
 */
export function createContext(opts: FetchCreateContextFnOptions): TRPCContext {
	// Extract environment from request (Cloudflare Workers specific)
	const env = (opts.req as any).env

	// Create config from environment
	const config = createConfig(env)

	// Initialize database client (optional if DB_URL not configured)
	let db: DbClient | null = null
	try {
		db = getDb(env)
	} catch (error) {
		// Database is optional - log warning but continue
		console.warn('Database client not initialized:', error instanceof Error ? error.message : 'Unknown error')
	}

	// User will be populated by Clerk authentication middleware later
	// For now, it's always null (unauthenticated)
	const user = null

	return {
		db,
		config,
		user,
	}
}

/**
 * Type helper to infer context type in procedures
 */
export type Context = TRPCContext
