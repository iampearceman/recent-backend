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

	async createLog(log: Partial<SyncLog>): Promise<SyncLog> {
		try {
			const now = new Date()
			// Build insert row matching DB column names
			const row = {
				tool_id: log.toolId ?? null,
				status: (log.status as any) ?? 'error',
				started_at: log.startedAt ?? now,
				completed_at: log.completedAt ?? null,
				items_found: log.itemsFound ?? 0,
				items_created: log.itemsCreated ?? 0,
				items_updated: log.itemsUpdated ?? 0,
				items_skipped: log.itemsSkipped ?? 0,
				error_message: log.errorMessage ?? null,
				sync_from_date: log.syncFromDate ?? null,
				sync_to_date: log.syncToDate ?? null,
				metadata: log.metadata ?? null,
			}

			// Try to insert and return the created row mapped to domain shape.
			// The exact return shape depends on the DB adapter; handle both returned row and fallback.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const inserted = await (this.db as any).insert(syncLogs).values(row).returning()
			if (Array.isArray(inserted) && inserted.length > 0) {
				return mapRowToSyncLog(inserted[0] as DbSyncLogRow)
			}

			// fallback: synthesize a SyncLog domain object
			return {
				id: `synclog_${Date.now()}`,
				toolId: log.toolId ?? undefined,
				status: (log.status as any) ?? 'error',
				startedAt: log.startedAt ?? now,
				completedAt: log.completedAt ?? undefined,
				itemsFound: log.itemsFound ?? 0,
				itemsCreated: log.itemsCreated ?? 0,
				itemsUpdated: log.itemsUpdated ?? 0,
				itemsSkipped: log.itemsSkipped ?? 0,
				errorMessage: log.errorMessage ?? undefined,
				syncFromDate: log.syncFromDate ?? undefined,
				syncToDate: log.syncToDate ?? undefined,
				metadata: log.metadata ?? undefined,
				createdAt: now,
			}
		} catch (error) {
			throw new SyncLogsRepositoryError('Failed to create sync log', error)
		}
	}
}
