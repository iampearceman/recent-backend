/**
 * Tool Domain Model
 * Pure domain types with no framework dependencies (no Drizzle, Cloudflare, tRPC, Hono, etc.)
 */

import { DomainError } from '../shared/errors'

// --- Type Aliases ---

export type ToolId = string

// --- Domain Enums ---

export const ToolStatus = {
	REQUESTED: 'requested',
	ACTIVE: 'active',
	INACTIVE: 'inactive',
} as const

export type ToolStatusType = (typeof ToolStatus)[keyof typeof ToolStatus]

export const ToolSyncStatus = {
	PENDING: 'pending',
	SYNCED: 'synced',
	FLAGGED: 'flagged',
	FAILED: 'failed',
} as const

export type ToolSyncStatusType = (typeof ToolSyncStatus)[keyof typeof ToolSyncStatus]

export const BackfillStatus = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	COMPLETE: 'complete',
	FAILED: 'failed',
} as const

export type BackfillStatusType = (typeof BackfillStatus)[keyof typeof BackfillStatus]

export const StrategyType = {
	LIST_PAGE: 'list-page',
	CARD_DETAIL: 'card-detail',
	RSS_FEED: 'rss-feed',
} as const

export type StrategyTypeValue = (typeof StrategyType)[keyof typeof StrategyType]

// --- Extraction Config ---

export interface ExtractionConfig {
	selectors?: {
		entries?: string
		date?: string
		title?: string
		url?: string
		version?: string
		description?: string
		content?: string
	}
	dateFormat?: string
	twoStepExtraction?: boolean
	detailPageSelector?: string
}

// --- Domain Object ---

export interface Tool {
	id: ToolId
	name: string
	description: string | undefined
	website: string | undefined
	changelogUrl: string | undefined
	logoUrl: string | undefined
	githubUrl: string | undefined
	category: string | undefined
	currentVersion: string | undefined
	scrapeConfig: ExtractionConfig | undefined
	lastSyncAt: Date | undefined
	lastSuccessfulSyncAt: Date | undefined
	isActive: boolean
	status: ToolStatusType
	syncStatus: ToolSyncStatusType
	strategyType: StrategyTypeValue | undefined
	lastError: string | undefined
	lastItemDate: Date | undefined
	backfillStatus: BackfillStatusType
	backfillStartedAt: Date | undefined
	flagReason: string | undefined
	consecutiveFailures: number
	patternId: string | undefined
	metadata: Record<string, unknown> | undefined
	createdAt: Date
	updatedAt: Date
}

// --- Database Row Type ---

/**
 * DbToolRow represents the raw database row structure.
 * This type is used locally for mapping purposes.
 */
export interface DbToolRow {
	id: string
	name: string
	description: string | null
	website: string | null
	changelog_url: string | null
	logo_url: string | null
	github_url: string | null
	category: string | null
	current_version: string | null
	scrape_config: ExtractionConfig | null
	last_sync_at: Date | null
	last_successful_sync_at: Date | null
	is_active: boolean
	status: string
	sync_status: string
	strategy_type: string | null
	last_error: string | null
	last_item_date: Date | null
	backfill_status: string
	backfill_started_at: Date | null
	flag_reason: string | null
	consecutive_failures: number
	pattern_id: string | null
	metadata: Record<string, unknown> | null
	created_at: Date
	updated_at: Date
}

// --- Validation Helpers ---

function isValidToolStatus(status: string): status is ToolStatusType {
	return Object.values(ToolStatus).includes(status as ToolStatusType)
}

function isValidToolSyncStatus(syncStatus: string): syncStatus is ToolSyncStatusType {
	return Object.values(ToolSyncStatus).includes(syncStatus as ToolSyncStatusType)
}

function isValidBackfillStatus(backfillStatus: string): backfillStatus is BackfillStatusType {
	return Object.values(BackfillStatus).includes(backfillStatus as BackfillStatusType)
}

function isValidStrategyType(strategyType: string): strategyType is StrategyTypeValue {
	return Object.values(StrategyType).includes(strategyType as StrategyTypeValue)
}

// --- Mapping Function ---

/**
 * Maps a database tool row to a pure domain Tool object.
 * Validates status enums and normalizes nullable fields to undefined.
 *
 * @param row - Raw database row
 * @returns Domain Tool object
 * @throws DomainError if status values are invalid
 */
export function mapToolRowToDomain(row: DbToolRow): Tool {
	// Validate status fields
	if (!isValidToolStatus(row.status)) {
		throw new DomainError(`Invalid tool status: ${row.status}`, 'INVALID_TOOL_STATUS', 400)
	}

	if (!isValidToolSyncStatus(row.sync_status)) {
		throw new DomainError(
			`Invalid tool sync status: ${row.sync_status}`,
			'INVALID_SYNC_STATUS',
			400,
		)
	}

	if (!isValidBackfillStatus(row.backfill_status)) {
		throw new DomainError(
			`Invalid backfill status: ${row.backfill_status}`,
			'INVALID_BACKFILL_STATUS',
			400,
		)
	}

	// Validate strategy type if present
	if (row.strategy_type !== null && !isValidStrategyType(row.strategy_type)) {
		throw new DomainError(
			`Invalid strategy type: ${row.strategy_type}`,
			'INVALID_STRATEGY_TYPE',
			400,
		)
	}

	return {
		id: row.id,
		name: row.name,
		description: row.description ?? undefined,
		website: row.website ?? undefined,
		changelogUrl: row.changelog_url ?? undefined,
		logoUrl: row.logo_url ?? undefined,
		githubUrl: row.github_url ?? undefined,
		category: row.category ?? undefined,
		currentVersion: row.current_version ?? undefined,
		scrapeConfig: row.scrape_config ?? undefined,
		lastSyncAt: row.last_sync_at ?? undefined,
		lastSuccessfulSyncAt: row.last_successful_sync_at ?? undefined,
		isActive: row.is_active,
		status: row.status,
		syncStatus: row.sync_status,
		strategyType: row.strategy_type ?? undefined,
		lastError: row.last_error ?? undefined,
		lastItemDate: row.last_item_date ?? undefined,
		backfillStatus: row.backfill_status,
		backfillStartedAt: row.backfill_started_at ?? undefined,
		flagReason: row.flag_reason ?? undefined,
		consecutiveFailures: row.consecutive_failures,
		patternId: row.pattern_id ?? undefined,
		metadata: row.metadata ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}
