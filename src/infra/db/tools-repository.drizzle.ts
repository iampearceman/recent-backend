import { desc, ilike } from 'drizzle-orm'

import type { DbToolRow, Tool } from '../../core/tools/model'
import { mapToolRowToDomain } from '../../core/tools/model'
import type { ListToolsInput, ToolsRepository } from '../../core/tools/repository'
import { ToolsRepositoryError } from '../../core/tools/repository'
import type { DbClient } from './client'
import { tools } from './schema'

const DEFAULT_LIMIT = 50

export class DrizzleToolsRepository implements ToolsRepository {
	constructor(private db: DbClient) {}

	async listTools({ limit = DEFAULT_LIMIT, offset = 0, search }: ListToolsInput): Promise<Tool[]> {
		try {
			let query: any = this.db.select().from(tools).orderBy(desc(tools.created_at))

			if (search) {
				// Note: Schema does not have a 'slug' field, searching on 'name' only.
				// If slug is intended to be a separate field, the schema needs to be updated.
				query = query.where(ilike(tools.name, `%${search}%`))
			}

			query = query.limit(limit).offset(offset)

			const rows = await query

			return (rows as DbToolRow[]).map(mapToolRowToDomain)
		} catch (error) {
			throw new ToolsRepositoryError('Failed to list tools', error)
		}
	}
}
