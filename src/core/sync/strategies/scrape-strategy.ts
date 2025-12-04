import { load as cheerioLoad } from 'cheerio'
import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'
import type { ExtractionContext, ExtractionStrategy } from './strategy'

export const ScrapeStrategy: ExtractionStrategy = {
	canHandle(tool: Tool): boolean {
		const url = tool.changelogUrl ?? tool.website ?? ''
		if (tool.scrapeConfig?.selectors?.entries) return true
		if (tool.strategyType === 'list-page' || tool.strategyType === 'card-detail') return true
		return url.includes('/changelog') || url.includes('/changelog/')
	},

	async extract(tool: Tool, ctx: ExtractionContext): Promise<ChangelogEntry[]> {
		const url = tool.changelogUrl
		if (!url) return []

		const html = await ctx.fetchHtml(url)
		if (!html || html.trim().length === 0) return []

		// Very small, forgiving parser — strategies should be pure and deterministic for tests
		const entries: ChangelogEntry[] = []
		let i = 0

		// Use cheerio to parse HTML and extract based on headings and surrounding container
		const $ = cheerioLoad(html)
		const headings = $('h1, h2, h3, h4, h5, h6')
		headings.each((_, el) => {
			const title = $(el).text().trim() || undefined

			// Look up the nearest container (article, li, div) or fallback to the heading's parent
			const container = $(el).closest('article, li, div').length
				? $(el).closest('article, li, div')
				: $(el).parent()

			const link = container.find('a').first()
			const time = container.find('time').first()

			const itemUrl = link.attr('href') ?? undefined
			const dateStr = time.attr('datetime') ?? time.text() ?? undefined
			const date = dateStr ? new Date(dateStr) : new Date()

			entries.push({
				id: `${tool.id}-${i++}-${Date.now()}`,
				toolId: tool.id,
				date,
				version: undefined,
				title,
				url: itemUrl,
				content: undefined,
			})
		})

		return entries
	},
}

export default ScrapeStrategy
