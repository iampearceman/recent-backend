import { extractDateFromHtml, extractTitle } from '../parser/metadata-extractor'

export type DetailAnalysis = {
	title?: string
	date?: string
	contentSnippet?: string
	length: number
}

export function analyzeDetailPage(html: string): DetailAnalysis {
	const title = extractTitle(html)
	const date = extractDateFromHtml(html)
	const length = html ? html.length : 0
	// Simple content snippet — first non-empty paragraph
	const snippetMatch = html.match(/<p>([\s\S]*?)<\/p>/i)
	const contentSnippet = snippetMatch ? snippetMatch[1].trim().slice(0, 400) : undefined

	return { title, date, contentSnippet, length }
}

export default analyzeDetailPage
