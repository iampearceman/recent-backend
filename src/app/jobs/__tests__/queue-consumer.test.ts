import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as servicesFactory from '../../services/create-services'
import { processSyncMessage } from '../queue-consumer'

describe('processSyncMessage', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('calls sync.runToolSync with the toolId for a valid message', async () => {
		const runToolSync = vi.fn().mockResolvedValue(undefined)

		const spy = vi.spyOn(servicesFactory, 'createServices').mockImplementation((): any => ({
			sync: { runToolSync },
		}))

		await processSyncMessage({ type: 'sync_tool', toolId: 'abc-123' } as any, {} as any)

		expect(spy).toHaveBeenCalled()
		expect(runToolSync).toHaveBeenCalledTimes(1)
		expect(runToolSync).toHaveBeenCalledWith('abc-123')
	})

	it('throws for malformed message missing toolId', async () => {
		const runToolSync = vi.fn().mockResolvedValue(undefined)

		vi.spyOn(servicesFactory, 'createServices').mockImplementation((): any => ({
			sync: { runToolSync },
		}))

		await expect(processSyncMessage({ type: 'sync_tool' } as any, {} as any)).rejects.toThrow(
			'Malformed sync message: missing toolId',
		)
	})
})
