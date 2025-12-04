import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { Context } from 'hono'
import type { AppRouter } from '../../app/routes/root-router'
import type { TRPCContext } from '../../app/trpc/context'

/**
 * Adapter to connect tRPC with Hono
 * This bridges the gap between Hono's request/response model and tRPC's
 */
export function createTRPCHandler({
	router,
	createContext,
	endpoint = '/trpc',
}: {
	router: AppRouter
	createContext: (opts: FetchCreateContextFnOptions) => TRPCContext
	endpoint?: string
}) {
	return async (c: Context) => {
		// Get the full request from Hono context
		const req = c.req.raw

		// Pass environment bindings to context creator
		const env = c.env

		// Use tRPC's fetch adapter to handle the request
		return fetchRequestHandler({
			endpoint,
			req,
			router,
			createContext: (opts) => {
				// Augment tRPC's context options with our environment bindings
				const augmentedOpts = {
					...opts,
					req: Object.assign(opts.req, { env }),
				}
				return createContext(augmentedOpts)
			},
			onError: ({ error, path }) => {
				console.error(`tRPC error on ${path}:`, error)
			},
		})
	}
}
