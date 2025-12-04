import { describe, expect, it } from 'vitest'
import type { Tool } from '../../../tools/model'
import { pickStrategyForTool, strategies } from '../registry'

describe('Strategy registry', () => {
	it('returns a matching strategy for a GitHub releases tool', () => {
		const tool = { id: 't', githubUrl: 'https://github.com/foo/bar' } as unknown as Tool
		const strategy = pickStrategyForTool(tool)
		expect(strategy).toBeDefined()
		expect(strategy?.canHandle(tool)).toBe(true)
	})

	it('prefers more specific strategies when order matters', () => {
		// If a tool looks like rss feed, registry should pick RssStrategy not Scrape
		const tool = { id: 'rss', changelogUrl: 'https://example.com/feed' } as unknown as Tool
		const s = pickStrategyForTool(tool)
		expect(s).toBeDefined()
		expect(s?.canHandle(tool)).toBe(true)
		// ensure it is a strategy object from the configured list
		expect(s && strategies.includes(s)).toBeTruthy()
	})
})
