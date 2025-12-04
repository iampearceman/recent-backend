import { load as cheerioLoad } from 'cheerio'

export type ParsedEntry = {
	title?: string
	url?: string
	date?: string
	content?: string
}

/**
 * Parse a page looking for heading-based entries and return lightweight parsed entries.
 * Pure function — no IO here.
 */
export function parseEntriesFromHtml(html: string): ParsedEntry[] {
	if (!html || !html.trim()) return []

	const $ = cheerioLoad(html)
	const entries: ParsedEntry[] = []
	const headings = $('h1, h2, h3, h4, h5, h6')

	// no counters needed — purely collect parsed entries
	headings.each((_, el) => {
		const title = $(el).text().trim() || undefined
		const container = $(el).closest('article, li, div').length
			? $(el).closest('article, li, div')
			: $(el).parent()
		const link = container.find('a').first()
		const time = container.find('time').first()
		const itemUrl = link.attr('href') ?? undefined
		const dateStr = time.attr('datetime') ?? time.text() ?? undefined

		entries.push({
			title,
			url: itemUrl,
			date: dateStr ?? undefined,
			content: undefined,
		})
	})

	// If no headings were present, try to discover 'article' elements as fallback
	if (entries.length === 0) {
		const articles = $('article')
		articles.each((_, el) => {
			const title = $(el).find('h1,h2').first().text().trim() || undefined
			const link = $(el).find('a').first().attr('href') ?? undefined
			const time =
				$(el).find('time').first().attr('datetime') ??
				$(el).find('time').first().text() ??
				undefined
			entries.push({
				title,
				url: link,
				date: time ?? undefined,
				content: $(el).text().trim().slice(0, 200),
			})
		})
	}

	return entries
}

export default parseEntriesFromHtml
