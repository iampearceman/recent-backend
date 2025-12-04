import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('src/index entrypoints', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('scheduled handler delegates to runPeriodicSync', async () => {
		vi.resetModules()
		const runPeriodicSync = vi.fn().mockResolvedValue(undefined)

		// doMock is not hoisted — define the factory dynamically and then import
		vi.doMock('../app/jobs/cron-sync', () => ({ runPeriodicSync }))

		const index = await import('../index')

		await index.scheduled({} as any, { TEST: 'x' } as any, {} as any)

		expect(runPeriodicSync).toHaveBeenCalledTimes(1)
		expect(runPeriodicSync).toHaveBeenCalledWith({ TEST: 'x' })
	})

	it('queue handler delegates to processSyncMessage', async () => {
		vi.resetModules()
		const processSyncMessage = vi.fn().mockResolvedValue(undefined)

		vi.doMock('../app/jobs/queue-consumer', () => ({ processSyncMessage }))

		const index = await import('../index')

		const msg = { type: 'sync_tool', toolId: 'xyz' }
		await index.queue(msg, { ABC: '1' } as any, {} as any)

		expect(processSyncMessage).toHaveBeenCalledTimes(1)
		expect(processSyncMessage).toHaveBeenCalledWith(msg, { ABC: '1' })
	})
})
