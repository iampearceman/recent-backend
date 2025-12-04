import { ChangelogByToolInputSchema, ChangelogByToolOutputSchema } from '../schemas/changelog'
import { publicProcedure, router } from '../trpc/init'

export const changelogRouter = router({
	listByTool: publicProcedure
		.input(ChangelogByToolInputSchema)
		.output(ChangelogByToolOutputSchema)
		.query(async ({ input, ctx }) => ctx.services.changelog.getChangelogByTool(input)),
})
