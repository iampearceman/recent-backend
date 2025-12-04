import { z } from 'zod'
import { publicProcedure, router } from '../trpc/init'
import { changelogRouter } from './changelog-router'
import { toolsRouter } from './tools-router'

/**
 * Root tRPC router
 * All feature routers will be merged here
 */
export const appRouter = router({
	/**
	 * Health check query
	 * Returns the API health status
	 */
	health: publicProcedure
		.output(
			z.object({
				status: z.literal('ok'),
				timestamp: z.string(),
			}),
		)
		.query(() => {
			return {
				status: 'ok' as const,
				timestamp: new Date().toISOString(),
			}
		}),

	/**
	 * Tools router - handles tool CRUD operations
	 */
	tools: toolsRouter,

	/**
	 * Changelog router - handles changelog queries
	 */
	changelog: changelogRouter,
	// sync: syncRouter,
})

/**
 * Export type router type for use in client
 */
export type AppRouter = typeof appRouter
