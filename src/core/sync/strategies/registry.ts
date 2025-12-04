import type { Tool } from '../../tools/model'
import { FirecrawlStrategy } from './firecrawl-strategy'
import { GitHubReleasesStrategy } from './github-releases-strategy'
import { ManualStrategy } from './manual-strategy'
import { RssStrategy } from './rss-strategy'
import { ScrapeStrategy } from './scrape-strategy'
import type { ExtractionStrategy } from './strategy'

export const strategies: ExtractionStrategy[] = [
	ManualStrategy,
	GitHubReleasesStrategy,
	RssStrategy,
	FirecrawlStrategy,
	ScrapeStrategy,
]

/**
 * StrategyRegistry picks the first strategy whose `canHandle` returns true.
 * Order matters — list more specific strategies earlier.
 */
export function pickStrategyForTool(tool: Tool): ExtractionStrategy | undefined {
	return strategies.find((s) => s.canHandle(tool))
}

export default { strategies, pickStrategyForTool }
