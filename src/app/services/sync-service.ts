import { NotFoundError } from '../../core/shared/errors'
import type { SyncEngine } from '../../core/sync/interfaces'
import type { SyncResult } from '../../core/sync/model'
import type { ExtractionContext } from '../../core/sync/strategies/strategy'
import type { SyncLogsRepository } from '../../core/sync-logs/repository'
import type { Tool } from '../../core/tools/model'
import type { ToolsRepository } from '../../core/tools/repository'

export type EngineFactory = (ctx: ExtractionContext) => SyncEngine

export class SyncService {
	constructor(
		private toolsRepo: ToolsRepository,
		private engineFactory: EngineFactory,
		private syncLogsRepo: SyncLogsRepository,
		private buildExtractionContext: (tool: Tool) => ExtractionContext,
	) {}

	/**
	 * Run sync for a single tool.
	 * - Loads the tool from ToolsRepository
	 * - Builds an ExtractionContext using infra-provided builder
	 * - Creates a SyncEngine for that context and runs the sync
	 * - Persists a sync log via SyncLogsRepository
	 */
	async runToolSync(toolId: string): Promise<SyncResult> {
		const tools = await this.toolsRepo.listTools({})
		const tool = tools.find((t) => t.id === toolId)
		if (!tool) throw new NotFoundError(`tool not found: ${toolId}`)

		const ctx = this.buildExtractionContext(tool)

		const engine = this.engineFactory(ctx)

		const startedAt = new Date()

		let result: SyncResult
		try {
			// give engine the same context in case it accepts it
			// (SyncEngine.runToolSync accepts optional context)
			result = await engine.runToolSync(toolId, ctx)
		} catch (err) {
			// If engine throws, classify as error result
			result = {
				status: 'error',
				syncedCount: 0,
				skippedCount: 0,
				errors: [(err as Error)?.message ?? String(err)],
			}
		}

		// Write sync log — best-effort; bubble errors up
		await this.syncLogsRepo.createLog({
			toolId: tool.id,
			status: result.status as any,
			startedAt,
			completedAt: new Date(),
			itemsFound: result.syncedCount,
			itemsCreated: result.syncedCount,
			itemsUpdated: 0,
			itemsSkipped: result.skippedCount,
			errorMessage: result.errors?.join('\n') ?? undefined,
			syncFromDate: undefined,
			syncToDate: undefined,
			metadata: { strategy: tool.strategyType ?? null },
		})

		return result
	}
}

export default SyncService
