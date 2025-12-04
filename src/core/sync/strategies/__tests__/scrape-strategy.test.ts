import { describe, expect, it, vi } from 'vitest'
import type { Tool } from '../../../tools/model'
import { ScrapeStrategy } from '../scrape-strategy'

describe('ScrapeStrategy', () => {
	it('canHandle returns true for /changelog urls and selectors', () => {
		const t1 = { id: 't1', changelogUrl: 'https://resend.com/changelog' } as unknown as Tool
		expect(ScrapeStrategy.canHandle(t1)).toBe(true)

		const t2 = { id: 't2', scrapeConfig: { selectors: { entries: '.x' } } } as unknown as Tool
		expect(ScrapeStrategy.canHandle(t2)).toBe(true)

		const t3 = { id: 't3', changelogUrl: 'https://example.com' } as unknown as Tool
		expect(ScrapeStrategy.canHandle(t3)).toBe(false)
	})

	it('extracts entries from typical HTML and returns ChangelogEntry[]', async () => {
		const html = `
      <div class="entry"><h2>Release 1</h2><a href="/changelog/1">View</a><time datetime="2024-03-01"></time></div>
      <div class="entry"><h2>Release 2</h2><a href="/changelog/2">View</a><time datetime="2024-04-05"></time></div>
    `

		const context = {
			fetchHtml: vi.fn().mockResolvedValue(html),
		}

		const tool = { id: 'tool1', changelogUrl: 'https://resend.com/changelog' } as unknown as Tool
		const results = await ScrapeStrategy.extract(tool, context as any)
		expect(results.length).toBeGreaterThanOrEqual(2)
		expect(results[0].toolId).toBe(tool.id)
		expect(results[0].title).toBeDefined()
		expect(results[0].url).toContain('/changelog/')
	})

	it('handles empty / malformed HTML gracefully', async () => {
		const context = { fetchHtml: vi.fn().mockResolvedValue('') }
		const tool = { id: 'tool2', changelogUrl: 'https://resend.com/changelog' } as unknown as Tool
		const results = await ScrapeStrategy.extract(tool, context as any)
		expect(Array.isArray(results)).toBe(true)
		expect(results.length).toBe(0)
	})
})
