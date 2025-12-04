import { describe, expect, it, vi } from 'vitest'
import type { Tool } from '../../../tools/model'
import { GitHubReleasesStrategy } from '../github-releases-strategy'

describe('GitHubReleasesStrategy', () => {
	it('canHandle when github or releases URL present', () => {
		const t1 = { id: 'g1', githubUrl: 'https://github.com/foo/bar' } as unknown as Tool
		expect(GitHubReleasesStrategy.canHandle(t1)).toBe(true)

		const t2 = { id: 'g2', changelogUrl: 'https://github.com/foo/bar/releases' } as unknown as Tool
		expect(GitHubReleasesStrategy.canHandle(t2)).toBe(true)

		const t3 = { id: 'g3', changelogUrl: 'https://example.com/changes' } as unknown as Tool
		expect(GitHubReleasesStrategy.canHandle(t3)).toBe(false)
	})

	it('extracts from JSON arrays returned by fetchJson', async () => {
		const releases = [
			{
				id: 1,
				html_url: 'https://github.com/foo/bar/releases/1',
				name: 'v1.0',
				tag_name: 'v1.0',
				published_at: '2024-02-14T00:00:00Z',
			},
			{ id: 2, html_url: 'https://github.com/foo/bar/releases/2', name: 'v2.0', tag_name: 'v2.0' },
		]

		const context = { fetchJson: vi.fn().mockResolvedValue(releases) }
		const tool = {
			id: 'gh-tool',
			changelogUrl: 'https://api.github.com/repos/foo/bar/releases',
		} as unknown as Tool

		const items = await GitHubReleasesStrategy.extract(tool, context as any)
		expect(items.length).toBe(2)
		expect(items[0].url).toBe('https://github.com/foo/bar/releases/1')
		expect(items[0].version).toBe('v1.0')
		expect(items[1].version).toBe('v2.0')
	})

	it('handles non-json or failed fetch gracefully', async () => {
		const context = { fetchJson: vi.fn().mockRejectedValue(new Error('not json')) }
		const tool = {
			id: 'gh-tool',
			changelogUrl: 'https://api.github.com/repos/foo/bar/releases',
		} as unknown as Tool
		const items = await GitHubReleasesStrategy.extract(tool, context as any)
		expect(items).toEqual([])
	})
})
