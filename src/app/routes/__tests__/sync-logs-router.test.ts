import { initTRPC } from '@trpc/server'
import { describe, expect, it, vi } from 'vitest'
import type { SyncLogsByToolInput } from '../../schemas/sync-logs'
import { SyncLogsByToolInputSchema, SyncLogsByToolOutputSchema, RecentFailuresInputSchema, RecentFailuresOutputSchema } from '../../schemas/sync-logs'

const t = initTRPC.context<{ services: { syncLogs: any } }>().create()

function createTestRouter() {
  return t.router({
    listByTool: t.procedure
      .input(SyncLogsByToolInputSchema)
      .output(SyncLogsByToolOutputSchema)
      .query(async ({ input, ctx }) => ctx.services.syncLogs.listByTool(input)),

    recentFailures: t.procedure
      .input(RecentFailuresInputSchema)
      .output(RecentFailuresOutputSchema)
      .query(async ({ input, ctx }) => ctx.services.syncLogs.recentFailures(input)),
  })
}

describe('syncLogs router', () => {
  it('validates input and returns output for listByTool', async () => {
    const mockService = {
      listByTool: vi.fn().mockResolvedValue({ logs: [
        {
          id: '1',
          toolId: 'tool-1',
          status: 'success',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          itemsFound: 0,
          itemsCreated: 0,
          itemsUpdated: 0,
          itemsSkipped: 0,
          errorMessage: null,
          createdAt: new Date().toISOString(),
        }
      ], nextCursor: undefined }),
    }

    const router = createTestRouter()
    const caller = router.createCaller({ services: { syncLogs: mockService } })

    const input: SyncLogsByToolInput = { toolId: 'tool-1', limit: 1 }
    const result = await caller.listByTool(input)

    expect(mockService.listByTool).toHaveBeenCalledWith(input)
    expect(result.logs.length).toBe(1)
    expect(result.logs[0].toolId).toBe('tool-1')
  })

  it('throws on invalid input for listByTool', async () => {
    const mockService = { listByTool: vi.fn() }
    const router = createTestRouter()
    const caller = router.createCaller({ services: { syncLogs: mockService } })

    await expect(caller.listByTool({ limit: 1 } as any)).rejects.toThrow()
  })

  it('validates input and returns output for recentFailures', async () => {
    const mockService = { recentFailures: vi.fn().mockResolvedValue({ failures: [] }) }
    const router = createTestRouter()
    const caller = router.createCaller({ services: { syncLogs: mockService } })

    const result = await caller.recentFailures({ limit: 5 })
    expect(mockService.recentFailures).toHaveBeenCalledWith({ limit: 5 })
    expect(result.failures).toBeDefined()
  })
})
