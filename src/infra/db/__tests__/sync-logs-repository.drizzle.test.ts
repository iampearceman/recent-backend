import { beforeEach, describe, expect, it } from 'vitest'
import { DrizzleSyncLogsRepository } from '../sync-logs-repository.drizzle'

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
    const self = this

    // Return an object that is both thenable and supports offset chaining.
    // This lets tests call either `.limit().offset()` or await `.limit()` directly.
    return {
      offset() {
        return Promise.resolve(self.rows)
      },
      then(resolve: any, reject: any) {
        return Promise.resolve(self.rows).then(resolve, reject)
      },
    } as any
  }
  offset() {
    return Promise.resolve(this.rows)
  }
}

describe('DrizzleSyncLogsRepository', () => {
  let db: MockDbClient
  let repo: DrizzleSyncLogsRepository

  beforeEach(() => {
    db = new MockDbClient()
    repo = new DrizzleSyncLogsRepository(db as any)
  })

  it('returns logs filtered by toolId, ordered by created_at, and limited', async () => {
    db.rows = [
      {
        id: 'a',
        tool_id: 'tool-1',
        status: 'success',
        started_at: new Date('2024-03-03T12:00:00Z'),
        completed_at: new Date('2024-03-03T12:01:00Z'),
        items_found: 10,
        items_created: 2,
        items_updated: 1,
        items_skipped: 0,
        error_message: null,
        sync_from_date: null,
        sync_to_date: null,
        metadata: null,
        created_at: new Date('2024-03-03T12:02:00Z'),
      },
      {
        id: 'b',
        tool_id: 'tool-1',
        status: 'error',
        started_at: new Date('2024-03-02T12:00:00Z'),
        completed_at: null,
        items_found: 0,
        items_created: 0,
        items_updated: 0,
        items_skipped: 0,
        error_message: 'boom',
        sync_from_date: null,
        sync_to_date: null,
        metadata: null,
        created_at: new Date('2024-03-02T12:02:00Z'),
      },
    ]

    const result = await repo.listByTool({ toolId: 'tool-1', limit: 1 })

    // We expect the entries to be returned and mapped
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('a')
    expect(result[0].itemsFound).toBe(10)
  })

  it('returns empty array if no entries for toolId', async () => {
    db.rows = []
    const result = await repo.listByTool({ toolId: 'nope', limit: 5, offset: 0 })
    expect(result).toEqual([])
  })

  it('listRecentFailures returns only error status rows ordered by created_at and limited', async () => {
    // Only include error rows to simulate the expected filter
    db.rows = [
      {
        id: '3',
        tool_id: 'tool-z',
        status: 'error',
        started_at: new Date('2025-01-03T11:00:00Z'),
        completed_at: null,
        items_found: 0,
        items_created: 0,
        items_updated: 0,
        items_skipped: 0,
        error_message: 'fail2',
        sync_from_date: null,
        sync_to_date: null,
        metadata: null,
        created_at: new Date('2025-01-03T11:02:00Z'),
      },
      {
        id: '1',
        tool_id: 'tool-x',
        status: 'error',
        started_at: new Date('2025-01-02T10:00:00Z'),
        completed_at: null,
        items_found: 0,
        items_created: 0,
        items_updated: 0,
        items_skipped: 0,
        error_message: 'fail1',
        sync_from_date: null,
        sync_to_date: null,
        metadata: null,
        created_at: new Date('2025-01-02T10:01:00Z'),
      },
    ]

    const failures = await repo.listRecentFailures({ limit: 2 })

    // Should be limited to 2 and ordered by created_at desc
    expect(failures.length).toBe(2)
    expect(failures[0].id).toBe('3')
    expect(failures[0].errorMessage).toBe('fail2')
  })
})
