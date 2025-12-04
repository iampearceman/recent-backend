/**
 * ToolsService - Application Service Layer
 * Receives DTO-shaped input and returns DTO-shaped output
 *
 * ❌ No Drizzle imports
 * ❌ No Hono / tRPC / Cloudflare types
 * ✅ All parameters and return types are serializable
 */

import type { Tool } from '../../core/tools/model'
import type { ListToolsInput, ToolsRepository } from '../../core/tools/repository'
import type { ToolDTO } from '../schemas/tool'

// --- Service Input Types (DTO-shaped) ---

export interface GetToolsListInput {
	limit?: number
	offset?: number
	search?: string
}

// --- Service Output Types (DTO-shaped) ---

export interface GetToolsListOutput {
	tools: ToolDTO[]
}

// --- Utility Functions ---

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

// --- Domain to DTO Mapper ---

function mapToolToDTO(tool: Tool): ToolDTO {
	return {
		id: tool.id,
		name: tool.name,
		slug: generateSlug(tool.name),
		description: tool.description ?? null,
		logoUrl: tool.logoUrl ?? null,
		website: tool.website ?? null,
		category: tool.category ?? null,
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
			tools: tools.map(mapToolToDTO),
		}
	}
}
