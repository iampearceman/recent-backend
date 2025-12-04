import { describe, expect, it } from 'vitest'
import SyncStatus, { type SyncResult, type SyncStatusType } from '../model'

describe('core/sync model', () => {
	it('exposes the allowed sync status values', () => {
		const values = Object.values(SyncStatus) as string[]
		expect(values.sort()).toEqual(['error', 'partial', 'success'].sort())
	})

	it('creates a valid SyncResult shape', () => {
		const result: SyncResult = {
			status: SyncStatus.SUCCESS as SyncStatusType,
			syncedCount: 3,
			skippedCount: 1,
			errors: ['something failed'],
		}

		expect(result.status).toBe(SyncStatus.SUCCESS)
		expect(result.syncedCount).toBe(3)
		expect(result.skippedCount).toBe(1)
		expect(result.errors).toEqual(['something failed'])
	})
})
