/**
 * Sync Logs Domain Model
 * Pure domain types with no framework dependencies
 */

// --- Type Aliases ---

export type SyncLogId = string

// --- Domain Enums ---

export const SyncStatus = {
	SUCCESS: 'success',
	ERROR: 'error',
	PARTIAL: 'partial',
} as const

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus]

// --- Domain Objects ---

export interface SyncLog {
	id: SyncLogId
	toolId: string | undefined
	status: SyncStatusType
	startedAt: Date
	completedAt: Date | undefined
	itemsFound: number
	itemsCreated: number
	itemsUpdated: number
	itemsSkipped: number
	errorMessage: string | undefined
	syncFromDate: Date | undefined
	syncToDate: Date | undefined
	metadata: Record<string, unknown> | undefined
	createdAt: Date
}

// Minimal shape used for failure views / recent failures
export interface SyncFailure {
	id: SyncLogId
	toolId: string | undefined
	status: SyncStatusType
	startedAt: Date
	errorMessage: string | undefined
	createdAt: Date
}

// --- DB Row Type (for mapping in infra layer) ---
export interface DbSyncLogRow {
	id: string
	tool_id: string | null
	status: string
	started_at: Date
	completed_at: Date | null
	items_found: number | null
	items_created: number | null
	items_updated: number | null
	items_skipped: number | null
	error_message: string | null
	sync_from_date: Date | null
	sync_to_date: Date | null
	metadata: Record<string, unknown> | null
	created_at: Date
}
