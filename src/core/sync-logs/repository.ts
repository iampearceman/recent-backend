import { DomainError } from '../shared/errors'
import type { SyncFailure, SyncLog } from './model'

// --- Repository Input Types ---

export interface ListSyncLogsByToolInput {
  toolId: string
  limit?: number
  offset?: number
}

export interface ListRecentFailuresInput {
  limit?: number
}

// --- Repository Error ---

export class SyncLogsRepositoryError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'SYNC_LOGS_REPOSITORY_ERROR', 500, details)
  }
}

// --- Repository Interface ---

export interface SyncLogsRepository {
  listByTool(input: ListSyncLogsByToolInput): Promise<SyncLog[]>
  listRecentFailures(input?: ListRecentFailuresInput): Promise<SyncFailure[]>
}
