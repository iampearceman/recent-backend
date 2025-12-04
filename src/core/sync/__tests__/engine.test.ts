import { describe, expect, it } from 'vitest'
import type { SyncEngine } from '../interfaces'
import { SyncStatus } from '../model'

class FakeEngine implements SyncEngine {
	async runToolSync(toolId: string) {
		// simple fake behavior — toolId influences counts slightly so tests are deterministic
		const seed = toolId.length % 3
		return {
			status: SyncStatus.SUCCESS,
			syncedCount: seed + 1,
			skippedCount: seed,
			errors: [],
		}
	}

	async runBulkSync(toolIds: string[]) {
		const results = []
		for (const id of toolIds) {
			// reuse runToolSync for simplicity
			// intentionally don't await in loop to keep simple sequential calls
			// But we will await to match contract
			// eslint-disable-next-line no-await-in-loop
			results.push(await this.runToolSync(id))
		}
		return results
	}
}

describe('SyncEngine (interface) — fake implementation', () => {
	it('runToolSync returns a SyncResult', async () => {
		const engine = new FakeEngine()
		const res = await engine.runToolSync('tool-a')

		expect(res.status).toBe(SyncStatus.SUCCESS)
		expect(typeof res.syncedCount).toBe('number')
		expect(typeof res.skippedCount).toBe('number')
		expect(res.errors).toBeDefined()
	})

	it('runBulkSync returns an array of results matching toolIds', async () => {
		const engine = new FakeEngine()
		const toolIds = ['a', 'bb', 'ccc']
		const results = await engine.runBulkSync(toolIds)

		expect(results).toHaveLength(toolIds.length)
		for (const r of results) {
			expect(r.status).toBe(SyncStatus.SUCCESS)
			expect(typeof r.syncedCount).toBe('number')
		}
	})
})
