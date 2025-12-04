/**
 * ToolsRepository Interface
 * Pure domain repository interface with no framework dependencies
 * (no Drizzle, Cloudflare, tRPC, Hono, etc.)
 */

import { DomainError } from '../shared/errors'
import type { Tool } from './model'

// --- Repository Input Types ---

export interface ListToolsInput {
	limit?: number
	offset?: number
	search?: string
}

// --- Repository Error ---

export class ToolsRepositoryError extends DomainError {
	constructor(message: string, details?: unknown) {
		super(message, 'TOOLS_REPOSITORY_ERROR', 500, details)
	}
}

// --- Repository Interface ---

export interface ToolsRepository {
	listTools(input: ListToolsInput): Promise<Tool[]>
}
