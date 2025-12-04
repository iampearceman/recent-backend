import { z } from 'zod'

/**
 * Changelog Schemas - Public API Contracts
 * Defines the shape of Changelog-related data for the public API
 */

// --- Changelog Item Types & Enums ---

export const ChangelogItemTypeSchema = z.enum([
	'update',
	'feature',
	'bugfix',
	'security',
	'breaking',
])
export type ChangelogItemType = z.infer<typeof ChangelogItemTypeSchema>

export const ChangelogItemStatusSchema = z.enum(['draft', 'published', 'rejected', 'pending'])
export type ChangelogItemStatus = z.infer<typeof ChangelogItemStatusSchema>

// --- Changelog Item Detail Schema (Full) ---

export const ChangelogItemSchema = z.object({
	id: z.string(),
	toolId: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	content: z.string().nullable(),
	coverImage: z.string().url().nullable(),
	publishedAt: z.string().datetime().nullable(),
	version: z.string().nullable(),
	type: ChangelogItemTypeSchema,
	tags: z.array(z.string()),
	status: ChangelogItemStatusSchema,
	externalId: z.string().nullable(),
	externalUrl: z.string().url().nullable(),
	identityKey: z.string().nullable(),
	metadata: z.record(z.string(), z.unknown()).nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
})

export type ChangelogItem = z.infer<typeof ChangelogItemSchema>

// --- Changelog Item with Tool Info ---

export const ChangelogItemWithToolSchema = ChangelogItemSchema.extend({
	tool: z.object({
		id: z.string(),
		name: z.string(),
		logoUrl: z.string().url().nullable(),
		website: z.string().url().nullable(),
	}),
})

export type ChangelogItemWithTool = z.infer<typeof ChangelogItemWithToolSchema>

// --- Changelog List Item Schema (Minimal) ---

export const ChangelogListItemSchema = z.object({
	id: z.string(),
	toolId: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	coverImage: z.string().url().nullable(),
	publishedAt: z.string().datetime().nullable(),
	version: z.string().nullable(),
	type: ChangelogItemTypeSchema,
	tags: z.array(z.string()),
	status: ChangelogItemStatusSchema,
	createdAt: z.string().datetime(),
})

export type ChangelogListItem = z.infer<typeof ChangelogListItemSchema>

// --- Changelog Create/Update Schemas ---

export const CreateChangelogItemSchema = z.object({
	toolId: z.string(),
	title: z.string().min(1).max(500),
	description: z.string().max(1000).optional(),
	content: z.string().optional(),
	coverImage: z.string().url().optional(),
	publishedAt: z.string().datetime().optional(),
	version: z.string().max(50).optional(),
	type: ChangelogItemTypeSchema.default('update'),
	tags: z.array(z.string()).default([]),
	status: ChangelogItemStatusSchema.default('draft'),
	externalId: z.string().optional(),
	externalUrl: z.string().url().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateChangelogItem = z.infer<typeof CreateChangelogItemSchema>

export const UpdateChangelogItemSchema = CreateChangelogItemSchema.partial().omit({ toolId: true })

export type UpdateChangelogItem = z.infer<typeof UpdateChangelogItemSchema>

// --- Changelog Query/Filter Schemas ---

export const ChangelogFiltersSchema = z.object({
	toolId: z.string().optional(),
	toolIds: z.array(z.string()).optional(), // For multiple tools (feed)
	type: ChangelogItemTypeSchema.optional(),
	status: ChangelogItemStatusSchema.optional(),
	tags: z.array(z.string()).optional(), // Filter by tags
	fromDate: z.string().datetime().optional(), // Published after this date
	toDate: z.string().datetime().optional(), // Published before this date
	search: z.string().optional(), // Search by title/description
})

export type ChangelogFilters = z.infer<typeof ChangelogFiltersSchema>

export const ChangelogListQuerySchema = z.object({
	filters: ChangelogFiltersSchema.optional(),
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	sortBy: z.enum(['publishedAt', 'createdAt', 'updatedAt']).default('publishedAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
	includeTool: z.boolean().default(false), // Include tool info in response
})

export type ChangelogListQuery = z.infer<typeof ChangelogListQuerySchema>

// --- Changelog Response Schemas ---

export const ChangelogListResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		items: z.array(ChangelogListItemSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type ChangelogListResponse = z.infer<typeof ChangelogListResponseSchema>

export const ChangelogListWithToolResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		items: z.array(ChangelogItemWithToolSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type ChangelogListWithToolResponse = z.infer<typeof ChangelogListWithToolResponseSchema>

export const ChangelogDetailResponseSchema = z.object({
	status: z.literal('success'),
	data: ChangelogItemSchema,
})

export type ChangelogDetailResponse = z.infer<typeof ChangelogDetailResponseSchema>

export const ChangelogDetailWithToolResponseSchema = z.object({
	status: z.literal('success'),
	data: ChangelogItemWithToolSchema,
})

export type ChangelogDetailWithToolResponse = z.infer<typeof ChangelogDetailWithToolResponseSchema>

export const ChangelogCreateResponseSchema = z.object({
	status: z.literal('success'),
	data: ChangelogItemSchema,
	message: z.string().optional(),
})

export type ChangelogCreateResponse = z.infer<typeof ChangelogCreateResponseSchema>

export const ChangelogUpdateResponseSchema = z.object({
	status: z.literal('success'),
	data: ChangelogItemSchema,
	message: z.string().optional(),
})

export type ChangelogUpdateResponse = z.infer<typeof ChangelogUpdateResponseSchema>

export const ChangelogDeleteResponseSchema = z.object({
	status: z.literal('success'),
	message: z.string(),
})

export type ChangelogDeleteResponse = z.infer<typeof ChangelogDeleteResponseSchema>

// --- User Feed Schema (Personalized) ---

export const UserFeedQuerySchema = z.object({
	page: z.number().int().min(1).default(1),
	limit: z.number().int().min(1).max(100).default(20),
	types: z.array(ChangelogItemTypeSchema).optional(), // Filter by types
	fromDate: z.string().datetime().optional(), // Only items after this date
})

export type UserFeedQuery = z.infer<typeof UserFeedQuerySchema>

export const UserFeedResponseSchema = z.object({
	status: z.literal('success'),
	data: z.object({
		items: z.array(ChangelogItemWithToolSchema),
		pagination: z.object({
			page: z.number().int(),
			limit: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	}),
})

export type UserFeedResponse = z.infer<typeof UserFeedResponseSchema>

// --- Changelog Statistics Schema ---

export const ChangelogStatsSchema = z.object({
	totalItems: z.number().int(),
	byType: z.object({
		update: z.number().int(),
		feature: z.number().int(),
		bugfix: z.number().int(),
		security: z.number().int(),
		breaking: z.number().int(),
	}),
	byStatus: z.object({
		draft: z.number().int(),
		published: z.number().int(),
		rejected: z.number().int(),
		pending: z.number().int(),
	}),
	recentCount: z.number().int(), // Last 7 days
	lastPublishedAt: z.string().datetime().nullable(),
})

export type ChangelogStats = z.infer<typeof ChangelogStatsSchema>

export const ChangelogStatsResponseSchema = z.object({
	status: z.literal('success'),
	data: ChangelogStatsSchema,
})

export type ChangelogStatsResponse = z.infer<typeof ChangelogStatsResponseSchema>
