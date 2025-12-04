import type { Tool } from '../tools/model'
import type { ToolsRepository } from '../tools/repository'
import type { SyncEngine } from './interfaces'
import { SyncStatus } from './model'
import type { ExtractionContext, ExtractionStrategy } from './strategies/strategy'

export type SyncEngineDeps = {
	toolsRepository: ToolsRepository
	strategies: ExtractionStrategy[]
	extractionContext: ExtractionContext
}

/**
 * Concrete SyncEngine implementation.
 * Orchestrates per-tool syncs by selecting a strategy, running extraction, and returning a SyncResult.
 * - No DB writes, queues, or scheduling here — pure orchestration.
 */
export class ConcreteSyncEngine implements SyncEngine {
	private toolsRepository: ToolsRepository
	private strategies: ExtractionStrategy[]
	private extractionContext: ExtractionContext

	constructor(deps: SyncEngineDeps) {
		this.toolsRepository = deps.toolsRepository
		this.strategies = deps.strategies || []
		this.extractionContext = deps.extractionContext
	}

	private async getToolById(toolId: string): Promise<Tool | undefined> {
		const tools = await this.toolsRepository.listTools({})
		return tools.find((t) => t.id === toolId)
	}

	private async tryStrategy(tool: Tool, strat: ExtractionStrategy, ctx?: ExtractionContext) {
		const entries = await strat.extract(tool, ctx ?? this.extractionContext)
		return entries || []
	}

	async runToolSync(toolId: string, ctx?: ExtractionContext) {
		const tool = await this.getToolById(toolId)
		if (!tool) {
			return {
				status: SyncStatus.ERROR,
				syncedCount: 0,
				skippedCount: 0,
				errors: [`tool not found: ${toolId}`],
			}
		}

		// Find strategies that can handle the tool in defined order
		const candidates = this.strategies.filter((s) => s.canHandle(tool))

		if (candidates.length === 0) {
			return {
				status: SyncStatus.ERROR,
				syncedCount: 0,
				skippedCount: 0,
				errors: ['no strategy found'],
			}
		}

		let lastError: unknown

		for (const s of candidates) {
			try {
				const entries = await this.tryStrategy(tool, s, ctx)
				const count = entries.length
				return { status: SyncStatus.SUCCESS, syncedCount: count, skippedCount: 0, errors: [] }
			} catch (err) {
				// record and continue to next candidate
				lastError = err
			}
		}

		// All matching strategies failed
		const message = lastError instanceof Error ? lastError.message : String(lastError)
		return {
			status: SyncStatus.ERROR,
			syncedCount: 0,
			skippedCount: 0,
			errors: [message || 'unknown error'],
		}
	}

	async runBulkSync(toolIds: string[]) {
		const results = [] as Awaited<ReturnType<SyncEngine['runToolSync']>>[]
		for (const id of toolIds) {
			// sequential to avoid overloading external services in the real world
			// tests will not care about concurrency.
			// eslint-disable-next-line no-await-in-loop
			results.push(await this.runToolSync(id))
		}
		return results
	}
}

export default ConcreteSyncEngine
