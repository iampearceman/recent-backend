import type { ChangelogEntry } from '../../changelog/model'
import type { Tool } from '../../tools/model'

/**
 * ExtractionContext provides IO abstractions (no globals, no fetch usage here).
 * Strategies should use the provided methods to fetch HTML / JSON.
 */
export interface ExtractionContext {
	fetchHtml(url: string): Promise<string>
	fetchJson<T = unknown>(url: string): Promise<T>
}

/**
 * A generic extraction strategy.
 */
export interface ExtractionStrategy {
	canHandle(tool: Tool): boolean
	extract(tool: Tool, context: ExtractionContext): Promise<ChangelogEntry[]>
}

// Note: strategy.ts only defines the shared interfaces. Strategy implementations
// live in sibling files and should be imported directly to avoid circular
// type/module resolution problems.
