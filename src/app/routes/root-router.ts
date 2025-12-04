import { z } from 'zod'
import { publicProcedure, router } from '../trpc/init'

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

	// Future routers will be merged here:
	// tools: toolsRouter,
	// changelog: changelogRouter,
	// sync: syncRouter,
})

/**
 * Export type router type for use in client
 */
export type AppRouter = typeof appRouter
