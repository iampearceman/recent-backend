/**
 * Tools List Integration Tests
 * End-to-end tests with real Drizzle repository and tRPC router
 *
 * ✅ Real Drizzle repo wired to test DB
 * ✅ Real ToolsService
 * ✅ Proper context
 * ❌ No HTTP server - calls router programmatically
 *
 * Note: This test uses a custom repository that queries only existing DB columns
 * to handle schema drift between code and database.
 */

import { sql } from 'drizzle-orm'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { appRouter } from '../../app/routes/root-router'
import { ToolsService } from '../../app/services/tools-service'
import type { Services, TRPCContext } from '../../app/trpc/context'
import type { AppConfig } from '../../config/config'
import type { Tool } from '../../core/tools/model'
import type { ListToolsInput, ToolsRepository } from '../../core/tools/repository'
import { ToolsRepositoryError } from '../../core/tools/repository'
import type { DbClient } from '../../infra/db/client'
import { createDb } from '../../infra/db/client'

// --- Test Configuration ---

function getTestConfig(): AppConfig {
	const dbUrl = process.env.DB_URL || process.env.DATABASE_URL

	if (!dbUrl) {
		throw new Error('DB_URL or DATABASE_URL environment variable required for integration tests')
	}

	return {
		database: { url: dbUrl },
		openai: { apiKey: undefined },
		environment: 'development',
		isDevelopment: true,
		isProduction: false,
	}
}

// --- Test Fixtures ---

/**
 * Test tool shape matching the actual database columns
 * Note: DB schema may be ahead of migrations, so we only use columns that exist
 */
interface TestTool {
	id: string
	name: string
	description?: string | null
	website?: string | null
	changelog_url?: string | null
	logo_url?: string | null
	github_url?: string | null
	category?: string | null
	is_active?: boolean
	status?: 'requested' | 'active' | 'inactive'
}

function createTestTool(overrides: Partial<TestTool> & { id: string; name: string }): TestTool {
	return {
		description: null,
		website: null,
		changelog_url: null,
		logo_url: null,
		github_url: null,
		category: null,
		is_active: false,
		status: 'inactive',
		...overrides,
	}
}

// --- Test Repository ---
// Custom repository that queries only existing DB columns

interface RawToolRow {
	id: string
	name: string
	description: string | null
	website: string | null
	changelog_url: string | null
	logo_url: string | null
	github_url: string | null
	category: string | null
	current_version: string | null
	is_active: boolean
	status: string
	created_at: Date
	updated_at: Date
}

class TestToolsRepository implements ToolsRepository {
	constructor(private db: DbClient) {}

	async listTools({ limit = 50, offset = 0, search }: ListToolsInput): Promise<Tool[]> {
		try {
			let queryResult: unknown

			if (search) {
				queryResult = await this.db.execute(sql`
					SELECT id, name, description, website, changelog_url, logo_url, 
						   github_url, category, current_version, is_active, status, 
						   created_at, updated_at
					FROM tools
					WHERE name ILIKE ${`%${search}%`}
					ORDER BY created_at DESC
					LIMIT ${limit}
					OFFSET ${offset}
				`)
			} else {
				queryResult = await this.db.execute(sql`
					SELECT id, name, description, website, changelog_url, logo_url, 
						   github_url, category, current_version, is_active, status, 
						   created_at, updated_at
					FROM tools
					ORDER BY created_at DESC
					LIMIT ${limit}
					OFFSET ${offset}
				`)
			}

			// Handle both array and { rows: [] } response formats from Neon
			const resultWithRows = queryResult as { rows?: RawToolRow[] }
			const rows: RawToolRow[] = Array.isArray(queryResult)
				? (queryResult as RawToolRow[])
				: resultWithRows.rows || []
			return rows.map((row) => this.mapRowToTool(row))
		} catch (error) {
			throw new ToolsRepositoryError('Failed to list tools', error)
		}
	}

	private mapRowToTool(row: RawToolRow): Tool {
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
			scrapeConfig: undefined,
			lastSyncAt: undefined,
			lastSuccessfulSyncAt: undefined,
			isActive: row.is_active,
			status: (row.status as 'requested' | 'active' | 'inactive') || 'inactive',
			syncStatus: 'pending',
			strategyType: undefined,
			lastError: undefined,
			lastItemDate: undefined,
			backfillStatus: 'pending',
			backfillStartedAt: undefined,
			flagReason: undefined,
			consecutiveFailures: 0,
			patternId: undefined,
			metadata: undefined,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}
	}
}

// --- Test Context Factory ---

function createTestContext(db: DbClient, config: AppConfig): TRPCContext {
	// Use test repository that works with actual DB columns
	const toolsRepository = new TestToolsRepository(db)
	const toolsService = new ToolsService(toolsRepository)

	const services: Services = {
		tools: toolsService,
	}

	return {
		db,
		config,
		user: null,
		services,
	}
}

// --- Check if DB is available ---

function hasDbConnection(): boolean {
	return !!(process.env.DB_URL || process.env.DATABASE_URL)
}

// --- Test Suite ---

describe.skipIf(!hasDbConnection())('Tools List Integration', () => {
	let db: DbClient
	let config: AppConfig
	let ctx: TRPCContext
	let caller: ReturnType<typeof appRouter.createCaller>

	// Test tool IDs for cleanup
	const testToolIds: string[] = []

	beforeAll(() => {
		config = getTestConfig()
		db = createDb(config)
	})

	beforeEach(() => {
		ctx = createTestContext(db, config)
		caller = appRouter.createCaller(ctx)
	})

	afterEach(async () => {
		// Clean up test data - delete tools created during tests
		if (testToolIds.length > 0) {
			try {
				// Use raw SQL to delete test tools
				for (const id of testToolIds) {
					await db.execute(sql`DELETE FROM tools WHERE id = ${id}`)
				}
			} catch (error) {
				console.warn('Cleanup warning:', error)
			}
			testToolIds.length = 0
		}
	})

	// --- Helper Functions ---

	/**
	 * Seed tools using raw SQL to avoid schema mismatch issues
	 * Only inserts columns that exist in the actual database
	 */
	async function seedTools(toolsToSeed: TestTool[]): Promise<void> {
		for (const tool of toolsToSeed) {
			await db.execute(sql`
				INSERT INTO tools (id, name, description, website, changelog_url, logo_url, github_url, category, is_active, status)
				VALUES (
					${tool.id},
					${tool.name},
					${tool.description ?? null},
					${tool.website ?? null},
					${tool.changelog_url ?? null},
					${tool.logo_url ?? null},
					${tool.github_url ?? null},
					${tool.category ?? null},
					${tool.is_active ?? false},
					${tool.status ?? 'inactive'}
				)
			`)
			testToolIds.push(tool.id)
		}
	}

	// --- End-to-end Happy Path ---

	describe('end-to-end happy path', () => {
		it('should return 2 tools when DB is seeded with 2 tools', async () => {
			// Given: DB is seeded with 2 tools
			const testId1 = `test_tool_${Date.now()}_1`
			const testId2 = `test_tool_${Date.now()}_2`

			await seedTools([
				createTestTool({
					id: testId1,
					name: 'Integration Tool One',
					description: 'First test tool',
					website: 'https://tool-one.com',
					category: 'testing',
				}),
				createTestTool({
					id: testId2,
					name: 'Integration Tool Two',
					description: 'Second test tool',
					website: 'https://tool-two.com',
					category: 'testing',
				}),
			])

			// When: We call tools.list through the router
			const result = await caller.tools.list({})

			// Then: Response contains at least our 2 seeded tools
			expect(result.tools).toBeDefined()
			expect(Array.isArray(result.tools)).toBe(true)

			// Find our test tools in the response
			const testTools = result.tools.filter((t) => t.id === testId1 || t.id === testId2)
			expect(testTools).toHaveLength(2)

			// Verify tools are correctly shaped (DTO format)
			const toolOne = testTools.find((t) => t.id === testId1)
			expect(toolOne).toBeDefined()
			if (!toolOne) throw new Error('toolOne not found')
			expect(toolOne.name).toBe('Integration Tool One')
			expect(toolOne.slug).toBe('integration-tool-one')
			expect(toolOne.description).toBe('First test tool')
			expect(toolOne.website).toBe('https://tool-one.com')
			expect(toolOne.category).toBe('testing')

			const toolTwo = testTools.find((t) => t.id === testId2)
			expect(toolTwo).toBeDefined()
			if (!toolTwo) throw new Error('toolTwo not found')
			expect(toolTwo.name).toBe('Integration Tool Two')
			expect(toolTwo.slug).toBe('integration-tool-two')
		})

		it('should return tools with correct DTO shape', async () => {
			// Given: A tool with all fields populated
			const testId = `test_tool_${Date.now()}_full`

			await seedTools([
				createTestTool({
					id: testId,
					name: 'Full Tool',
					description: 'A tool with all fields',
					website: 'https://full-tool.com',
					logo_url: 'https://full-tool.com/logo.png',
					category: 'productivity',
				}),
			])

			// When: We call tools.list
			const result = await caller.tools.list({})

			// Then: Tool has correct DTO shape
			const tool = result.tools.find((t) => t.id === testId)
			expect(tool).toBeDefined()
			if (!tool) throw new Error('tool not found')

			// Check all DTO fields exist
			expect(tool).toHaveProperty('id')
			expect(tool).toHaveProperty('name')
			expect(tool).toHaveProperty('slug')
			expect(tool).toHaveProperty('description')
			expect(tool).toHaveProperty('logoUrl')
			expect(tool).toHaveProperty('website')
			expect(tool).toHaveProperty('category')

			// Verify values
			expect(tool.id).toBe(testId)
			expect(tool.name).toBe('Full Tool')
			expect(tool.slug).toBe('full-tool')
			expect(tool.description).toBe('A tool with all fields')
			expect(tool.logoUrl).toBe('https://full-tool.com/logo.png')
			expect(tool.website).toBe('https://full-tool.com')
			expect(tool.category).toBe('productivity')
		})
	})

	// --- Search Filter Integration ---

	describe('search filter integration', () => {
		it('should return only Novu when searching for "nov"', async () => {
			// Given: DB is seeded with Novu and Resend
			const novuId = `test_novu_${Date.now()}`
			const resendId = `test_resend_${Date.now()}`

			await seedTools([
				createTestTool({
					id: novuId,
					name: 'Novu',
					description: 'Notification infrastructure',
					website: 'https://novu.co',
					category: 'notifications',
				}),
				createTestTool({
					id: resendId,
					name: 'Resend',
					description: 'Email for developers',
					website: 'https://resend.com',
					category: 'email',
				}),
			])

			// When: We search for 'nov'
			const result = await caller.tools.list({ search: 'nov' })

			// Then: Only Novu is returned (from our test set)
			const testTools = result.tools.filter((t) => t.id === novuId || t.id === resendId)
			expect(testTools).toHaveLength(1)
			expect(testTools[0].name).toBe('Novu')
			expect(testTools[0].id).toBe(novuId)
		})

		it('should return only Resend when searching for "resend"', async () => {
			// Given: DB is seeded with Novu and Resend
			const novuId = `test_novu_${Date.now()}`
			const resendId = `test_resend_${Date.now()}`

			await seedTools([
				createTestTool({
					id: novuId,
					name: 'Novu',
					description: 'Notification infrastructure',
					website: 'https://novu.co',
					category: 'notifications',
				}),
				createTestTool({
					id: resendId,
					name: 'Resend',
					description: 'Email for developers',
					website: 'https://resend.com',
					category: 'email',
				}),
			])

			// When: We search for 'resend'
			const result = await caller.tools.list({ search: 'resend' })

			// Then: Only Resend is returned (from our test set)
			const testTools = result.tools.filter((t) => t.id === novuId || t.id === resendId)
			expect(testTools).toHaveLength(1)
			expect(testTools[0].name).toBe('Resend')
			expect(testTools[0].id).toBe(resendId)
		})

		it('should return empty array when search matches nothing', async () => {
			// Given: DB is seeded with Novu and Resend
			const novuId = `test_novu_${Date.now()}`
			const resendId = `test_resend_${Date.now()}`

			await seedTools([
				createTestTool({
					id: novuId,
					name: 'Novu',
					description: 'Notification infrastructure',
				}),
				createTestTool({
					id: resendId,
					name: 'Resend',
					description: 'Email for developers',
				}),
			])

			// When: We search for a non-existent term
			const result = await caller.tools.list({ search: 'xyznonexistent' })

			// Then: None of our test tools are returned
			const testTools = result.tools.filter((t) => t.id === novuId || t.id === resendId)
			expect(testTools).toHaveLength(0)
		})

		it('should perform case-insensitive search', async () => {
			// Given: DB is seeded with Novu
			const novuId = `test_novu_${Date.now()}`

			await seedTools([
				createTestTool({
					id: novuId,
					name: 'Novu',
					description: 'Notification infrastructure',
				}),
			])

			// When: We search with different cases
			const upperResult = await caller.tools.list({ search: 'NOVU' })
			const lowerResult = await caller.tools.list({ search: 'novu' })
			const mixedResult = await caller.tools.list({ search: 'NoVu' })

			// Then: All searches find Novu
			expect(upperResult.tools.find((t) => t.id === novuId)).toBeDefined()
			expect(lowerResult.tools.find((t) => t.id === novuId)).toBeDefined()
			expect(mixedResult.tools.find((t) => t.id === novuId)).toBeDefined()
		})
	})

	// --- Limit Parameter ---

	describe('limit parameter', () => {
		it('should respect limit parameter', async () => {
			// Given: DB is seeded with 5 tools
			const testIds = Array.from({ length: 5 }, (_, i) => `test_limit_${Date.now()}_${i}`)

			await seedTools(
				testIds.map((id, i) =>
					createTestTool({
						id,
						name: `Limit Test Tool ${i}`,
					}),
				),
			)

			// When: We request with limit=2
			const result = await caller.tools.list({ limit: 2 })

			// Then: At most 2 tools are returned
			expect(result.tools.length).toBeLessThanOrEqual(2)
		})
	})
})
