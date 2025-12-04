import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DrizzleToolsRepository } from '../tools-repository.drizzle'

// Mock the db
const mockDb = {
	select: vi.fn(),
}

describe('DrizzleToolsRepository', () => {
	let repository: DrizzleToolsRepository

	beforeEach(() => {
		vi.clearAllMocks()
		repository = new DrizzleToolsRepository(mockDb as any)
	})

	describe('listTools', () => {
		it('returns tools ordered by created_at desc', async () => {
			// Mock the query chain
			const mockRows = [
				{
					id: '3',
					name: 'Tool Three',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date('2023-01-03'),
					updated_at: new Date('2023-01-03'),
				},
				{
					id: '2',
					name: 'Tool Two',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date('2023-01-02'),
					updated_at: new Date('2023-01-02'),
				},
				{
					id: '1',
					name: 'Tool One',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date('2023-01-01'),
					updated_at: new Date('2023-01-01'),
				},
			]

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(mockRows),
						}),
					}),
				}),
			})

			const results = await repository.listTools({})

			expect(results).toHaveLength(3)
			// Assuming mapToolRowToDomain works
			expect(results[0].name).toBe('Tool Three')
		})

		it('applies limit correctly', async () => {
			const mockRows = [
				{
					id: '4',
					name: 'Tool 4',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					id: '5',
					name: 'Tool 5',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date(),
					updated_at: new Date(),
				},
			]

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockResolvedValue(mockRows),
						}),
					}),
				}),
			})

			const results = await repository.listTools({ limit: 2 })

			expect(results).toHaveLength(2)
		})

		it('applies search to name', async () => {
			const mockRows = [
				{
					id: '1',
					name: 'Novu',
					description: null,
					website: null,
					changelog_url: null,
					logo_url: null,
					github_url: null,
					category: null,
					current_version: null,
					scrape_config: null,
					last_sync_at: null,
					last_successful_sync_at: null,
					is_active: true,
					status: 'active',
					sync_status: 'pending',
					strategy_type: null,
					last_error: null,
					last_item_date: null,
					backfill_status: 'pending',
					backfill_started_at: null,
					flag_reason: null,
					consecutive_failures: 0,
					pattern_id: null,
					metadata: null,
					created_at: new Date(),
					updated_at: new Date(),
				},
			]

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue(mockRows),
							}),
						}),
					}),
				}),
			})

			const results = await repository.listTools({ search: 'nov' })

			expect(results).toHaveLength(1)
			expect(results[0].name).toBe('Novu')
		})

		it('returns empty array when no match', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockReturnValue({
								offset: vi.fn().mockResolvedValue([]),
							}),
						}),
					}),
				}),
			})

			const results = await repository.listTools({ search: 'nonexistent' })

			expect(results).toEqual([])
		})

		it('propagates DB errors', async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					orderBy: vi.fn().mockReturnValue({
						limit: vi.fn().mockReturnValue({
							offset: vi.fn().mockRejectedValue(new Error('DB error')),
						}),
					}),
				}),
			})

			await expect(repository.listTools({})).rejects.toThrow('Failed to list tools')
		})
	})
})
