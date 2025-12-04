/**
 * SyncEngine interface(s)
 * Pure abstraction for components that can run syncs.
 */

import type { ToolId } from '../tools/model'
import type { SyncResult } from './model'
import type { ExtractionContext } from './strategies/strategy'

export interface SyncEngine {
	runToolSync(toolId: ToolId, ctx?: ExtractionContext): Promise<SyncResult>
	runBulkSync(toolIds: ToolId[]): Promise<SyncResult[]>
}

export default SyncEngine
