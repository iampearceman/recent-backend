/**
 * Tools tRPC Router
 * Handles tool-related API endpoints
 *
 * ❌ No DB logic here - all operations go through ToolsService
 * ✅ Uses schemas from app/schemas/tool.ts
 * ✅ Error handling delegated to global tRPC error formatter
 */

import { listToolsInputSchema, listToolsOutputSchema } from '../schemas/tool'
import { publicProcedure, router } from '../trpc/init'

export const toolsRouter = router({
	/**
	 * List tools with optional filtering
	 * Public endpoint - no authentication required
	 */
	list: publicProcedure
		.input(listToolsInputSchema)
		.output(listToolsOutputSchema)
		.query(async ({ input, ctx }) => {
			return ctx.services.tools.getToolsList(input)
		}),
})

export type ToolsRouter = typeof toolsRouter
