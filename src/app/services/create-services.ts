import type { Env } from '../../config/config'
import { getDb } from '../../infra/db'
import { DrizzleToolsRepository } from '../../infra/db/tools-repository.drizzle'
import { ToolsService } from './tools-service'

/**
 * Minimal services factory used by background jobs.
 * Keep Cloudflare env handling minimal and isolated here.
 *
 * NOTE: this file intentionally keeps behavior conservative — jobs tests should
 * mock the returned object when more complex behavior is required.
 */
export function createServices(env: Env) {
	// Try to initialise DB-backed repositories; gracefully fallback to no-op
	// implementations when DB isn't configured.
	let toolsRepo: any = null

	try {
		const db = getDb(env)
		toolsRepo = new DrizzleToolsRepository(db)
	} catch (error) {
		console.warn(
			'createServices: database not available, falling back to no-op tools repository',
			error instanceof Error ? error.message : String(error),
		)
		toolsRepo = {
			// default no-op — return an empty list
			listTools: async () => [],
		}
	}

	const toolsService = new ToolsService(toolsRepo)

	// Augment the tools service with a convenient helper used by cron job.
	// This is intentionally simple: it loads tools and returns them as-is. Tests
	// can mock getToolsEligibleForSync to return any subset they need.
	const toolsWithEligibility = Object.assign({}, toolsService, {
		async getToolsEligibleForSync() {
			const items = await toolsRepo.listTools({ limit: 1000 })
			return items
		},
	})

	// No queue producer by default — jobs should either call the sync service
	// directly or tests can provide a queue via a mocked createServices.
	return {
		tools: toolsWithEligibility,
		// sync and queue producers intentionally omitted here
	}
}

export default createServices
