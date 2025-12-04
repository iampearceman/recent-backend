/**
 * ToolsService - Application Service Layer
 * Receives DTO-shaped input and returns DTO-shaped output
 *
 * ❌ No Drizzle imports
 * ❌ No Hono / tRPC / Cloudflare types
 * ✅ All parameters and return types are serializable
 */

import type { ToolsRepository, ListToolsInput } from '../../core/tools/repository'
import type { Tool } from '../../core/tools/model'
import type { ToolListItem } from '../schemas/tool'

// --- Service Input Types (DTO-shaped) ---

export interface GetToolsListInput {
	limit?: number
	offset?: number
	search?: string
}

// --- Service Output Types (DTO-shaped) ---

export interface GetToolsListOutput {
	tools: ToolListItem[]
}

// --- Domain to DTO Mapper ---

function mapToolToListItem(tool: Tool): ToolListItem {
	return {
		id: tool.id,
		name: tool.name,
		description: tool.description ?? null,
		website: tool.website ?? null,
		logoUrl: tool.logoUrl ?? null,
		category: tool.category ?? null,
		currentVersion: tool.currentVersion ?? null,
		isActive: tool.isActive,
		status: tool.status,
		syncStatus: tool.syncStatus,
		lastSyncAt: tool.lastSyncAt?.toISOString() ?? null,
		createdAt: tool.createdAt.toISOString(),
	}
}

// --- Service Class ---

export class ToolsService {
	constructor(private repo: ToolsRepository) {}

	async getToolsList(input: GetToolsListInput): Promise<GetToolsListOutput> {
		const repoInput: ListToolsInput = {
			limit: input.limit,
			offset: input.offset,
			search: input.search,
		}

		const tools = await this.repo.listTools(repoInput)

		return {
			tools: tools.map(mapToolToListItem),
		}
	}
}
