import { describe, expect, it, vi } from 'vitest'
import { SyncLogsService } from '../sync-logs-service'

describe('SyncLogsService', () => {
  const mockRepo = {
    listByTool: vi.fn(),
    listRecentFailures: vi.fn(),
  }

  const service = new SyncLogsService(mockRepo as any)

  it('calls repository with correct params and maps rows for listByTool', async () => {
    const input = { toolId: 'tool-1', limit: 5 }
    mockRepo.listByTool.mockResolvedValue([
      {
        id: 'log1',
        toolId: 'tool-1',
        status: 'success',
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: new Date('2025-01-01T00:00:01Z'),
        itemsFound: 2,
        itemsCreated: 1,
        itemsUpdated: 1,
        itemsSkipped: 0,
        errorMessage: null,
        createdAt: new Date('2025-01-01T00:00:02Z'),
      },
    ])

    const result = await service.listByTool(input)

    expect(mockRepo.listByTool).toHaveBeenCalledWith({ toolId: 'tool-1', limit: 5, offset: 0 })
    expect(result.logs.length).toBe(1)
    expect(result.logs[0].id).toBe('log1')
  })

  it('passes cursor to offset when provided', async () => {
    mockRepo.listByTool.mockResolvedValue([])
    await service.listByTool({ toolId: 'tool-1', limit: 5, cursor: '10' })
    expect(mockRepo.listByTool).toHaveBeenCalledWith({ toolId: 'tool-1', limit: 5, offset: 10 })
  })

  it('propagates errors from repository for listByTool', async () => {
    mockRepo.listByTool.mockRejectedValue(new Error('boom'))
    await expect(service.listByTool({ toolId: 'tool-1', limit: 1 })).rejects.toThrow('boom')
  })

  it('maps recent failures and propagates errors', async () => {
    mockRepo.listRecentFailures.mockResolvedValue([
      {
        id: 'f1',
        toolId: 't1',
        status: 'error',
        startedAt: new Date('2025-01-01T00:00:00Z'),
        errorMessage: 'fail',
        createdAt: new Date('2025-01-01T00:00:01Z'),
      },
    ])

    const out = await service.recentFailures({ limit: 3 })
    expect(mockRepo.listRecentFailures).toHaveBeenCalledWith({ limit: 3 })
    expect(out.failures[0].id).toBe('f1')

    mockRepo.listRecentFailures.mockRejectedValue(new Error('err'))
    await expect(service.recentFailures({ limit: 1 })).rejects.toThrow('err')
  })
})
