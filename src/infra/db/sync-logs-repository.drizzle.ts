import { desc, eq } from 'drizzle-orm'
import type { DbSyncLogRow, SyncFailure, SyncLog } from '../../core/sync-logs/model'
import type {
	ListRecentFailuresInput,
	ListSyncLogsByToolInput,
	SyncLogsRepository,
} from '../../core/sync-logs/repository'
import { SyncLogsRepositoryError } from '../../core/sync-logs/repository'
import type { DbClient } from './client'
import { syncLogs } from './schema'

const DEFAULT_LIMIT = 50

function mapRowToSyncLog(row: DbSyncLogRow): SyncLog {
	return {
		id: row.id,
		toolId: row.tool_id ?? undefined,
		status: row.status as any,
		startedAt: row.started_at,
		completedAt: row.completed_at ?? undefined,
		itemsFound: row.items_found ?? 0,
		itemsCreated: row.items_created ?? 0,
		itemsUpdated: row.items_updated ?? 0,
		itemsSkipped: row.items_skipped ?? 0,
		errorMessage: row.error_message ?? undefined,
		syncFromDate: row.sync_from_date ?? undefined,
		syncToDate: row.sync_to_date ?? undefined,
		metadata: row.metadata ?? undefined,
		createdAt: row.created_at,
	}
}

function mapRowToFailure(row: DbSyncLogRow): SyncFailure {
	return {
		id: row.id,
		toolId: row.tool_id ?? undefined,
		status: row.status as any,
		startedAt: row.started_at,
		errorMessage: row.error_message ?? undefined,
		createdAt: row.created_at,
	}
}

export class DrizzleSyncLogsRepository implements SyncLogsRepository {
	constructor(private db: DbClient) {}

	async listByTool({
		toolId,
		limit = DEFAULT_LIMIT,
		offset = 0,
	}: ListSyncLogsByToolInput): Promise<SyncLog[]> {
		try {
			const rows = await this.db
				.select()
				.from(syncLogs)
				.where(eq(syncLogs.tool_id, toolId))
				.orderBy(desc(syncLogs.created_at))
				.limit(limit)
				.offset(offset)

			return rows.map(mapRowToSyncLog)
		} catch (error) {
			throw new SyncLogsRepositoryError('Failed to list sync logs by tool', error)
		}
	}

	async listRecentFailures({
		limit = DEFAULT_LIMIT,
	}: ListRecentFailuresInput = {}): Promise<SyncFailure[]> {
		try {
			const rows = await this.db
				.select()
				.from(syncLogs)
				.where(eq(syncLogs.status, 'error'))
				.orderBy(desc(syncLogs.created_at))
				.limit(limit)

			return rows.map(mapRowToFailure)
		} catch (error) {
			throw new SyncLogsRepositoryError('Failed to list recent failures', error)
		}
	}
}
