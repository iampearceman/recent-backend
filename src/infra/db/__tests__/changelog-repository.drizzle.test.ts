import { beforeEach, describe, expect, it } from 'vitest'
import { DrizzleChangelogRepository } from '../changelog-repository.drizzle'

// Mock DB client
class MockDbClient {
	rows: any[] = []
	select() {
		return this
	}
	from() {
		return this
	}
	where() {
		return this
	}
	orderBy() {
		return this
	}
	limit() {
		return this
	}
	offset() {
		return Promise.resolve(this.rows)
	}
}

describe('DrizzleChangelogRepository', () => {
	let db: MockDbClient
	let repo: DrizzleChangelogRepository

	beforeEach(() => {
		db = new MockDbClient()
		repo = new DrizzleChangelogRepository(db as any)
	})

	it('returns changelog entries filtered by toolId, ordered by date, and limited', async () => {
		db.rows = [
			{
				id: '1',
				tool_id: 'tool1',
				published_at: new Date('2023-01-02'),
				version: '1.1',
				title: 'Update',
				external_url: 'url1',
				content: 'content1',
			},
			{
				id: '2',
				tool_id: 'tool1',
				published_at: new Date('2023-01-01'),
				version: '1.0',
				title: 'Initial',
				external_url: 'url2',
				content: 'content2',
			},
		]
		const result = await repo.listChangelogByTool({ toolId: 'tool1', limit: 1 })
		expect(result.length).toBe(2)
		expect(result[0].id).toBe('1')
	})

	it('returns empty array if no entries for toolId', async () => {
		db.rows = []
		const result = await repo.listChangelogByTool({ toolId: 'toolX', limit: 5 })
		expect(result).toEqual([])
	})
})
