/**
 * Tool Domain Model - Unit Tests
 * Tests pure domain logic without framework dependencies
 */

import { describe, expect, it } from 'vitest'
import { DomainError } from '../../shared/errors'
import {
	BackfillStatus,
	mapToolRowToDomain,
	StrategyType,
	ToolStatus,
	ToolSyncStatus,
	type DbToolRow,
	type Tool,
} from '../model'

describe('Tool Domain Model', () => {
	describe('mapToolRowToDomain', () => {
		it('maps full DB row to domain object', () => {
			// Given: A complete database row with all fields populated
			const dbRow: DbToolRow = {
				id: 'tool_123',
				name: 'Example Tool',
				description: 'A test tool for unit testing',
				website: 'https://example.com',
				changelog_url: 'https://example.com/changelog',
				logo_url: 'https://example.com/logo.png',
				github_url: 'https://github.com/example/tool',
				category: 'Development',
				current_version: '2.1.0',
				scrape_config: {
					selectors: {
						entries: '.changelog-entry',
						date: '.date',
						title: '.title',
						url: '.link',
						version: '.version',
						description: '.description',
						content: '.content',
					},
					dateFormat: 'YYYY-MM-DD',
					twoStepExtraction: true,
					detailPageSelector: '.detail-link',
				},
				last_sync_at: new Date('2025-12-01T10:00:00Z'),
				last_successful_sync_at: new Date('2025-12-01T10:00:00Z'),
				is_active: true,
				status: 'active',
				sync_status: 'synced',
				strategy_type: 'list-page',
				last_error: null,
				last_item_date: new Date('2025-11-30T08:00:00Z'),
				backfill_status: 'complete',
				backfill_started_at: new Date('2025-11-15T12:00:00Z'),
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: 'pattern_456',
				metadata: { verified: true, popularity: 100 },
				created_at: new Date('2025-01-01T00:00:00Z'),
				updated_at: new Date('2025-12-01T10:00:00Z'),
			}

			// When: We map the row to a domain object
			const tool: Tool = mapToolRowToDomain(dbRow)

			// Then: All fields are correctly mapped with proper transformations
			expect(tool).toEqual({
				id: 'tool_123',
				name: 'Example Tool',
				description: 'A test tool for unit testing',
				website: 'https://example.com',
				changelogUrl: 'https://example.com/changelog',
				logoUrl: 'https://example.com/logo.png',
				githubUrl: 'https://github.com/example/tool',
				category: 'Development',
				currentVersion: '2.1.0',
				scrapeConfig: {
					selectors: {
						entries: '.changelog-entry',
						date: '.date',
						title: '.title',
						url: '.link',
						version: '.version',
						description: '.description',
						content: '.content',
					},
					dateFormat: 'YYYY-MM-DD',
					twoStepExtraction: true,
					detailPageSelector: '.detail-link',
				},
				lastSyncAt: new Date('2025-12-01T10:00:00Z'),
				lastSuccessfulSyncAt: new Date('2025-12-01T10:00:00Z'),
				isActive: true,
				status: ToolStatus.ACTIVE,
				syncStatus: ToolSyncStatus.SYNCED,
				strategyType: StrategyType.LIST_PAGE,
				lastError: undefined,
				lastItemDate: new Date('2025-11-30T08:00:00Z'),
				backfillStatus: BackfillStatus.COMPLETE,
				backfillStartedAt: new Date('2025-11-15T12:00:00Z'),
				flagReason: undefined,
				consecutiveFailures: 0,
				patternId: 'pattern_456',
				metadata: { verified: true, popularity: 100 },
				createdAt: new Date('2025-01-01T00:00:00Z'),
				updatedAt: new Date('2025-12-01T10:00:00Z'),
			})

			// And: Status enums are properly typed
			expect(tool.status).toBe(ToolStatus.ACTIVE)
			expect(tool.syncStatus).toBe(ToolSyncStatus.SYNCED)
			expect(tool.backfillStatus).toBe(BackfillStatus.COMPLETE)
			expect(tool.strategyType).toBe(StrategyType.LIST_PAGE)
		})

		it('handles nullable/optional fields correctly', () => {
			// Given: A minimal database row with many null fields
			const dbRow: DbToolRow = {
				id: 'tool_minimal',
				name: 'Minimal Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'requested',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When: We map the row to a domain object
			const tool: Tool = mapToolRowToDomain(dbRow)

			// Then: Null values are converted to undefined in the domain
			expect(tool.description).toBeUndefined()
			expect(tool.website).toBeUndefined()
			expect(tool.changelogUrl).toBeUndefined()
			expect(tool.logoUrl).toBeUndefined()
			expect(tool.githubUrl).toBeUndefined()
			expect(tool.category).toBeUndefined()
			expect(tool.currentVersion).toBeUndefined()
			expect(tool.scrapeConfig).toBeUndefined()
			expect(tool.lastSyncAt).toBeUndefined()
			expect(tool.lastSuccessfulSyncAt).toBeUndefined()
			expect(tool.strategyType).toBeUndefined()
			expect(tool.lastError).toBeUndefined()
			expect(tool.lastItemDate).toBeUndefined()
			expect(tool.backfillStartedAt).toBeUndefined()
			expect(tool.flagReason).toBeUndefined()
			expect(tool.patternId).toBeUndefined()
			expect(tool.metadata).toBeUndefined()

			// And: Required fields are still properly set
			expect(tool.id).toBe('tool_minimal')
			expect(tool.name).toBe('Minimal Tool')
			expect(tool.isActive).toBe(false)
			expect(tool.status).toBe(ToolStatus.REQUESTED)
			expect(tool.syncStatus).toBe(ToolSyncStatus.PENDING)
			expect(tool.backfillStatus).toBe(BackfillStatus.PENDING)
			expect(tool.consecutiveFailures).toBe(0)
		})

		it('handles all valid status enum values', () => {
			// Given: Base row that we'll modify for each test
			const baseRow: DbToolRow = {
				id: 'tool_status_test',
				name: 'Status Test Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'requested',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// Test all tool status values
			const toolStatuses: Array<typeof baseRow.status> = ['requested', 'active', 'inactive']
			for (const status of toolStatuses) {
				const tool = mapToolRowToDomain({ ...baseRow, status })
				expect(tool.status).toBe(status)
			}

			// Test all sync status values
			const syncStatuses: Array<typeof baseRow.sync_status> = [
				'pending',
				'synced',
				'flagged',
				'failed',
			]
			for (const syncStatus of syncStatuses) {
				const tool = mapToolRowToDomain({ ...baseRow, sync_status: syncStatus })
				expect(tool.syncStatus).toBe(syncStatus)
			}

			// Test all backfill status values
			const backfillStatuses: Array<typeof baseRow.backfill_status> = [
				'pending',
				'in_progress',
				'complete',
				'failed',
			]
			for (const backfillStatus of backfillStatuses) {
				const tool = mapToolRowToDomain({ ...baseRow, backfill_status: backfillStatus })
				expect(tool.backfillStatus).toBe(backfillStatus)
			}

			// Test all strategy type values
			const strategyTypes: Array<string> = ['list-page', 'card-detail', 'rss-feed']
			for (const strategyType of strategyTypes) {
				const tool = mapToolRowToDomain({ ...baseRow, strategy_type: strategyType })
				expect(tool.strategyType).toBe(strategyType)
			}
		})

		it('rejects invalid tool status', () => {
			// Given: A row with an invalid tool status
			const dbRow: DbToolRow = {
				id: 'tool_invalid',
				name: 'Invalid Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'invalid_status',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When/Then: Mapping throws a domain error
			expect(() => mapToolRowToDomain(dbRow)).toThrow(DomainError)
			expect(() => mapToolRowToDomain(dbRow)).toThrow('Invalid tool status: invalid_status')

			// And: Error has the correct error code
			try {
				mapToolRowToDomain(dbRow)
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError)
				expect((error as DomainError).code).toBe('INVALID_TOOL_STATUS')
			}
		})

		it('rejects invalid sync status', () => {
			// Given: A row with an invalid sync status
			const dbRow: DbToolRow = {
				id: 'tool_invalid',
				name: 'Invalid Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'requested',
				sync_status: 'unknown',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When/Then: Mapping throws a domain error
			expect(() => mapToolRowToDomain(dbRow)).toThrow(DomainError)
			expect(() => mapToolRowToDomain(dbRow)).toThrow('Invalid tool sync status: unknown')

			// And: Error has the correct error code
			try {
				mapToolRowToDomain(dbRow)
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError)
				expect((error as DomainError).code).toBe('INVALID_SYNC_STATUS')
			}
		})

		it('rejects invalid backfill status', () => {
			// Given: A row with an invalid backfill status
			const dbRow: DbToolRow = {
				id: 'tool_invalid',
				name: 'Invalid Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'requested',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'corrupted',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When/Then: Mapping throws a domain error
			expect(() => mapToolRowToDomain(dbRow)).toThrow(DomainError)
			expect(() => mapToolRowToDomain(dbRow)).toThrow('Invalid backfill status: corrupted')

			// And: Error has the correct error code
			try {
				mapToolRowToDomain(dbRow)
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError)
				expect((error as DomainError).code).toBe('INVALID_BACKFILL_STATUS')
			}
		})

		it('rejects invalid strategy type', () => {
			// Given: A row with an invalid strategy type
			const dbRow: DbToolRow = {
				id: 'tool_invalid',
				name: 'Invalid Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'requested',
				sync_status: 'pending',
				strategy_type: 'invalid-strategy',
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When/Then: Mapping throws a domain error
			expect(() => mapToolRowToDomain(dbRow)).toThrow(DomainError)
			expect(() => mapToolRowToDomain(dbRow)).toThrow('Invalid strategy type: invalid-strategy')

			// And: Error has the correct error code
			try {
				mapToolRowToDomain(dbRow)
			} catch (error) {
				expect(error).toBeInstanceOf(DomainError)
				expect((error as DomainError).code).toBe('INVALID_STRATEGY_TYPE')
			}
		})

		it('handles partial scrapeConfig with missing optional fields', () => {
			// Given: A row with partial scrape config
			const dbRow: DbToolRow = {
				id: 'tool_partial_config',
				name: 'Partial Config Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: {
					selectors: {
						entries: '.entry',
						// Other selector fields are optional and missing
					},
					// dateFormat and other fields are optional and missing
				},
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'active',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: null,
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When: We map the row to a domain object
			const tool: Tool = mapToolRowToDomain(dbRow)

			// Then: scrapeConfig is preserved with its partial structure
			expect(tool.scrapeConfig).toBeDefined()
			expect(tool.scrapeConfig?.selectors?.entries).toBe('.entry')
			expect(tool.scrapeConfig?.dateFormat).toBeUndefined()
			expect(tool.scrapeConfig?.twoStepExtraction).toBeUndefined()
		})

		it('preserves complex metadata structures', () => {
			// Given: A row with complex nested metadata
			const dbRow: DbToolRow = {
				id: 'tool_metadata',
				name: 'Metadata Tool',
				description: null,
				website: null,
				changelog_url: null,
				logo_url: null,
				github_url: null,
				category: null,
				current_version: null,
				scrape_config: null,
				last_sync_at: null,
				last_successful_sync_at: null,
				is_active: false,
				status: 'active',
				sync_status: 'pending',
				strategy_type: null,
				last_error: null,
				last_item_date: null,
				backfill_status: 'pending',
				backfill_started_at: null,
				flag_reason: null,
				consecutive_failures: 0,
				pattern_id: null,
				metadata: {
					tags: ['development', 'testing'],
					stats: {
						downloads: 1000,
						stars: 500,
					},
					verified: true,
				},
				created_at: new Date('2025-12-04T00:00:00Z'),
				updated_at: new Date('2025-12-04T00:00:00Z'),
			}

			// When: We map the row to a domain object
			const tool: Tool = mapToolRowToDomain(dbRow)

			// Then: Metadata structure is preserved exactly
			expect(tool.metadata).toEqual({
				tags: ['development', 'testing'],
				stats: {
					downloads: 1000,
					stars: 500,
				},
				verified: true,
			})
		})
	})
})
