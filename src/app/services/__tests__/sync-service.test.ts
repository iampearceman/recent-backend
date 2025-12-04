import { describe, expect, it, vi } from 'vitest'
import type { SyncEngine } from '../../../core/sync/interfaces'
import { SyncStatus } from '../../../core/sync/model'
import type { SyncLogsRepository } from '../../../core/sync-logs/repository'
import type { ToolsRepository } from '../../../core/tools/repository'
import { SyncService } from '../sync-service'

const buildTool = (id: string) => ({ id, name: id }) as any

describe('SyncService', () => {
	it('loads tool, runs engine and writes sync log', async () => {
		const tool = buildTool('t1')

		const toolsRepo: ToolsRepository = { listTools: vi.fn().mockResolvedValue([tool]) } as any

		const engine: SyncEngine = {
			runToolSync: vi.fn().mockResolvedValue({
				status: SyncStatus.SUCCESS,
				syncedCount: 2,
				skippedCount: 0,
				errors: [],
			}),
		} as any

		const engineFactory = vi.fn().mockReturnValue(engine)

		const syncLogsRepo: SyncLogsRepository = {
			listByTool: vi.fn(),
			listRecentFailures: vi.fn(),
			createLog: vi.fn().mockResolvedValue({ id: 'log1' } as any),
		} as any

		const buildCtx = vi
			.fn()
			.mockReturnValue({ fetchHtml: async () => '', fetchJson: async () => ({}) } as any)

		const s = new SyncService(toolsRepo, engineFactory, syncLogsRepo, buildCtx as any)

		const res = await s.runToolSync('t1')

		expect(engineFactory).toHaveBeenCalled()
		expect((engine.runToolSync as any).mock.calls[0][0]).toBe('t1')
		expect((syncLogsRepo.createLog as any).mock.calls.length).toBe(1)
		expect(res.status).toBe(SyncStatus.SUCCESS)
	})

	it('throws NotFound when tool missing', async () => {
		const toolsRepo: ToolsRepository = { listTools: vi.fn().mockResolvedValue([]) } as any
		const engineFactory = vi.fn()
		const syncLogsRepo: SyncLogsRepository = {
			listByTool: vi.fn(),
			listRecentFailures: vi.fn(),
			createLog: vi.fn(),
		} as any
		const buildCtx = vi.fn()

		const s = new SyncService(toolsRepo, engineFactory, syncLogsRepo, buildCtx as any)

		await expect(s.runToolSync('missing')).rejects.toThrow(/not found/i)
		expect(engineFactory).not.toHaveBeenCalled()
		expect((syncLogsRepo.createLog as any).mock.calls.length).toBe(0)
	})

	it('classifies failures correctly in created sync log', async () => {
		const tool = buildTool('t2')
		const toolsRepo: ToolsRepository = { listTools: vi.fn().mockResolvedValue([tool]) } as any

		const engine: SyncEngine = {
			runToolSync: vi.fn().mockResolvedValue({
				status: SyncStatus.ERROR,
				syncedCount: 0,
				skippedCount: 0,
				errors: ['fail'],
			}),
		} as any
		const engineFactory = vi.fn().mockReturnValue(engine)

		const createLog = vi.fn().mockImplementation(async (log) => ({ id: 'l1', ...log }))
		const syncLogsRepo: SyncLogsRepository = {
			listByTool: vi.fn(),
			listRecentFailures: vi.fn(),
			createLog,
		} as any

		const buildCtx = vi
			.fn()
			.mockReturnValue({ fetchHtml: async () => '', fetchJson: async () => ({}) } as any)

		const s = new SyncService(toolsRepo, engineFactory, syncLogsRepo, buildCtx as any)

		const res = await s.runToolSync('t2')
		expect(res.status).toBe(SyncStatus.ERROR)
		expect(createLog).toHaveBeenCalled()
		const args = createLog.mock.calls[0][0]
		expect(args.status).toBe('error')
		expect(args.errorMessage).toContain('fail')
	})
})
