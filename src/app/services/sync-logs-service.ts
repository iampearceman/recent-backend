import type { SyncLogsRepository } from '../../core/sync-logs/repository'
import type { SyncLogListItem } from '../schemas/sync'

export interface GetSyncLogsByToolInput {
	toolId: string
	limit?: number
	cursor?: string
}

export interface GetSyncLogsByToolOutput {
	logs: SyncLogListItem[]
	nextCursor?: string
}

export interface GetRecentFailuresInput {
	limit?: number
}

export interface GetRecentFailuresOutput {
	failures: Array<{
		id: string
		toolId: string | null
		status: 'error' | 'success' | 'partial'
		startedAt: string
		completedAt: string | null
		itemsFound: number
		itemsCreated: number
		itemsUpdated: number
		itemsSkipped: number
		errorMessage: string | null
		createdAt: string
	}>
}

const DEFAULT_LIMIT = 20

function mapDomainToListItem(row: any): SyncLogListItem {
	return {
		id: row.id,
		toolId: row.toolId ?? null,
		status: row.status,
		startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : String(row.startedAt),
		completedAt: row.completedAt
			? row.completedAt instanceof Date
				? row.completedAt.toISOString()
				: String(row.completedAt)
			: null,
		itemsFound: row.itemsFound,
		itemsCreated: row.itemsCreated,
		itemsUpdated: row.itemsUpdated,
		itemsSkipped: row.itemsSkipped,
		errorMessage: row.errorMessage ?? null,
		createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
	}
}

export class SyncLogsService {
	constructor(private repo: SyncLogsRepository) {}

	async listByTool(input: GetSyncLogsByToolInput): Promise<GetSyncLogsByToolOutput> {
		const { toolId, limit = DEFAULT_LIMIT, cursor } = input
		const offset = cursor ? Number(cursor) : 0

		const rows = await this.repo.listByTool({ toolId, limit, offset })

		const logs = rows.map(mapDomainToListItem)

		const nextCursor = rows.length === limit ? String(offset + limit) : undefined

		return { logs, nextCursor }
	}

	async recentFailures(input: GetRecentFailuresInput = {}): Promise<GetRecentFailuresOutput> {
		const { limit = DEFAULT_LIMIT } = input
		const rows = await this.repo.listRecentFailures({ limit })

		return {
			failures: rows.map((r) => ({
				id: r.id,
				toolId: r.toolId ?? null,
				status: r.status as 'error' | 'success' | 'partial',
				startedAt: r.startedAt instanceof Date ? r.startedAt.toISOString() : String(r.startedAt),
				completedAt: null,
				itemsFound: 0,
				itemsCreated: 0,
				itemsUpdated: 0,
				itemsSkipped: 0,
				errorMessage: r.errorMessage ?? null,
				createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
			})),
		}
	}
}
