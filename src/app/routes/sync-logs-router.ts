import { RecentFailuresInputSchema, RecentFailuresOutputSchema, SyncLogsByToolInputSchema, SyncLogsByToolOutputSchema } from '../schemas/sync-logs'
import { publicProcedure, router } from '../trpc/init'

export const syncLogsRouter = router({
	listByTool: publicProcedure
		.input(SyncLogsByToolInputSchema)
		.output(SyncLogsByToolOutputSchema)
		.query(async ({ input, ctx }) => ctx.services.syncLogs.listByTool(input)),

	recentFailures: publicProcedure
		.input(RecentFailuresInputSchema)
		.output(RecentFailuresOutputSchema)
		.query(async ({ input, ctx }) => ctx.services.syncLogs.recentFailures(input)),
})
