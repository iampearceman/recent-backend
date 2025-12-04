import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'
import type { ExtractionContext, ExtractionStrategy } from './strategy'

export const RssStrategy: ExtractionStrategy = {
	canHandle(tool: Tool): boolean {
		const url = tool.changelogUrl ?? ''
		return tool.strategyType === 'rss-feed' || url.includes('/feed') || url.endsWith('.xml')
	},

	async extract(tool: Tool, ctx: ExtractionContext): Promise<ChangelogEntry[]> {
		const url = tool.changelogUrl
		if (!url) return []

		const xml = await ctx.fetchHtml(url)
		if (!xml) return []

		// Very small parser for RSS <item> blocks
		const items: ChangelogEntry[] = []
		const itemRe =
			/<item[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?(?:<pubDate>([\s\S]*?)<\/pubDate>)?/gi
		let m: RegExpExecArray | null
		let i = 0
		while (true) {
			m = itemRe.exec(xml)
			if (!m) break
			const title = m[1]?.trim() || undefined
			const link = m[2]?.trim() || undefined
			const dateStr = m[3]
			const date = dateStr ? new Date(dateStr) : new Date()

			items.push({
				id: `${tool.id}-rss-${i++}-${Date.now()}`,
				toolId: tool.id,
				date,
				version: undefined,
				title,
				url: link,
				content: undefined,
			})
		}

		return items
	},
}

export default RssStrategy
