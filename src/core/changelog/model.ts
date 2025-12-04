/**
 * Changelog Domain Model
 * Pure domain types with no framework dependencies (no Drizzle, Cloudflare, tRPC, Hono, etc.)
 */

// --- Type Aliases ---

export type ChangelogEntryId = string

// --- Domain Object ---

export interface ChangelogEntry {
	id: ChangelogEntryId
	toolId: string
	date: Date
	version: string | undefined
	title: string | undefined
	url: string | undefined
	content: string | undefined
}
