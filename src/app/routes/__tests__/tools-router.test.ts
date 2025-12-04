/**
 * Tools Router Unit Tests
 * Tests tRPC router procedures with mocked service
 */

import { initTRPC } from '@trpc/server'
import { describe, expect, it, vi } from 'vitest'

import { DomainError } from '../../../core/shared/errors'
import { listToolsInputSchema, listToolsOutputSchema } from '../../schemas/tool'
import type { GetToolsListOutput, ToolsService } from '../../services/tools-service'
import type { TRPCContext } from '../../trpc/context'

// --- Test Setup ---

// Create a test tRPC instance with the same structure as production
const t = initTRPC.context<TRPCContext>().create()

// Create router for testing
function createTestRouter() {
	return t.router({
		list: t.procedure
			.input(listToolsInputSchema)
			.output(listToolsOutputSchema)
			.query(async ({ input, ctx }) => {
				return ctx.services.tools.getToolsList(input)
			}),
	})
}

// Create mock context
function createMockContext(mockToolsService: Partial<ToolsService>): TRPCContext {
	return {
		db: null,
		config: {
			database: { url: undefined },
			openai: { apiKey: undefined },
			environment: 'development',
			isDevelopment: true,
			isProduction: false,
		},
		user: null,
		services: {
			tools: mockToolsService as ToolsService,
			changelog: {
				listChangelogByTool: async () => [],
			} as any,
			syncLogs: {
				listByTool: async () => ({ logs: [], nextCursor: undefined }),
				listRecentFailures: async () => ({ failures: [] }),
			} as any,
		},
	}
}

// --- Tests ---

describe('toolsRouter', () => {
	describe('list procedure', () => {
		it('should forward validated input to service', async () => {
			// Given: A mock service
			const getToolsListMock = vi.fn().mockResolvedValue({ tools: [] })
			const mockService = { getToolsList: getToolsListMock }
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When: We call list with valid input
			await caller.list({ limit: 20, search: 'novu' })

			// Then: Service was called with the same input
			expect(getToolsListMock).toHaveBeenCalledTimes(1)
			expect(getToolsListMock).toHaveBeenCalledWith({
				limit: 20,
				search: 'novu',
			})
		})

		it('should forward empty input to service', async () => {
			// Given: A mock service
			const getToolsListMock = vi.fn().mockResolvedValue({ tools: [] })
			const mockService = { getToolsList: getToolsListMock }
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When: We call list with empty input
			await caller.list({})

			// Then: Service was called with empty object
			expect(getToolsListMock).toHaveBeenCalledWith({})
		})

		it('should return service result as-is', async () => {
			// Given: Service returns a list of tools
			const serviceResult: GetToolsListOutput = {
				tools: [
					{
						id: 'tool-1',
						name: 'Novu',
						slug: 'novu',
						description: 'Notification infrastructure',
						logoUrl: 'https://novu.co/logo.png',
						website: 'https://novu.co',
						category: 'notifications',
					},
					{
						id: 'tool-2',
						name: 'Stripe',
						slug: 'stripe',
						description: null,
						logoUrl: null,
						website: 'https://stripe.com',
						category: 'payments',
					},
				],
			}
			const mockService = {
				getToolsList: vi.fn().mockResolvedValue(serviceResult),
			}
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When: We call list
			const result = await caller.list({})

			// Then: Result matches service output exactly
			expect(result).toEqual(serviceResult)
			expect(result.tools).toHaveLength(2)
			expect(result.tools[0].name).toBe('Novu')
			expect(result.tools[1].name).toBe('Stripe')
		})

		it('should reject invalid input with negative limit', async () => {
			// Given: A mock service (shouldn't be called)
			const getToolsListMock = vi.fn()
			const mockService = { getToolsList: getToolsListMock }
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When/Then: Calling with invalid input throws Zod error
			await expect(caller.list({ limit: -5 })).rejects.toThrow()

			// And: Service was never called
			expect(getToolsListMock).not.toHaveBeenCalled()
		})

		it('should reject invalid input with empty search', async () => {
			// Given: A mock service (shouldn't be called)
			const getToolsListMock = vi.fn()
			const mockService = { getToolsList: getToolsListMock }
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When/Then: Calling with empty search throws Zod error
			await expect(caller.list({ search: '' })).rejects.toThrow()

			// And: Service was never called
			expect(getToolsListMock).not.toHaveBeenCalled()
		})

		it('should reject invalid input with limit exceeding max', async () => {
			// Given: A mock service (shouldn't be called)
			const getToolsListMock = vi.fn()
			const mockService = { getToolsList: getToolsListMock }
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When/Then: Calling with limit > 100 throws Zod error
			await expect(caller.list({ limit: 101 })).rejects.toThrow()

			// And: Service was never called
			expect(getToolsListMock).not.toHaveBeenCalled()
		})

		it('should propagate DomainError to tRPC error handler', async () => {
			// Given: Service throws a DomainError
			const domainError = new DomainError('Database connection failed', 'DB_CONNECTION_ERROR', 500)
			const mockService = {
				getToolsList: vi.fn().mockRejectedValue(domainError),
			}
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When/Then: Error is propagated
			await expect(caller.list({})).rejects.toThrow('Database connection failed')
		})

		it('should propagate service errors with correct error details', async () => {
			// Given: Service throws a DomainError
			const domainError = new DomainError('Tool not found', 'TOOL_NOT_FOUND', 404)
			const mockService = {
				getToolsList: vi.fn().mockRejectedValue(domainError),
			}
			const router = createTestRouter()
			const ctx = createMockContext(mockService)
			const caller = router.createCaller(ctx)

			// When/Then: Error is propagated with message
			try {
				await caller.list({})
				expect.fail('Should have thrown')
			} catch (error) {
				expect(error).toBeInstanceOf(Error)
				expect((error as Error).message).toBe('Tool not found')
			}
		})
	})
})
