/**
 * ToolsService Unit Tests
 * Tests service layer logic with mocked repository
 */

import { describe, expect, it, vi } from 'vitest'
import { DomainError } from '../../../core/shared/errors'
import type { Tool } from '../../../core/tools/model'
import { BackfillStatus, ToolStatus, ToolSyncStatus } from '../../../core/tools/model'
import type { ToolsRepository } from '../../../core/tools/repository'
import { ToolsService } from '../tools-service'

// --- Test Helpers ---

function createMockTool(overrides: Partial<Tool> = {}): Tool {
	return {
		id: 'test-id',
		name: 'Test Tool',
		description: 'A test tool',
		website: 'https://example.com',
		changelogUrl: 'https://example.com/changelog',
		logoUrl: 'https://example.com/logo.png',
		githubUrl: 'https://github.com/example/tool',
		category: 'testing',
		currentVersion: '1.0.0',
		scrapeConfig: undefined,
		lastSyncAt: new Date('2025-12-01T10:00:00Z'),
		lastSuccessfulSyncAt: new Date('2025-12-01T10:00:00Z'),
		isActive: true,
		status: ToolStatus.ACTIVE,
		syncStatus: ToolSyncStatus.SYNCED,
		strategyType: undefined,
		lastError: undefined,
		lastItemDate: undefined,
		backfillStatus: BackfillStatus.PENDING,
		backfillStartedAt: undefined,
		flagReason: undefined,
		consecutiveFailures: 0,
		patternId: undefined,
		metadata: undefined,
		createdAt: new Date('2025-01-01T00:00:00Z'),
		updatedAt: new Date('2025-12-01T10:00:00Z'),
		...overrides,
	}
}

function createMockRepository(overrides: Partial<ToolsRepository> = {}): ToolsRepository {
	return {
		listTools: vi.fn().mockResolvedValue([]),
		...overrides,
	}
}

// --- Tests ---

describe('ToolsService', () => {
	describe('getToolsList', () => {
		it('should return list of tools from repository', async () => {
			// Given: Repository returns a fixed array of tools
			const mockTools = [
				createMockTool({ id: '1', name: 'Tool One' }),
				createMockTool({ id: '2', name: 'Tool Two' }),
			]
			const mockRepo = createMockRepository({
				listTools: vi.fn().mockResolvedValue(mockTools),
			})
			const service = new ToolsService(mockRepo)

			// When: We call getToolsList
			const result = await service.getToolsList({})

			// Then: DTO contains the same tools with proper mapping
			expect(result.tools).toHaveLength(2)
			expect(result.tools[0]).toEqual({
				id: '1',
				name: 'Tool One',
				slug: 'tool-one',
				description: 'A test tool',
				logoUrl: 'https://example.com/logo.png',
				website: 'https://example.com',
				category: 'testing',
			})
			expect(result.tools[1].id).toBe('2')
			expect(result.tools[1].name).toBe('Tool Two')
			expect(result.tools[1].slug).toBe('tool-two')
		})

		it('should pass filters correctly to repository', async () => {
			// Given: A mock repository
			const listToolsMock = vi.fn().mockResolvedValue([])
			const mockRepo = createMockRepository({
				listTools: listToolsMock,
			})
			const service = new ToolsService(mockRepo)

			// When: We call getToolsList with filters
			await service.getToolsList({ limit: 10, search: 'nov' })

			// Then: Repository was called with the correct input
			expect(listToolsMock).toHaveBeenCalledTimes(1)
			expect(listToolsMock).toHaveBeenCalledWith({
				limit: 10,
				offset: undefined,
				search: 'nov',
			})
		})

		it('should pass all filters including offset to repository', async () => {
			// Given: A mock repository
			const listToolsMock = vi.fn().mockResolvedValue([])
			const mockRepo = createMockRepository({
				listTools: listToolsMock,
			})
			const service = new ToolsService(mockRepo)

			// When: We call getToolsList with all filters
			await service.getToolsList({ limit: 20, offset: 40, search: 'test' })

			// Then: Repository was called with all filters
			expect(listToolsMock).toHaveBeenCalledWith({
				limit: 20,
				offset: 40,
				search: 'test',
			})
		})

		it('should handle empty results', async () => {
			// Given: Repository returns empty array
			const mockRepo = createMockRepository({
				listTools: vi.fn().mockResolvedValue([]),
			})
			const service = new ToolsService(mockRepo)

			// When: We call getToolsList
			const result = await service.getToolsList({})

			// Then: Service returns DTO with empty tools array
			expect(result).toEqual({ tools: [] })
		})

		it('should propagate domain errors from repository', async () => {
			// Given: Repository throws a DomainError
			const domainError = new DomainError(
				'Database connection failed',
				'TOOLS_REPOSITORY_ERROR',
				500,
			)
			const mockRepo = createMockRepository({
				listTools: vi.fn().mockRejectedValue(domainError),
			})
			const service = new ToolsService(mockRepo)

			// When/Then: Service doesn't swallow the error
			await expect(service.getToolsList({})).rejects.toThrow(domainError)
			await expect(service.getToolsList({})).rejects.toThrow('Database connection failed')
		})

		it('should convert undefined domain values to null in DTO', async () => {
			// Given: A tool with undefined optional fields
			const toolWithUndefined = createMockTool({
				id: 'sparse-tool',
				name: 'Sparse Tool',
				description: undefined,
				website: undefined,
				logoUrl: undefined,
				category: undefined,
				currentVersion: undefined,
				lastSyncAt: undefined,
			})
			const mockRepo = createMockRepository({
				listTools: vi.fn().mockResolvedValue([toolWithUndefined]),
			})
			const service = new ToolsService(mockRepo)

			// When: We call getToolsList
			const result = await service.getToolsList({})

			// Then: Undefined values are converted to null for serialization
			expect(result.tools[0]).toEqual({
				id: 'sparse-tool',
				name: 'Sparse Tool',
				slug: 'sparse-tool',
				description: null,
				logoUrl: null,
				website: null,
				category: null,
			})
		})
	})
})
