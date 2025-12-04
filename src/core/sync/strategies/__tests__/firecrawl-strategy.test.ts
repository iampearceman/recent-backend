import { describe, expect, it, vi } from 'vitest'
import type { Tool } from '../../../tools/model'
import { FirecrawlStrategy } from '../firecrawl-strategy'

describe('FirecrawlStrategy', () => {
	it('canHandle when twoStepExtraction true or url contains firecrawl', () => {
		const t1 = { id: 'f1', scrapeConfig: { twoStepExtraction: true } } as unknown as Tool
		expect(FirecrawlStrategy.canHandle(t1)).toBe(true)

		const t2 = {
			id: 'f2',
			changelogUrl: 'https://something.firecrawl.dev/changes',
		} as unknown as Tool
		expect(FirecrawlStrategy.canHandle(t2)).toBe(true)

		const t3 = { id: 'f3', changelogUrl: 'https://example.com' } as unknown as Tool
		expect(FirecrawlStrategy.canHandle(t3)).toBe(false)
	})

	it('performs two-step extraction when configured and returns entries', async () => {
		const listHtml = `<a href="https://example.com/d/1">R1</a><a href="https://example.com/d/2">R2</a>`
		const detailHtml = `<article><h1>Detail</h1><time datetime="2024-05-01"></time><p>content</p></article>`

		const fetchHtml = vi.fn()
		// First call: list page. Subsequent calls: detail page(s)
		fetchHtml.mockResolvedValueOnce(listHtml).mockResolvedValue(detailHtml)

		const ctx = { fetchHtml }
		const tool = {
			id: 'f-tool',
			changelogUrl: 'https://example.com/list',
			scrapeConfig: { twoStepExtraction: true },
		} as unknown as Tool

		const items = await FirecrawlStrategy.extract(tool, ctx as any)
		expect(items.length).toBeGreaterThanOrEqual(2)
		expect(fetchHtml).toHaveBeenCalled()
		expect(items[0].content).toBeDefined()
		expect(items[0].date instanceof Date).toBe(true)
	})
})
