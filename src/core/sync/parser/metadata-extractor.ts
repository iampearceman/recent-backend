import { load as cheerioLoad } from 'cheerio'

export function extractTitle(html: string): string | undefined {
	if (!html || !html.trim()) return undefined
	const $ = cheerioLoad(html)
	const ogTitle = $('meta[property="og:title"]').attr('content')
	if (ogTitle) return ogTitle.trim()
	const titleTag = $('title').text()
	if (titleTag) return titleTag.trim()
	const h1 = $('h1').first().text()
	return h1 ? h1.trim() : undefined
}

export function extractMetaTags(html: string): Record<string, string> {
	const tags: Record<string, string> = {}
	if (!html || !html.trim()) return tags
	const $ = cheerioLoad(html)
	$('meta').each((_, el) => {
		const key = $(el).attr('name') ?? $(el).attr('property')
		const val = $(el).attr('content')
		if (key && val) tags[key] = val
	})
	return tags
}

export function extractDateFromHtml(html: string): string | undefined {
	if (!html || !html.trim()) return undefined
	const $ = cheerioLoad(html)
	const time = $('time').first()
	if (!time.length) return undefined
	const dt = time.attr('datetime') ?? time.text()
	return dt ? dt.trim() : undefined
}

export function extractVersionFromText(text: string): string | undefined {
	if (!text) return undefined
	// Look for v1.2.3 or 1.2.3 style versions
	const m = text.match(/v?\d+\.\d+(?:\.\d+)?/i)
	return m ? m[0] : undefined
}

export default { extractTitle, extractMetaTags, extractDateFromHtml, extractVersionFromText }
