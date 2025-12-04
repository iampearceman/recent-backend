import { describe, expect, it } from 'vitest'
import { analyzeDetailPage } from '../detail-page-analyzer'

describe('detail-page-analyzer', () => {
	it('extracts title, date and snippet from a detail page', () => {
		const html = `<article><h1>Release 1</h1><time datetime="2024-06-01"></time><p>First paragraph content</p><p>More content</p></article>`
		const res = analyzeDetailPage(html)
		expect(res.title).toBe('Release 1')
		expect(res.date).toBe('2024-06-01')
		expect(res.contentSnippet).toBe('First paragraph content')
		expect(res.length).toBeGreaterThan(0)
	})
})
