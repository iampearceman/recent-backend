import { describe, expect, it } from 'vitest'
import type { Tool } from '../../../tools/model'
import { ManualStrategy } from '../manual-strategy'

describe('ManualStrategy', () => {
	it('canHandle when no scrapeConfig and no changelogUrl', () => {
		const t = { id: 'm1' } as unknown as Tool
		expect(ManualStrategy.canHandle(t)).toBe(true)

		const t2 = { id: 'm2', changelogUrl: 'https://example.com/changelog' } as unknown as Tool
		expect(ManualStrategy.canHandle(t2)).toBe(false)
	})

	it('extract returns empty list', async () => {
		const t = { id: 'm1' } as unknown as Tool
		const items = await ManualStrategy.extract(t, {
			fetchHtml: async () => '',
			// fetchJson is generic in the interface — return undefined cast to T for tests
			fetchJson: async <T>() => undefined as unknown as T,
		})
		expect(items).toEqual([])
	})
})
