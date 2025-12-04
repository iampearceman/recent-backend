/**
 * Public API Schemas - Contract Definitions
 *
 * This module exports all public API schemas and types.
 * These schemas define the contract between the API and its consumers.
 *
 * Usage in tRPC routers:
 * ```typescript
 * import { ToolListQuerySchema, ToolListResponseSchema } from '@/app/schemas'
 *
 * router.query('tools.list', {
 *   input: ToolListQuerySchema,
 *   output: ToolListResponseSchema,
 *   async resolve({ input }) {
 *     // implementation
 *   }
 * })
 * ```
 */

// --- Changelog Schemas ---
export * from './changelog'
// --- Error Schemas ---
export * from './error-schema'

// --- Sync Schemas ---
export * from './sync'
// --- Tool Schemas ---
export * from './tool'
