import { describe, expect, it } from 'vitest'
import type { Tool } from '../../tools/model'
import type { ToolsRepository } from '../../tools/repository'
import { ConcreteSyncEngine } from '../engine'
import { SyncStatus } from '../model'
import type { ExtractionContext, ExtractionStrategy } from '../strategies/strategy'

// --- Helpers: in-memory tools repository ---
class InMemoryToolsRepo implements ToolsRepository {
	private tools: Tool[]
	constructor(tools: Tool[]) {
		this.tools = tools
	}
	async listTools() {
		return this.tools
	}
}

// --- Minimal fake ExtractionContext ---
const fakeContext: ExtractionContext = {
	fetchHtml: async (_url: string) => `<html></html>`,
	fetchJson: async <T>() => ({}) as T,
}

// --- Helper to build a simple Tool object minimal fields required for strategies ---
function buildTool(id: string, partial?: Partial<Tool>): Tool {
	const now = new Date()
	return {
		id,
		name: id,
		description: undefined,
		website: undefined,
		changelogUrl: undefined,
		logoUrl: undefined,
		githubUrl: undefined,
		category: undefined,
		currentVersion: undefined,
		scrapeConfig: undefined,
		lastSyncAt: undefined,
		lastSuccessfulSyncAt: undefined,
		isActive: true,
		status: 'active',
		syncStatus: 'synced',
		strategyType: undefined,
		lastError: undefined,
		lastItemDate: undefined,
		backfillStatus: 'pending',
		backfillStartedAt: undefined,
		flagReason: undefined,
		consecutiveFailures: 0,
		patternId: undefined,
		metadata: undefined,
		createdAt: now,
		updatedAt: now,
		...partial,
	}
}

describe('ConcreteSyncEngine', () => {
	it('happy path — picks strategy and returns success with counts', async () => {
		const tool = buildTool('tool-1')

		const repo = new InMemoryToolsRepo([tool])

		const strategy: ExtractionStrategy = {
			canHandle(t) {
				return t.id === tool.id
			},
			async extract(_t, _ctx) {
				return [
					{
						id: 'e1',
						toolId: tool.id,
						date: new Date(),
						version: undefined,
						title: 'a',
						url: undefined,
						content: undefined,
					},
					{
						id: 'e2',
						toolId: tool.id,
						date: new Date(),
						version: undefined,
						title: 'b',
						url: undefined,
						content: undefined,
					},
				]
			},
		}

		const engine = new ConcreteSyncEngine({
			toolsRepository: repo,
			strategies: [strategy],
			extractionContext: fakeContext,
		})
		const res = await engine.runToolSync(tool.id)

		expect(res.status).toBe(SyncStatus.SUCCESS)
		expect(res.syncedCount).toBe(2)
		expect(res.errors).toBeDefined()
	})

	it('falls back to next matching strategy when primary throws', async () => {
		const tool = buildTool('tool-2')
		const repo = new InMemoryToolsRepo([tool])

		let primaryTried = false

		const primary: ExtractionStrategy = {
			canHandle: (t) => t.id === tool.id,
			async extract() {
				primaryTried = true
				throw new Error('primary failed')
			},
		}

		const fallback: ExtractionStrategy = {
			canHandle: (t) => t.id === tool.id,
			async extract() {
				return [
					{
						id: 'f1',
						toolId: tool.id,
						date: new Date(),
						version: undefined,
						title: 'x',
						url: undefined,
						content: undefined,
					},
				]
			},
		}

		const engine = new ConcreteSyncEngine({
			toolsRepository: repo,
			strategies: [primary, fallback],
			extractionContext: fakeContext,
		})

		const res = await engine.runToolSync(tool.id)

		expect(primaryTried).toBe(true)
		expect(res.status).toBe(SyncStatus.SUCCESS)
		expect(res.syncedCount).toBe(1)
	})

	it('propagates errors and returns failed status when no strategy succeeds', async () => {
		const tool = buildTool('tool-3')
		const repo = new InMemoryToolsRepo([tool])

		const a: ExtractionStrategy = {
			canHandle: (t) => t.id === tool.id,
			async extract() {
				throw new Error('boom')
			},
		}

		const b: ExtractionStrategy = {
			canHandle: (t) => t.id === tool.id,
			async extract() {
				throw new Error('kaboom')
			},
		}

		const engine = new ConcreteSyncEngine({
			toolsRepository: repo,
			strategies: [a, b],
			extractionContext: fakeContext,
		})

		const res = await engine.runToolSync(tool.id)
		expect(res.status).toBe(SyncStatus.ERROR)
		expect(Array.isArray(res.errors)).toBe(true)
		expect(res.errors?.[0]).toMatch(/(boom|kaboom)/i)
	})

	it('runBulkSync returns results for each id', async () => {
		const t1 = buildTool('a')
		const t2 = buildTool('b')
		const repo = new InMemoryToolsRepo([t1, t2])

		const s: ExtractionStrategy = {
			canHandle: () => true,
			async extract(t) {
				return [
					{
						id: `i-${t.id}`,
						toolId: t.id,
						date: new Date(),
						version: undefined,
						title: 'x',
						url: undefined,
						content: undefined,
					},
				]
			},
		}

		const engine = new ConcreteSyncEngine({
			toolsRepository: repo,
			strategies: [s],
			extractionContext: fakeContext,
		})
		const results = await engine.runBulkSync([t1.id, t2.id])

		expect(results).toHaveLength(2)
		expect(results[0].status).toBe(SyncStatus.SUCCESS)
		expect(results[1].status).toBe(SyncStatus.SUCCESS)
	})
})
