import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/pg-core'
import type { ExtractionConfig } from '../sync-engine/schemas/types'
import {
	generateAuditLogId,
	generateCommentId,
	generateReactionId,
	generateSettingsId,
	generateSyncLogId,
	generateUserId,
	generateUserToolSubscriptionId,
} from '../utils/id-generator'

// ID generators for new tables
function generateExtractionPatternId(): string {
	return `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function generateExtractionLogId(): string {
	return `extlog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// --- Users & Auth ---

export const users = pgTable(
	'users',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateUserId),
		external_id: varchar({ length: 255 }).notNull().unique(), // Clerk ID
		username: varchar({ length: 255 }).notNull(),
		first_name: varchar({ length: 255 }).notNull(),
		last_name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull().unique(),
		avatar_url: varchar({ length: 500 }),
		role: varchar({ length: 50 }).default('user').notNull(), // 'user', 'admin'
		status: varchar({ length: 50 }).default('active').notNull(), // 'active', 'suspended'
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for searching users by email/username (Admin panel)
		searchIdx: index('user_search_idx').on(t.email, t.username),
	}),
)

// --- Tools & Content ---

// Tool status enum - tracks whether tool is requested by user, active, or inactive
export const toolStatusEnum = pgEnum('tool_status', ['requested', 'active', 'inactive'])

// TypeScript constants for type-safe status values
export const ToolStatus = {
	REQUESTED: 'requested',
	ACTIVE: 'active',
	INACTIVE: 'inactive',
} as const

export type ToolStatusType = (typeof ToolStatus)[keyof typeof ToolStatus]

// Tool sync status enum - tracks the sync health of a tool
export const toolSyncStatusEnum = pgEnum('tool_sync_status', [
	'pending', // Never synced
	'synced', // Last sync successful
	'flagged', // Needs attention (selector drift)
	'failed', // Last sync failed
])

// TypeScript constants for type-safe sync status values
export const ToolSyncStatus = {
	PENDING: 'pending',
	SYNCED: 'synced',
	FLAGGED: 'flagged',
	FAILED: 'failed',
} as const

export type ToolSyncStatusType = (typeof ToolSyncStatus)[keyof typeof ToolSyncStatus]

// Backfill status enum - tracks 90-day backfill progress
export const backfillStatusEnum = pgEnum('backfill_status', [
	'pending', // Never backfilled
	'in_progress', // Backfill currently running
	'complete', // 90-day backfill completed
	'failed', // Last backfill attempt failed
])

// TypeScript constants for type-safe backfill status values
export const BackfillStatus = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	COMPLETE: 'complete',
	FAILED: 'failed',
} as const

export type BackfillStatusType = (typeof BackfillStatus)[keyof typeof BackfillStatus]

// Strategy type for changelog extraction
export const StrategyType = {
	LIST_PAGE: 'list-page',
	CARD_DETAIL: 'card-detail',
	RSS_FEED: 'rss-feed',
} as const

export type StrategyTypeValue = (typeof StrategyType)[keyof typeof StrategyType]

export const tools = pgTable(
	'tools',
	{
		id: varchar({ length: 255 }).primaryKey(),
		name: varchar({ length: 255 }).notNull(),
		description: text(),
		website: varchar({ length: 500 }),
		changelog_url: varchar({ length: 500 }),
		logo_url: varchar({ length: 500 }),
		github_url: varchar({ length: 500 }),
		category: varchar({ length: 100 }),
		// Current version extracted from GitHub releases or changelog
		current_version: varchar({ length: 50 }),
		// Extraction configuration for changelog syncing
		// This JSON column allows flexibility for different strategies (Firecrawl, Puppeteer, etc.)
		scrape_config: json().$type<ExtractionConfig>(),
		last_sync_at: timestamp(),
		last_successful_sync_at: timestamp(),
		is_active: boolean().default(false).notNull(),
		// Status for tracking user-requested tools vs admin-created tools
		status: toolStatusEnum().default('inactive').notNull(),
		// Sync status for tracking sync health (pending, synced, flagged, failed)
		sync_status: toolSyncStatusEnum().default('pending').notNull(),
		// Strategy type for extraction (list-page, card-detail, rss-feed)
		strategy_type: varchar({ length: 50 }).$type<StrategyTypeValue>(),
		// Last error message from sync attempt
		last_error: text(),
		// Date of the most recent changelog item extracted
		last_item_date: timestamp(),
		// Backfill status - tracks 90-day initial backfill progress
		backfill_status: backfillStatusEnum().default('pending').notNull(),
		// Timestamp when backfill was started (for timeout detection)
		backfill_started_at: timestamp(),
		// Reason why the tool was flagged (e.g., NO_CHANGELOG_FOUND, SELECTORS_FAILED)
		flag_reason: text(),
		// Counter for consecutive sync failures (used to determine when to flag)
		consecutive_failures: integer().default(0).notNull(),
		// Link to learned extraction pattern (optional)
		pattern_id: varchar({ length: 255 }).references(() => extractionPatterns.id, {
			onDelete: 'set null',
		}),
		metadata: json(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(tableRef) => ({
		// Index for filtering active tools by category (Discovery page)
		categoryActiveIdx: index('tool_category_active_idx').on(tableRef.category, tableRef.is_active),
		// Index for search by name
		nameIdx: index('tool_name_idx').on(tableRef.name),
		// Index for filtering by status
		statusIdx: index('tool_status_idx').on(tableRef.status),
	}),
)

export const changelogItems = pgTable(
	'changelog_items',
	{
		id: varchar({ length: 255 }).primaryKey(),
		tool_id: varchar({ length: 255 })
			.notNull()
			.references(() => tools.id, { onDelete: 'cascade' }),
		title: varchar({ length: 500 }).notNull(),
		description: varchar({ length: 1000 }),
		content: text(),
		cover_image: varchar({ length: 500 }),
		published_at: timestamp(),
		version: varchar({ length: 50 }),
		type: varchar({ length: 50 }).default('update'), // update, feature, bugfix, security, breaking
		tags: json().$type<string[]>().default([]),
		status: varchar({ length: 20 }).default('draft').notNull(), // draft, published, rejected, pending
		external_id: varchar({ length: 255 }),
		external_url: varchar({ length: 500 }),
		// Identity key for robust deduplication: hash(tool_id + external_url)
		identity_key: varchar({ length: 64 }).unique(),
		metadata: json(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Critical for feed queries: "Show me published updates for tool X, sorted by date"
		feedIdx: index('changelog_feed_idx').on(t.tool_id, t.status, t.published_at),
		// Index for finding updates by external ID (deduplication during scraping)
		externalIdIdx: index('changelog_external_id_idx').on(t.tool_id, t.external_id),
		// Index for fast identity key lookups (deduplication)
		identityKeyIdx: index('changelog_identity_key_idx').on(t.identity_key),
	}),
)

// --- Social & Interaction ---

export const reactions = pgTable(
	'reactions',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateReactionId),
		user_id: varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		changelog_item_id: varchar({ length: 255 })
			.notNull()
			.references(() => changelogItems.id, { onDelete: 'cascade' }),
		type: varchar({ length: 50 }).default('upvote').notNull(), // 'upvote', 'heart', etc.
		created_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Ensure a user can only react once per type per item
		unique_user_item_reaction: unique().on(t.user_id, t.changelog_item_id, t.type),
		// Index for counting reactions on an item quickly
		itemReactionIdx: index('reaction_item_idx').on(t.changelog_item_id),
	}),
)

export const comments = pgTable(
	'comments',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateCommentId),
		user_id: varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		changelog_item_id: varchar({ length: 255 })
			.notNull()
			.references(() => changelogItems.id, { onDelete: 'cascade' }),
		content: text().notNull(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for fetching comments for an item quickly
		itemCommentIdx: index('comment_item_idx').on(t.changelog_item_id),
	}),
)

// --- System & Logs ---

// Enum for sync log status
export const syncStatusEnum = pgEnum('sync_status', ['success', 'error', 'partial'])

// TypeScript constants for type-safe status values
export const SyncStatus = {
	SUCCESS: 'success',
	ERROR: 'error',
	PARTIAL: 'partial',
} as const

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus]

export const syncLogs = pgTable('sync_logs', {
	id: varchar({ length: 255 }).primaryKey().$defaultFn(generateSyncLogId),
	tool_id: varchar({ length: 255 }).references(() => tools.id, {
		onDelete: 'set null',
	}),
	status: syncStatusEnum().notNull(),
	started_at: timestamp().notNull(),
	completed_at: timestamp(),
	items_found: integer().default(0),
	items_created: integer().default(0),
	items_updated: integer().default(0),
	items_skipped: integer().default(0), // Tracks duplicates that were skipped
	error_message: text(),
	sync_from_date: timestamp(),
	sync_to_date: timestamp(),
	metadata: json().$type<{
		strategy?: 'firecrawl' | 'scrape' | 'manual' | 'rss'
		format?: 'markdown' | 'html' | 'text'
		duration?: number
		userAgent?: string
		httpStatus?: number
		usedPuppeteer?: boolean
		extractedEntries?: number
		contentLength?: number
		// Data source tracking
		githubSynced?: boolean
		githubEntriesFound?: number
		changelogEntriesFound?: number
		latestVersion?: string | null
		requestId?: string
		dataSources?: ('changelog' | 'github')[]
		// Strategy detection tracking
		strategyUsed?: string
		detectionConfidence?: number
		fallbacksAttempted?: string[]
		// Selector drift detection
		selectorFailures?: Array<{
			selector: string
			expected: number
			found: number
		}>
		needsRedetection?: boolean
		historicalAvgEntries?: number
		// Error classification (for failed syncs)
		errorReason?: string
		errorClassification?: {
			isImmediateFlag: boolean
			isRetryable: boolean
			maxRetries: number
		}
		consecutiveFailures?: number
		wasFlagged?: boolean
		flagReason?: string
	}>(),
	created_at: timestamp().defaultNow().notNull(),
})

export const userToolSubscriptions = pgTable(
	'user_tool_subscriptions',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateUserToolSubscriptionId),
		user_id: varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tool_id: varchar({ length: 255 })
			.notNull()
			.references(() => tools.id, { onDelete: 'cascade' }),
		// Granular preferences per subscription (e.g. mute specific tool)
		preferences: json().$type<{
			notify_breaking?: boolean
			notify_features?: boolean
			notify_security?: boolean
		}>(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for counting subscribers efficiently
		toolIdIdx: index('tool_id_idx').on(t.tool_id),
		// Index for quickly fetching a user's feed: "Get all tools user X follows"
		userIdIdx: index('user_id_idx').on(t.user_id),
		// Ensure a user can't subscribe to the same tool twice
		uniqueUserTool: unique().on(t.user_id, t.tool_id),
	}),
)

export const settings = pgTable('settings', {
	id: varchar({ length: 255 }).primaryKey().$defaultFn(generateSettingsId),
	key: varchar({ length: 255 }).notNull().unique(),
	value: json().notNull(),
	description: text(),
	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp().defaultNow().notNull(),
})

// Audit log actions enum
export const auditActionEnum = pgEnum('audit_action', [
	'email_reveal',
	'role_update',
	'status_update',
	'user_delete',
	'tool_create',
	'tool_update',
	'tool_delete',
])

// TypeScript constants for type-safe action values
export const AuditAction = {
	EMAIL_REVEAL: 'email_reveal',
	ROLE_UPDATE: 'role_update',
	STATUS_UPDATE: 'status_update',
	USER_DELETE: 'user_delete',
	TOOL_CREATE: 'tool_create',
	TOOL_UPDATE: 'tool_update',
	TOOL_DELETE: 'tool_delete',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateAuditLogId),
		admin_user_id: varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: 'set null' }),
		action: auditActionEnum().notNull(),
		target_user_id: varchar({ length: 255 }).references(() => users.id, {
			onDelete: 'set null',
		}),
		target_resource_id: varchar({ length: 255 }), // Generic ID for tools, etc.
		target_resource_type: varchar({ length: 50 }), // 'tool', 'user', etc.
		details: json().$type<{
			old_value?: string
			new_value?: string
			reason?: string
			[key: string]: unknown
		}>(),
		ip_address: varchar({ length: 45 }), // IPv6 max length
		user_agent: text(),
		created_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for finding all actions by an admin
		adminUserIdx: index('audit_admin_user_idx').on(t.admin_user_id),
		// Index for finding all actions on a target user
		targetUserIdx: index('audit_target_user_idx').on(t.target_user_id),
		// Index for finding actions by type
		actionIdx: index('audit_action_idx').on(t.action),
		// Index for chronological queries
		createdAtIdx: index('audit_created_at_idx').on(t.created_at),
	}),
)

// --- Extraction Patterns & Learning ---

export const extractionPatterns = pgTable(
	'extraction_patterns',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateExtractionPatternId),
		domain: text().notNull(),
		pattern_type: varchar({ length: 50 }).notNull(), // 'github-style', 'blog-style', 'card-style', 'table-style', 'custom'
		selectors: json()
			.$type<{
				entries?: string
				date?: string
				title?: string
				url?: string
				version?: string
				description?: string
				content?: string
			}>()
			.notNull(),
		date_format: varchar({ length: 50 }),
		two_step_extraction: boolean().default(false),
		detail_page_selector: text(),
		success_rate: integer().default(100).notNull(), // 0-100
		usage_count: integer().default(1).notNull(),
		created_at: timestamp().defaultNow().notNull(),
		updated_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for finding patterns by domain
		domainIdx: index('extraction_pattern_domain_idx').on(t.domain),
		// Index for finding patterns by type
		patternTypeIdx: index('extraction_pattern_type_idx').on(t.pattern_type),
		// Index for sorting by success rate
		successRateIdx: index('extraction_pattern_success_rate_idx').on(t.success_rate),
	}),
)

export const extractionLogs = pgTable(
	'extraction_logs',
	{
		id: varchar({ length: 255 }).primaryKey().$defaultFn(generateExtractionLogId),
		tool_id: varchar({ length: 255 }).references(() => tools.id, {
			onDelete: 'cascade',
		}),
		success: boolean().notNull(),
		entries_extracted: integer().default(0),
		error_message: text(),
		config_used: json().$type<ExtractionConfig>(),
		created_at: timestamp().defaultNow().notNull(),
	},
	(t) => ({
		// Index for finding logs by tool
		toolIdIdx: index('extraction_log_tool_id_idx').on(t.tool_id),
		// Index for filtering by success
		successIdx: index('extraction_log_success_idx').on(t.success),
		// Index for chronological queries
		createdAtIdx: index('extraction_log_created_at_idx').on(t.created_at),
	}),
)

// --- Relations ---

export const usersRelations = relations(users as any, ({ many }) => ({
	toolSubscriptions: many(userToolSubscriptions),
	reactions: many(reactions),
	comments: many(comments),
	adminAuditLogs: many(auditLogs, { relationName: 'admin_audit_logs' }),
	targetAuditLogs: many(auditLogs, { relationName: 'target_audit_logs' }),
}))

export const toolsRelations = relations(tools as any, ({ one, many }) => ({
	changelogItems: many(changelogItems),
	userSubscriptions: many(userToolSubscriptions),
	syncLogs: many(syncLogs),
	extractionLogs: many(extractionLogs),
	pattern: one(extractionPatterns, {
		fields: [tools.pattern_id],
		references: [extractionPatterns.id],
	}),
}))

export const changelogItemsRelations = relations(changelogItems as any, ({ one, many }) => ({
	tool: one(tools, {
		fields: [changelogItems.tool_id],
		references: [tools.id],
	}),
	reactions: many(reactions),
	comments: many(comments),
}))

export const reactionsRelations = relations(reactions as any, ({ one }) => ({
	user: one(users, { fields: [reactions.user_id], references: [users.id] }),
	changelogItem: one(changelogItems, {
		fields: [reactions.changelog_item_id],
		references: [changelogItems.id],
	}),
}))

export const commentsRelations = relations(comments as any, ({ one }) => ({
	user: one(users, { fields: [comments.user_id], references: [users.id] }),
	changelogItem: one(changelogItems, {
		fields: [comments.changelog_item_id],
		references: [changelogItems.id],
	}),
}))

export const syncLogsRelations = relations(syncLogs as any, ({ one }) => ({
	tool: one(tools, {
		fields: [syncLogs.tool_id],
		references: [tools.id],
	}),
}))

export const userToolSubscriptionsRelations = relations(
	userToolSubscriptions as any,
	({ one }) => ({
		user: one(users, {
			fields: [userToolSubscriptions.user_id],
			references: [users.id],
		}),
		tool: one(tools, {
			fields: [userToolSubscriptions.tool_id],
			references: [tools.id],
		}),
	}),
)

export const auditLogsRelations = relations(auditLogs as any, ({ one }) => ({
	adminUser: one(users, {
		fields: [auditLogs.admin_user_id],
		references: [users.id],
		relationName: 'admin_audit_logs',
	}),
	targetUser: one(users, {
		fields: [auditLogs.target_user_id],
		references: [users.id],
		relationName: 'target_audit_logs',
	}),
}))

export const extractionPatternsRelations = relations(extractionPatterns as any, ({ many }) => ({
	tools: many(tools),
}))

export const extractionLogsRelations = relations(extractionLogs as any, ({ one }) => ({
	tool: one(tools, {
		fields: [extractionLogs.tool_id],
		references: [tools.id],
	}),
}))
