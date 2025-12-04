/**
 * ChangelogRepository Interface
 * Pure domain repository interface with no framework dependencies
 * (no Drizzle, Cloudflare, tRPC, Hono, etc.)
 */

import { DomainError } from '../shared/errors'
import type { ChangelogEntry } from './model'

// --- Repository Input Types ---

export interface ListChangelogInput {
	toolId: string
	limit?: number
	offset?: number
}

// --- Repository Error ---

export class ChangelogRepositoryError extends DomainError {
	constructor(message: string, details?: unknown) {
		super(message, 'CHANGELOG_REPOSITORY_ERROR', 500, details)
	}
}

// --- Repository Interface ---

export interface ChangelogRepository {
	listChangelogByTool(input: ListChangelogInput): Promise<ChangelogEntry[]>
}
