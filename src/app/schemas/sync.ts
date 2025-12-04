import { z } from 'zod'

/**
 * Sync Schemas - Public API Contracts
 * Defines the shape of Sync-related data for the public API
 */

// --- Sync Status & Strategy Enums ---

export const SyncStatusSchema = z.enum(['success', 'error', 'partial'])
export type SyncStatus = z.infer<typeof SyncStatusSchema>

export const SyncStrategySchema = z.enum(['firecrawl', 'scrape', 'manual', 'rss'])
export type SyncStrategy = z.infer<typeof SyncStrategySchema>

export const ContentFormatSchema = z.enum(['markdown', 'html', 'text'])
export type ContentFormat = z.infer<typeof ContentFormatSchema>

// --- Sync Log Detail Schema (Full) ---

export const SyncLogMetadataSchema = z.object({
	strategy: SyncStrategySchema.optional(),
	format: ContentFormatSchema.optional(),
	duration: z.number().optional(),
	userAgent: z.string().optional(),
	httpStatus: z.number().optional(),
	usedPuppeteer: z.boolean().optional(),
	extractedEntries: z.number().optional(),
	contentLength: z.number().optional(),
	githubSynced: z.boolean().optional(),
	githubEntriesFound: z.number().optional(),
	changelogEntriesFound: z.number().optional(),
	latestVersion: z.string().nullable().optional(),
	requestId: z.string().optional(),
	dataSources: z.array(z.enum(['changelog', 'github'])).optional(),
	strategyUsed: z.string().optional(),
	detectionConfidence: z.number().optional(),
	fallbacksAttempted: z.array(z.string()).optional(),
	selectorFailures: z
		.array(
			z.object({
				selector: z.string(),
				expected: z.number(),
				found: z.number(),
			}),
		)
		.optional(),
	needsRedetection: z.boolean().optional(),
	historicalAvgEntries: z.number().optional(),
	errorReason: z.string().optional(),
	errorClassification: z
		.object({
			isImmediateFlag: z.boolean(),
			isRetryable: z.boolean(),
			maxRetries: z.number(),
		})
		.optional(),
	consecutiveFailures: z.number().optional(),
	wasFlagged: z.boolean().optional(),
	flagReason: z.string().optional(),
})

export type SyncLogMetadata = z.infer<typeof SyncLogMetadataSchema>

export const SyncLogSchema = z.object({
	id: z.string(),
	toolId: z.string().nullable(),
	status: SyncStatusSchema,
	startedAt: z.string().datetime(),
	completedAt: z.string().datetime().nullable(),
	itemsFound: z.number().int(),
	itemsCreated: z.number().int(),
	itemsUpdated: z.number().int(),
	itemsSkipped: z.number().int(),
	errorMessage: z.string().nullable(),
	syncFromDate: z.string().datetime().nullable(),
	syncToDate: z.string().datetime().nullable(),
	metadata: SyncLogMetadataSchema.nullable(),
	createdAt: z.string().datetime(),
})

export type SyncLog = z.infer<typeof SyncLogSchema>

// --- Sync Log with Tool Info ---

export const SyncLogWithToolSchema = SyncLogSchema.extend({
	tool: z
		.object({
			id: z.string(),
			name: z.string(),
			logoUrl: z.string().url().nullable(),
		})
		.nullable(),
})

export type SyncLogWithTool = z.infer<typeof SyncLogWithToolSchema>

// --- Sync Log List Item (Minimal) ---

export const SyncLogListItemSchema = z.object({
	id: z.string(),
	toolId: z.string().nullable(),
	status: SyncStatusSchema,
	startedAt: z.string().datetime(),
	completedAt: z.string().datetime().nullable(),
	itemsFound: z.number().int(),
	itemsCreated: z.number().int(),
	itemsUpdated: z.number().int(),
	itemsSkipped: z.number().int(),
	errorMessage: z.string().nullable(),
	createdAt: z.string().datetime(),
})

export type SyncLogListItem = z.infer<typeof SyncLogListItemSchema>

// --- Initiate Sync Schemas ---

export const InitiateSyncSchema = z.object({
	toolId: z.string(),
	forceSync: z.boolean().default(false), // Force sync even if recently synced
	syncFromDate: z.string().datetime().optional(), // Custom date range start
	syncToDate: z.string().datetime().optional(), // Custom date range end
	strategy: SyncStrategySchema.optional(), // Override default strategy
})

export type InitiateSync = z.infer<typeof InitiateSyncSchema>

export const InitiateSyncResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		syncId: z.string(),
		toolId: z.string(),
		startedAt: z.string().datetime(),
		message: z.string(),
	}),
})

export type InitiateSyncResponse = z.infer<typeof InitiateSyncResponseSchema>

// --- Bulk Sync Schema ---

export const BulkSyncSchema = z.object({
	toolIds: z.array(z.string()).min(1).max(50), // Limit bulk operations
	forceSync: z.boolean().default(false),
})

export type BulkSync = z.infer<typeof BulkSyncSchema>

export const BulkSyncResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		initiated: z.number().int(),
		failed: z.number().int(),
		syncs: z.array(
			z.object({
				toolId: z.string(),
				syncId: z.string().optional(),
				success: z.boolean(),
				error: z.string().optional(),
			}),
		),
	}),
})

export type BulkSyncResponse = z.infer<typeof BulkSyncResponseSchema>

// --- Sync Query/Filter Schemas ---

export const SyncLogFiltersSchema = z.object({
	toolId: z.string().optional(),
	status: SyncStatusSchema.optional(),
	fromDate: z.string().datetime().optional(), // Syncs after this date
	toDate: z.string().datetime().optional(), // Syncs before this date
	hasError: z.boolean().optional(), // Filter by error presence
})

export type SyncLogFilters = z.infer<typeof SyncLogFiltersSchema>

export const SyncLogListQuerySchema = z.object({
	filters: SyncLogFiltersSchema.optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	sortBy: z.enum(['startedAt', 'completedAt', 'createdAt']).default('startedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	includeTool: z.boolean().default(false), // Include tool info in response
})

export type SyncLogListQuery = z.infer<typeof SyncLogListQuerySchema>

// --- Sync Response Schemas ---

export const SyncLogListResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		logs: z.array(SyncLogListItemSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type SyncLogListResponse = z.infer<typeof SyncLogListResponseSchema>

export const SyncLogListWithToolResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		logs: z.array(SyncLogWithToolSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type SyncLogListWithToolResponse = z.infer<typeof SyncLogListWithToolResponseSchema>

export const SyncLogDetailResponseSchema = z.object({
	status: z.literal('success'),
	data: SyncLogSchema,
})

export type SyncLogDetailResponse = z.infer<typeof SyncLogDetailResponseSchema>

export const SyncLogDetailWithToolResponseSchema = z.object({
	status: z.literal('success'),
	data: SyncLogWithToolSchema,
})

export type SyncLogDetailWithToolResponse = z.infer<typeof SyncLogDetailWithToolResponseSchema>

// --- Sync Statistics Schema ---

export const SyncStatsSchema = z.object({
	totalSyncs: z.number().int(),
	successfulSyncs: z.number().int(),
	failedSyncs: z.number().int(),
	partialSyncs: z.number().int(),
	averageDuration: z.number().optional(), // In milliseconds
	totalItemsCreated: z.number().int(),
	totalItemsUpdated: z.number().int(),
	totalItemsSkipped: z.number().int(),
	lastSyncAt: z.string().datetime().nullable(),
	lastSuccessfulSyncAt: z.string().datetime().nullable(),
})

export type SyncStats = z.infer<typeof SyncStatsSchema>

export const SyncStatsResponseSchema = z.object({
	status: z.literal('success'),
	data: SyncStatsSchema,
})

export type SyncStatsResponse = z.infer<typeof SyncStatsResponseSchema>

// --- Sync Status Check Schema ---

export const SyncStatusCheckSchema = z.object({
	syncId: z.string(),
})

export type SyncStatusCheck = z.infer<typeof SyncStatusCheckSchema>

export const SyncStatusCheckResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		syncId: z.string(),
		toolId: z.string().nullable(),
		status: SyncStatusSchema,
		startedAt: z.string().datetime(),
		completedAt: z.string().datetime().nullable(),
		isRunning: z.boolean(),
		progress: z
			.object({
				itemsFound: z.number().int(),
				itemsProcessed: z.number().int(),
				percentComplete: z.number().min(0).max(100),
			})
			.optional(),
		errorMessage: z.string().nullable(),
	}),
})

export type SyncStatusCheckResponse = z.infer<typeof SyncStatusCheckResponseSchema>
