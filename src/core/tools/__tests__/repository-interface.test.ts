/**
 * ToolsRepository Interface Tests
 * Verifies the interface is practical and mockable
 */

import { describe, expect, it } from 'vitest'
import type { Tool } from '../model'
import { BackfillStatus, ToolStatus, ToolSyncStatus } from '../model'
import type { ListToolsInput, ToolsRepository } from '../repository'

// --- In-Memory Mock Implementation ---

class InMemoryToolsRepository implements ToolsRepository {
	private tools: Tool[] = []

	constructor(tools: Tool[] = []) {
		this.tools = tools
	}

	async listTools(input: ListToolsInput): Promise<Tool[]> {
		let results = [...this.tools]

		// Apply search filter
		if (input.search) {
			const searchLower = input.search.toLowerCase()
			results = results.filter(
				(tool) =>
					tool.name.toLowerCase().includes(searchLower) ||
					tool.description?.toLowerCase().includes(searchLower) ||
					tool.category?.toLowerCase().includes(searchLower),
			)
		}

		// Apply pagination
		const offset = input.offset ?? 0
		const limit = input.limit ?? results.length

		return results.slice(offset, offset + limit)
	}
}

// --- Test Helpers ---

function createMockTool(overrides: Partial<Tool> = {}): Tool {
	return {
		id: 'test-id',
		name: 'Test Tool',
		description: 'A test tool',
		website: 'https://example.com',
		changelogUrl: 'https://example.com/changelog',
		logoUrl: undefined,
		githubUrl: undefined,
		category: 'testing',
		currentVersion: '1.0.0',
		scrapeConfig: undefined,
		lastSyncAt: undefined,
		lastSuccessfulSyncAt: undefined,
		isActive: true,
		status: ToolStatus.ACTIVE,
		syncStatus: ToolSyncStatus.PENDING,
		strategyType: undefined,
		lastError: undefined,
		lastItemDate: undefined,
		backfillStatus: BackfillStatus.PENDING,
		backfillStartedAt: undefined,
		flagReason: undefined,
		consecutiveFailures: 0,
		patternId: undefined,
		metadata: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

// --- Tests ---

describe('ToolsRepository Interface', () => {
	describe('Interface Compliance', () => {
		it('should be implementable with in-memory mock', () => {
			const repository: ToolsRepository = new InMemoryToolsRepository()
			expect(repository).toBeDefined()
			expect(typeof repository.listTools).toBe('function')
		})
	})

	describe('listTools', () => {
		it('should return all tools when no filters applied', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool One' }),
				createMockTool({ id: '2', name: 'Tool Two' }),
				createMockTool({ id: '3', name: 'Tool Three' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({})

			expect(results).toHaveLength(3)
			expect(results.map((t) => t.name)).toEqual(['Tool One', 'Tool Two', 'Tool Three'])
		})

		it('should filter tools by search term in name', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'GitHub Desktop' }),
				createMockTool({ id: '2', name: 'VS Code' }),
				createMockTool({ id: '3', name: 'GitHub CLI' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'github' })

			expect(results).toHaveLength(2)
			expect(results.map((t) => t.name)).toEqual(['GitHub Desktop', 'GitHub CLI'])
		})

		it('should filter tools by search term in description', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool A', description: 'A code editor' }),
				createMockTool({ id: '2', name: 'Tool B', description: 'A database client' }),
				createMockTool({ id: '3', name: 'Tool C', description: 'Another code editor' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'code' })

			expect(results).toHaveLength(2)
			expect(results.map((t) => t.name)).toEqual(['Tool A', 'Tool C'])
		})

		it('should filter tools by search term in category', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool A', category: 'development' }),
				createMockTool({ id: '2', name: 'Tool B', category: 'design' }),
				createMockTool({ id: '3', name: 'Tool C', category: 'development' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'development' })

			expect(results).toHaveLength(2)
			expect(results.map((t) => t.name)).toEqual(['Tool A', 'Tool C'])
		})

		it('should be case-insensitive when searching', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'GitHub' }),
				createMockTool({ id: '2', name: 'VS Code' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'GITHUB' })

			expect(results).toHaveLength(1)
			expect(results[0].name).toBe('GitHub')
		})

		it('should apply limit', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool 1' }),
				createMockTool({ id: '2', name: 'Tool 2' }),
				createMockTool({ id: '3', name: 'Tool 3' }),
				createMockTool({ id: '4', name: 'Tool 4' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ limit: 2 })

			expect(results).toHaveLength(2)
			expect(results.map((t) => t.name)).toEqual(['Tool 1', 'Tool 2'])
		})

		it('should apply offset', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool 1' }),
				createMockTool({ id: '2', name: 'Tool 2' }),
				createMockTool({ id: '3', name: 'Tool 3' }),
				createMockTool({ id: '4', name: 'Tool 4' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ offset: 2 })

			expect(results).toHaveLength(2)
			expect(results.map((t) => t.name)).toEqual(['Tool 3', 'Tool 4'])
		})

		it('should combine search, limit, and offset', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool 1', category: 'dev' }),
				createMockTool({ id: '2', name: 'Tool 2', category: 'dev' }),
				createMockTool({ id: '3', name: 'Tool 3', category: 'dev' }),
				createMockTool({ id: '4', name: 'Tool 4', category: 'design' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({
				search: 'dev',
				limit: 1,
				offset: 1,
			})

			expect(results).toHaveLength(1)
			expect(results[0].name).toBe('Tool 2')
		})

		it('should return empty array when no tools match search', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool 1' }),
				createMockTool({ id: '2', name: 'Tool 2' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'nonexistent' })

			expect(results).toHaveLength(0)
		})

		it('should return empty array when offset exceeds total count', async () => {
			const tools = [createMockTool({ id: '1', name: 'Tool 1' })]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ offset: 10 })

			expect(results).toHaveLength(0)
		})

		it('should handle empty repository', async () => {
			const repository = new InMemoryToolsRepository([])

			const results = await repository.listTools({})

			expect(results).toHaveLength(0)
		})

		it('should handle undefined search in tools with undefined description', async () => {
			const tools = [
				createMockTool({ id: '1', name: 'Tool A', description: undefined }),
				createMockTool({ id: '2', name: 'Tool B', description: 'Has description' }),
			]
			const repository = new InMemoryToolsRepository(tools)

			const results = await repository.listTools({ search: 'description' })

			expect(results).toHaveLength(1)
			expect(results[0].name).toBe('Tool B')
		})
	})

	describe('Type Safety', () => {
		it('should accept ListToolsInput with all optional fields', async () => {
			const repository = new InMemoryToolsRepository()

			// All of these should be valid calls
			await repository.listTools({})
			await repository.listTools({ limit: 10 })
			await repository.listTools({ offset: 5 })
			await repository.listTools({ search: 'test' })
			await repository.listTools({ limit: 10, offset: 5, search: 'test' })

			// Type check passes - no runtime assertion needed
			expect(true).toBe(true)
		})

		it('should return Promise<Tool[]>', async () => {
			const repository = new InMemoryToolsRepository()

			const result = repository.listTools({})

			expect(result).toBeInstanceOf(Promise)
			const tools = await result
			expect(Array.isArray(tools)).toBe(true)
		})
	})
})
