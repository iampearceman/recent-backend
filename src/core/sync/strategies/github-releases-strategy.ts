import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'
import type { ExtractionContext, ExtractionStrategy } from './strategy'

type GitHubRelease = {
	id: number | string
	html_url?: string
	name?: string
	tag_name?: string
	body?: string
	published_at?: string
}

export const GitHubReleasesStrategy: ExtractionStrategy = {
	canHandle(tool: Tool): boolean {
		const gh = tool.githubUrl ?? ''
		const cl = tool.changelogUrl ?? ''
		return Boolean(
			gh.includes('github.com') || cl.includes('/releases') || cl.includes('github.com'),
		)
	},

	async extract(tool: Tool, ctx: ExtractionContext): Promise<ChangelogEntry[]> {
		// Try to call the tool.changelogUrl as JSON (e.g., GitHub API) or fallback to githubUrl
		const base = tool.changelogUrl ?? tool.githubUrl
		if (!base) return []

		// If the URL looks like a GitHub releases API endpoint, assume JSON array
		let raw: GitHubRelease[]
		try {
			raw = await ctx.fetchJson<GitHubRelease[]>(base)
		} catch (_err) {
			// Couldn't fetch JSON; return empty gracefully
			return []
		}

		return (raw || []).map((r, idx) => ({
			id: `${tool.id}-gh-${r.id ?? idx}-${Date.now()}`,
			toolId: tool.id,
			date: r.published_at ? new Date(r.published_at) : new Date(),
			version: r.tag_name ?? r.name,
			title: r.name ?? r.tag_name,
			url: r.html_url ?? undefined,
			content: r.body ?? undefined,
		}))
	},
}

export default GitHubReleasesStrategy
