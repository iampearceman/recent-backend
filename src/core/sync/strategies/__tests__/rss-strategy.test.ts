import { describe, expect, it, vi } from 'vitest'
import type { Tool } from '../../../tools/model'
import { RssStrategy } from '../rss-strategy'

describe('RssStrategy', () => {
	it('canHandle rss endpoints and feed urls', () => {
		const t1 = { id: 'r1', changelogUrl: 'https://example.com/feed' } as unknown as Tool
		expect(RssStrategy.canHandle(t1)).toBe(true)

		const t2 = { id: 'r2', changelogUrl: 'https://example.com/index.xml' } as unknown as Tool
		expect(RssStrategy.canHandle(t2)).toBe(true)

		const t3 = { id: 'r3', changelogUrl: 'https://example.com/' } as unknown as Tool
		expect(RssStrategy.canHandle(t3)).toBe(false)
	})

	it('extracts items from a simple RSS feed', async () => {
		const feed = `<?xml version="1.0"?><rss><channel>
      <item><title>v1</title><link>https://ex.com/1</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate></item>
      <item><title>v2</title><link>https://ex.com/2</link></item>
    </channel></rss>`

		const context = { fetchHtml: vi.fn().mockResolvedValue(feed) }
		const tool = { id: 'rss-tool', changelogUrl: 'https://example.com/feed' } as unknown as Tool

		const items = await RssStrategy.extract(tool, context as any)
		expect(items.length).toBe(2)
		expect(items[0].title).toBe('v1')
		expect(items[0].url).toBe('https://ex.com/1')
		expect(items[1].url).toBe('https://ex.com/2')
	})

	it('returns [] on empty feed', async () => {
		const context = { fetchHtml: vi.fn().mockResolvedValue('') }
		const tool = {
			id: 'rss-tool-empty',
			changelogUrl: 'https://example.com/feed',
		} as unknown as Tool
		const items = await RssStrategy.extract(tool, context as any)
		expect(items).toEqual([])
	})
})
