import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'
import type { ExtractionContext, ExtractionStrategy } from './strategy'

export const ManualStrategy: ExtractionStrategy = {
	canHandle(tool: Tool): boolean {
		// Manual strategy is used for tools which have no automatic scrape config and are flagged manual
		return !tool.scrapeConfig && !tool.changelogUrl
	},

	async extract(_tool: Tool, _ctx: ExtractionContext): Promise<ChangelogEntry[]> {
		// Manual entries must be created by humans - nothing to extract automatically
		return []
	},
}

export default ManualStrategy
