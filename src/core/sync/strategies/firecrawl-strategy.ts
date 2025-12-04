import { load as cheerioLoad } from 'cheerio'
import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'
import type { ExtractionContext, ExtractionStrategy } from './strategy'

export const FirecrawlStrategy: ExtractionStrategy = {
	canHandle(tool: Tool): boolean {
		const url = tool.changelogUrl ?? ''
		if (url.includes('firecrawl')) return true
		// Firecrawl can also be requested by using twoStepExtraction configuration
		return !!tool.scrapeConfig?.twoStepExtraction
	},

	async extract(tool: Tool, ctx: ExtractionContext): Promise<ChangelogEntry[]> {
		// Firecrawl expects a list page followed by detail pages. For tests we'll perform a single pass.
		const url = tool.changelogUrl
		if (!url) return []

		const html = await ctx.fetchHtml(url)
		if (!html) return []

		// Very similar to ScrapeStrategy but prefer `detailPageSelector` if present
		const entries: ChangelogEntry[] = []
		const $ = cheerioLoad(html)
		let i = 0

		// Collect potential links from list page (a elements). Prefer long text or hrefs.
		const anchors = $('a')
		for (let idx = 0; idx < anchors.length; idx++) {
			const a = anchors.eq(idx)
			const itemUrl = a.attr('href') ?? undefined
			const title = (a.text() || a.attr('title') || '').trim() || undefined

			let detailHtml = html
			if (tool.scrapeConfig?.twoStepExtraction && itemUrl) {
				try {
					detailHtml = await ctx.fetchHtml(itemUrl)
				} catch (_e) {
					detailHtml = ''
				}
			}

			const $detail = cheerioLoad(detailHtml || '')
			const timeEl = $detail('time').first()
			const dateStr = timeEl.attr('datetime') ?? timeEl.text() ?? undefined
			const date = dateStr ? new Date(dateStr) : new Date()

			entries.push({
				id: `${tool.id}-fire-${i++}-${Date.now()}`,
				toolId: tool.id,
				date,
				version: undefined,
				title,
				url: itemUrl,
				content: (detailHtml || '').slice(0, 100),
			})
		}
		return entries
	},
}

export default FirecrawlStrategy
