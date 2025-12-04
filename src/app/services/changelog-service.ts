import type { ChangelogRepository } from '../../core/changelog/repository'
import type { ChangelogByToolInput, ChangelogByToolOutput } from '../schemas/changelog'

export class ChangelogService {
	private repository: ChangelogRepository

	constructor(repository: ChangelogRepository) {
		this.repository = repository
	}

	async getChangelogByTool(input: ChangelogByToolInput): Promise<ChangelogByToolOutput> {
		const { toolId, limit = 20, cursor } = input
		const offset = cursor ? Number(cursor) : 0

		const rows = await this.repository.listChangelogByTool({ toolId, limit, offset })

		// Map domain rows to API list items (minimal fields required by schema)
		const entries = rows.map((r: any) => ({
			id: r.id,
			toolId: r.toolId,
			title: r.title ?? null,
			description: null,
			coverImage: null,
			publishedAt: r.date instanceof Date ? r.date.toISOString() : String(r.date),
			version: r.version ?? null,
			type: 'update' as const,
			tags: [] as string[],
			status: 'published' as const,
			createdAt: r.date instanceof Date ? r.date.toISOString() : String(r.date),
		}))

		const nextCursor = rows.length === limit ? String(offset + limit) : undefined

		return { entries, nextCursor }
	}
}
