/**
 * Sync Domain Model
 * Pure domain types and enums for sync operations.
 */

// --- Type Aliases ---

export type ToolId = string

// --- Domain Enums ---

export const SyncStatus = {
	SUCCESS: 'success',
	ERROR: 'error',
	PARTIAL: 'partial',
} as const

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus]

// --- Result Shape ---

/**
 * SyncResult is a lightweight description of the outcome of a sync operation.
 * This is intentionally small and framework agnostic — strategies / services can extend it.
 */
export interface SyncResult {
	status: SyncStatusType
	syncedCount: number
	skippedCount: number
	errors?: string[]
}

export default SyncStatus
