import { desc, eq } from 'drizzle-orm'
import type { ChangelogEntry } from '../../core/changelog/model'
import type { ChangelogRepository, ListChangelogInput } from '../../core/changelog/repository'
import { ChangelogRepositoryError } from '../../core/changelog/repository'
import type { DbClient } from './client'
import { changelogItems } from './schema'

const DEFAULT_LIMIT = 50

function mapChangelogRowToDomain(row: any): ChangelogEntry {
	return {
		id: row.id,
		toolId: row.tool_id,
		date: row.published_at,
		version: row.version ?? undefined,
		title: row.title ?? undefined,
		url: row.external_url ?? undefined,
		content: row.content ?? undefined,
	}
}

export class DrizzleChangelogRepository implements ChangelogRepository {
	constructor(private db: DbClient) {}

	async listChangelogByTool({
		toolId,
		limit = DEFAULT_LIMIT,
		offset = 0,
	}: ListChangelogInput): Promise<ChangelogEntry[]> {
		try {
			const rows = await this.db
				.select()
				.from(changelogItems)
				.where(eq(changelogItems.tool_id, toolId))
				.orderBy(desc(changelogItems.published_at))
				.limit(limit)
				.offset(offset)

			return rows.map(mapChangelogRowToDomain)
		} catch (error) {
			throw new ChangelogRepositoryError('Failed to list changelog entries', error)
		}
	}
}
