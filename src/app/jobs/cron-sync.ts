import type { Env } from '../../config/config'
import { createServices } from '../services/create-services'

/**
 * Periodic cron job entrypoint.
 * - Keep logic thin: discover eligible tools, then either enqueue a message or
 *   directly invoke the sync service (if available).
 */
export async function runPeriodicSync(env: Env) {
	const services = createServices(env as any) as any

	// Discover candidates
	let tools: Array<{ id: string }> = []
	try {
		if (!services?.tools?.getToolsEligibleForSync) return
		tools = await services.tools.getToolsEligibleForSync()
	} catch (err) {
		// Don't let one discovery error crash the worker — log and exit.
		console.error('Failed to list tools eligible for sync:', (err as Error)?.message ?? err)
		return
	}

	if (!tools || tools.length === 0) return

	// For each tool, prefer queueing where available; otherwise call sync service.
	for (const tool of tools) {
		try {
			if (services?.queue && typeof services.queue.enqueue === 'function') {
				// Keep message payload minimal and serializable
				await services.queue.enqueue({ type: 'sync_tool', toolId: tool.id })
			} else if (services?.sync && typeof services.sync.runToolSync === 'function') {
				await services.sync.runToolSync(tool.id)
			} else {
				// No-op — either queue or sync not provided
				console.warn('No queue or sync service configured for cron job; skipping', tool.id)
			}
		} catch (err) {
			console.error(
				`Failed to schedule/run sync for tool ${tool.id}:`,
				(err as Error)?.message ?? err,
			)
		}
	}
}

export default runPeriodicSync
