import { z } from 'zod'
import { SyncLogListItemSchema } from './sync'

// --- By Tool (cursor pagination) ---
export const SyncLogsByToolInputSchema = z.object({
  toolId: z.string(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export type SyncLogsByToolInput = z.infer<typeof SyncLogsByToolInputSchema>

export const SyncLogsByToolOutputSchema = z.object({
  logs: z.array(SyncLogListItemSchema),
  nextCursor: z.string().optional(),
})

export type SyncLogsByToolOutput = z.infer<typeof SyncLogsByToolOutputSchema>

// --- Recent Failures ---
export const RecentFailuresInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
})

export type RecentFailuresInput = z.infer<typeof RecentFailuresInputSchema>

export const RecentFailuresOutputSchema = z.object({
  failures: z.array(SyncLogListItemSchema),
})

export type RecentFailuresOutput = z.infer<typeof RecentFailuresOutputSchema>
