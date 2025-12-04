import { initTRPC } from '@trpc/server'
import { describe, expect, it, vi } from 'vitest'
import type { ChangelogByToolInput } from '../../schemas/changelog'
import { ChangelogByToolInputSchema, ChangelogByToolOutputSchema } from '../../schemas/changelog'

const t = initTRPC.context<{ services: { changelog: any } }>().create()

function createTestRouter() {
	return t.router({
		listByTool: t.procedure
			.input(ChangelogByToolInputSchema)
			.output(ChangelogByToolOutputSchema)
			.query(async ({ input, ctx }) => ctx.services.changelog.getChangelogByTool(input)),
	})
}

describe('changelog.listByTool router', () => {
	it('validates input and returns output', async () => {
		const mockService = {
			getChangelogByTool: vi.fn().mockResolvedValue({
				entries: [
					{
						id: '1',
						toolId: 'tool-1',
						title: 'Test',
						description: null,
						coverImage: null,
						publishedAt: new Date().toISOString(),
						version: null,
						type: 'update',
						tags: [],
						status: 'published',
						createdAt: new Date().toISOString(),
					},
				],
				nextCursor: undefined,
			}),
		}

		const router = createTestRouter()
		const caller = router.createCaller({ services: { changelog: mockService } })

		const input: ChangelogByToolInput = { toolId: 'tool-1', limit: 1 }
		const result = await caller.listByTool(input)

		expect(mockService.getChangelogByTool).toHaveBeenCalledWith(input)
		expect(result.entries.length).toBe(1)
		expect(result.entries[0].toolId).toBe('tool-1')
	})

	it('throws on invalid input', async () => {
		const mockService = { getChangelogByTool: vi.fn() }
		const router = createTestRouter()
		const caller = router.createCaller({ services: { changelog: mockService } })

		await expect(caller.listByTool({ limit: 1 } as any)).rejects.toThrow()
	})
})
