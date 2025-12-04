import { describe, expect, it, vi } from 'vitest'
import type { ChangelogByToolInput } from '../../schemas/changelog'
import { ChangelogService } from '../changelog-service'

describe('ChangelogService', () => {
	const mockRepo = {
		listChangelogByTool: vi.fn(),
	}
	const service = new ChangelogService(mockRepo as any)

	it('calls repository with correct params', async () => {
		const input: ChangelogByToolInput = { toolId: 'tool-1', limit: 5 }
		mockRepo.listChangelogByTool.mockResolvedValue([])
		const result = await service.getChangelogByTool(input)
		expect(mockRepo.listChangelogByTool).toHaveBeenCalledWith({
			toolId: 'tool-1',
			limit: 5,
			offset: 0,
		})
		expect(result).toEqual({ entries: [], nextCursor: undefined })
	})

	it('passes cursor if provided', async () => {
		const input: ChangelogByToolInput = { toolId: 'tool-1', limit: 5, cursor: 'abc' }
		mockRepo.listChangelogByTool.mockResolvedValue([])
		const result = await service.getChangelogByTool(input)
		expect(mockRepo.listChangelogByTool).toHaveBeenCalledWith({
			toolId: 'tool-1',
			limit: 5,
			offset: 0,
		})
		// Since repo returned 0 rows, nextCursor is undefined
		expect(result).toEqual({ entries: [], nextCursor: undefined })
	})
})
