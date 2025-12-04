/**
 * SyncEngine interface(s)
 * Pure abstraction for components that can run syncs.
 */

import type { ToolId } from '../tools/model'
import type { SyncResult } from './model'

export interface SyncEngine {
	runToolSync(toolId: ToolId): Promise<SyncResult>
	runBulkSync(toolIds: ToolId[]): Promise<SyncResult[]>
}

export default SyncEngine
