import { parseEntriesFromHtml } from '../parser/html-parser'

export type PageAnalysis = {
	isList: boolean
	linkCount: number
	headingCount: number
	probableEntries: number
}

/**
 * Analyze a page to give a quick indication whether it looks like a changelog/list page.
 * Pure function — accepts raw HTML and returns deterministic analysis.
 */
export function analyzePage(html: string): PageAnalysis {
	const entries = parseEntriesFromHtml(html)
	const headingCount = (html.match(/<h[1-6]/gi) || []).length
	const linkCount = (html.match(/<a\s+/gi) || []).length

	// Heuristic: list page if many headings OR several <a> items and multiple entries parsed
	const isList = headingCount >= 2 || linkCount >= 3 || entries.length >= 3

	return { isList, linkCount, headingCount, probableEntries: entries.length }
}

export default analyzePage
