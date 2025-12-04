import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import type { AppConfig } from '../../config/config'
import { createConfig } from '../../config/config'
import type { DbClient } from '../../infra/db'
import { getDb } from '../../infra/db'
import { DrizzleChangelogRepository } from '../../infra/db/changelog-repository.drizzle'
import { DrizzleToolsRepository } from '../../infra/db/tools-repository.drizzle'
import { DrizzleSyncLogsRepository } from '../../infra/db/sync-logs-repository.drizzle'
import { ChangelogService } from '../services/changelog-service'
import { ToolsService } from '../services/tools-service'
import { SyncLogsService } from '../services/sync-logs-service'

/**
 * Services container
 * All application services accessible from tRPC context
 */
export interface Services {
	tools: ToolsService
	changelog: ChangelogService
	syncLogs: SyncLogsService
}

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
	/** Application services */
	services: Services
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
		console.warn(
			'Database client not initialized:',
			error instanceof Error ? error.message : 'Unknown error',
		)
	}

	// User will be populated by Clerk authentication middleware later
	// For now, it's always null (unauthenticated)
	const user = null

	// Initialize services
	// Note: Services require DB, so they may throw if DB is not configured
	const toolsRepository = db ? new DrizzleToolsRepository(db) : null
	const changelogRepository = db ? new DrizzleChangelogRepository(db) : null
	const services: Services = {
		tools: toolsRepository ? new ToolsService(toolsRepository) : createNoOpToolsService(),
		changelog: changelogRepository
			? new ChangelogService(changelogRepository)
			: createNoOpChangelogService(),
		syncLogs: db ? new SyncLogsService(new DrizzleSyncLogsRepository(db)) : createNoOpSyncLogsService(),
	}

	return {
		db,
		config,
		user,
		services,
	}
}

/**
 * Creates a no-op ToolsService for when DB is not available
 * This allows the app to start without a database connection
 */
function createNoOpToolsService(): ToolsService {
	const noOpRepository = {
		listTools: async () => [],
	}
	return new ToolsService(noOpRepository)
}

function createNoOpChangelogService(): ChangelogService {
	const noOpRepository = {
		listChangelogByTool: async () => [],
	}
	return new ChangelogService(noOpRepository as any)
}

function createNoOpSyncLogsService(): SyncLogsService {
	const noOpRepository = {
		listByTool: async () => [],
		listRecentFailures: async () => [],
	}

	return new SyncLogsService(noOpRepository as any)
}

/**
 * Type helper to infer context type in procedures
 */
export type Context = TRPCContext
