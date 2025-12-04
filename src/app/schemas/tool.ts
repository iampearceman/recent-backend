import { z } from 'zod'

/**
 * Tool Schemas - Public API Contracts
 * Defines the shape of Tool-related data for the public API
 */

// --- Base Tool Status & Enums ---

export const ToolStatusSchema = z.enum(['requested', 'active', 'inactive'])
export type ToolStatus = z.infer<typeof ToolStatusSchema>

export const ToolSyncStatusSchema = z.enum(['pending', 'synced', 'flagged', 'failed'])
export type ToolSyncStatus = z.infer<typeof ToolSyncStatusSchema>

export const BackfillStatusSchema = z.enum(['pending', 'in_progress', 'complete', 'failed'])
export type BackfillStatus = z.infer<typeof BackfillStatusSchema>

export const StrategyTypeSchema = z.enum(['list-page', 'card-detail', 'rss-feed'])
export type StrategyType = z.infer<typeof StrategyTypeSchema>

// --- Extraction Config Schema ---

export const ExtractionConfigSchema = z.object({
	selectors: z
		.object({
			entries: z.string().optional(),
			date: z.string().optional(),
			title: z.string().optional(),
			url: z.string().optional(),
			version: z.string().optional(),
			description: z.string().optional(),
			content: z.string().optional(),
		})
		.optional(),
	dateFormat: z.string().optional(),
	twoStepExtraction: z.boolean().optional(),
	detailPageSelector: z.string().optional(),
})

export type ExtractionConfig = z.infer<typeof ExtractionConfigSchema>

// --- Tool Detail Schema (Full) ---

export const ToolSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	website: z.string().url().nullable(),
	changelogUrl: z.string().url().nullable(),
	logoUrl: z.string().url().nullable(),
	githubUrl: z.string().url().nullable(),
	category: z.string().nullable(),
	currentVersion: z.string().nullable(),
	scrapeConfig: ExtractionConfigSchema.nullable(),
	lastSyncAt: z.string().datetime().nullable(), // ISO 8601
	lastSuccessfulSyncAt: z.string().datetime().nullable(),
	isActive: z.boolean(),
	status: ToolStatusSchema,
	syncStatus: ToolSyncStatusSchema,
	strategyType: StrategyTypeSchema.nullable(),
	lastError: z.string().nullable(),
	lastItemDate: z.string().datetime().nullable(),
	backfillStatus: BackfillStatusSchema,
	backfillStartedAt: z.string().datetime().nullable(),
	flagReason: z.string().nullable(),
	consecutiveFailures: z.number().int(),
	patternId: z.string().nullable(),
	metadata: z.record(z.string(), z.unknown()).nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type Tool = z.infer<typeof ToolSchema>

// --- Tool List Item Schema (Minimal) ---

export const ToolListItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	website: z.string().url().nullable(),
	logoUrl: z.string().url().nullable(),
	category: z.string().nullable(),
	currentVersion: z.string().nullable(),
	isActive: z.boolean(),
	status: ToolStatusSchema,
	syncStatus: ToolSyncStatusSchema,
	lastSyncAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
})

export type ToolListItem = z.infer<typeof ToolListItemSchema>

// --- Tool Create/Update Schemas ---

export const CreateToolSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().optional(),
	website: z.string().url().optional(),
	changelogUrl: z.string().url().optional(),
	logoUrl: z.string().url().optional(),
	githubUrl: z.string().url().optional(),
	category: z.string().max(100).optional(),
	currentVersion: z.string().max(50).optional(),
	scrapeConfig: ExtractionConfigSchema.optional(),
	strategyType: StrategyTypeSchema.optional(),
	isActive: z.boolean().default(false),
	status: ToolStatusSchema.default('inactive'),
	metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateTool = z.infer<typeof CreateToolSchema>

export const UpdateToolSchema = CreateToolSchema.partial()

export type UpdateTool = z.infer<typeof UpdateToolSchema>

// --- Tool Query/Filter Schemas ---

export const ToolFiltersSchema = z.object({
	status: ToolStatusSchema.optional(),
	syncStatus: ToolSyncStatusSchema.optional(),
	category: z.string().optional(),
	isActive: z.boolean().optional(),
	search: z.string().optional(), // Search by name
})

export type ToolFilters = z.infer<typeof ToolFiltersSchema>

export const ToolListQuerySchema = z.object({
	filters: ToolFiltersSchema.optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	sortBy: z.enum(['name', 'createdAt', 'lastSyncAt']).default('name'),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// --- Public API Input/Output Schemas ---
// These schemas are the single source of truth for the public API

/**
 * Input schema for listing tools
 * Used to validate query parameters for the list endpoint
 */
export const listToolsInputSchema = z.object({
	limit: z.number().int().positive().max(100).optional(),
	offset: z.number().int().nonnegative().optional(),
	search: z.string().min(1).max(100).optional(),
})

export type ListToolsInput = z.infer<typeof listToolsInputSchema>

/**
 * Tool schema for public API responses
 * Represents a tool DTO in API responses
 */
export const toolSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullable().optional(),
	logoUrl: z.string().url().nullable().optional(),
	website: z.string().url().nullable().optional(),
	category: z.string().nullable().optional(),
})

export type ToolDTO = z.infer<typeof toolSchema>

/**
 * Output schema for listing tools
 * Wraps the tools array for consistent API responses
 */
export const listToolsOutputSchema = z.object({
	tools: z.array(toolSchema),
})

export type ListToolsOutput = z.infer<typeof listToolsOutputSchema>

export type ToolListQuery = z.infer<typeof ToolListQuerySchema>

// --- Tool Response Schemas ---

export const ToolListResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		tools: z.array(ToolListItemSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type ToolListResponse = z.infer<typeof ToolListResponseSchema>

export const ToolDetailResponseSchema = z.object({
	status: z.literal('success'),
	data: ToolSchema,
})

export type ToolDetailResponse = z.infer<typeof ToolDetailResponseSchema>

export const ToolCreateResponseSchema = z.object({
	status: z.literal('success'),
	data: ToolSchema,
	message: z.string().optional(),
})

export type ToolCreateResponse = z.infer<typeof ToolCreateResponseSchema>

export const ToolUpdateResponseSchema = z.object({
	status: z.literal('success'),
	data: ToolSchema,
	message: z.string().optional(),
})

export type ToolUpdateResponse = z.infer<typeof ToolUpdateResponseSchema>

export const ToolDeleteResponseSchema = z.object({
	status: z.literal('success'),
	message: z.string(),
})

export type ToolDeleteResponse = z.infer<typeof ToolDeleteResponseSchema>

// --- Tool Statistics Schema ---

export const ToolStatsSchema = z.object({
	id: z.string(),
	subscriberCount: z.number().int(),
	changelogItemCount: z.number().int(),
	lastPublishedItemDate: z.string().datetime().nullable(),
})

export type ToolStats = z.infer<typeof ToolStatsSchema>

export const ToolStatsResponseSchema = z.object({
	status: z.literal('success'),
	data: ToolStatsSchema,
})

export type ToolStatsResponse = z.infer<typeof ToolStatsResponseSchema>
