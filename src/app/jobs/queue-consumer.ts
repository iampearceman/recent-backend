import type { Env } from '../../config/config'
import { createServices } from '../services/create-services'

/**
 * Minimal queue message shape used by our job queue.
 * Keep toolId optional in the type so we can validate and handle malformed
 * messages in the consumer (useful for tests and DLQ behavior).
 */
export type SyncMessage = { type: 'sync_tool'; toolId?: string }

/**
 * Queue consumer: process a sync_tool message by delegating to the SyncService.
 * - Validates payload and throws when malformed (caller/queue should then DLQ)
 * - Uses createServices to obtain the runtime SyncService — unit tests should
 *   mock createServices to provide a fake sync service.
 */
export async function processSyncMessage(message: SyncMessage, env: Env) {
	if (!message || typeof message.toolId !== 'string' || message.toolId.trim() === '') {
		// Malformed message — surface a clear error so callers can send to DLQ
		const err = new Error('Malformed sync message: missing toolId')
		console.error(err.message, message)
		throw err
	}

	const services = createServices(env as any) as any

	if (!services?.sync || typeof services.sync.runToolSync !== 'function') {
		// Defensive: the runtime should provide a SyncService; if not, it's a
		// configuration error and we should fail loudly.
		const err = new Error('Sync service not configured')
		console.error(err.message)
		throw err
	}

	await services.sync.runToolSync(message.toolId)
}

export default processSyncMessage
