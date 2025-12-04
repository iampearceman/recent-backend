import { initTRPC, TRPCError } from '@trpc/server'
import type { Context } from './context'

/**
 * Initialize tRPC with context type
 * This is the foundation of all tRPC routers and procedures
 */
const t = initTRPC.context<Context>().create({
	errorFormatter({ shape }) {
		return shape
	},
})

/**
 * Base router builder
 * Use this to create new routers
 */
export const router = t.router

/**
 * Public (unauthenticated) procedure
 * No authentication required - anyone can call
 */
export const publicProcedure = t.procedure

/**
 * Protected (authenticated) procedure
 * Requires user to be authenticated via Clerk
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	// Check if user is authenticated
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		})
	}

	// User is authenticated, proceed with augmented context
	return next({
		ctx: {
			...ctx,
			// Override user type to be non-nullable in protected procedures
			user: ctx.user,
		},
	})
})

/**
 * Admin procedure
 * Requires user to be authenticated and have admin role
 * (Role checking will be implemented when we add Clerk integration)
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
	// Check if user is authenticated
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
		})
	}

	// TODO: Add role checking when Clerk integration is complete
	// For now, we'll just check if user exists
	// Example future implementation:
	// const hasAdminRole = ctx.user.roles?.includes('admin')
	// if (!hasAdminRole) {
	//   throw new TRPCError({
	//     code: 'FORBIDDEN',
	//     message: 'Admin access required',
	//   })
	// }

	return next({
		ctx: {
			...ctx,
			user: ctx.user,
		},
	})
})
