/**
 * Tool Schema Unit Tests
 * Tests Zod schemas for tools list input/output validation
 */

import { describe, expect, it } from 'vitest'
import {
	listToolsInputSchema,
	listToolsOutputSchema,
	toolSchema,
} from '../tool'

describe('listToolsInputSchema', () => {
	describe('accepts valid input', () => {
		it('should accept valid input with limit and search', () => {
			const input = { limit: 20, search: 'novu' }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.limit).toBe(20)
				expect(result.data.search).toBe('novu')
			}
		})

		it('should accept empty object (all optional)', () => {
			const input = {}
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(true)
		})

		it('should accept valid offset', () => {
			const input = { offset: 0 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.offset).toBe(0)
			}
		})

		it('should accept limit at max value (100)', () => {
			const input = { limit: 100 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(true)
		})
	})

	describe('rejects invalid input', () => {
		it('should reject negative limit', () => {
			const input = { limit: -1 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject zero limit (must be positive)', () => {
			const input = { limit: 0 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject limit exceeding max (100)', () => {
			const input = { limit: 101 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject empty search string', () => {
			const input = { search: '' }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject search string exceeding max length (100)', () => {
			const input = { search: 'a'.repeat(101) }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject negative offset', () => {
			const input = { offset: -1 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})

		it('should reject non-integer limit', () => {
			const input = { limit: 10.5 }
			const result = listToolsInputSchema.safeParse(input)

			expect(result.success).toBe(false)
		})
	})
})

describe('toolSchema', () => {
	describe('validates a standard Tool DTO', () => {
		it('should accept valid tool with all required fields', () => {
			const tool = {
				id: 'tool-123',
				name: 'Novu',
				slug: 'novu',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe('tool-123')
				expect(result.data.name).toBe('Novu')
				expect(result.data.slug).toBe('novu')
			}
		})

		it('should accept tool with optional fields', () => {
			const tool = {
				id: 'tool-456',
				name: 'Stripe',
				slug: 'stripe',
				description: 'Payment processing platform',
				logoUrl: 'https://stripe.com/logo.png',
				website: 'https://stripe.com',
				category: 'payments',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.description).toBe('Payment processing platform')
				expect(result.data.logoUrl).toBe('https://stripe.com/logo.png')
				expect(result.data.website).toBe('https://stripe.com')
				expect(result.data.category).toBe('payments')
			}
		})

		it('should accept tool with null optional fields', () => {
			const tool = {
				id: 'tool-789',
				name: 'Test Tool',
				slug: 'test-tool',
				description: null,
				logoUrl: null,
				website: null,
				category: null,
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(true)
		})
	})

	describe('rejects invalid DTO', () => {
		it('should reject tool missing id', () => {
			const tool = {
				name: 'Novu',
				slug: 'novu',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(false)
		})

		it('should reject tool missing name', () => {
			const tool = {
				id: 'tool-123',
				slug: 'novu',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(false)
		})

		it('should reject tool missing slug', () => {
			const tool = {
				id: 'tool-123',
				name: 'Novu',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(false)
		})

		it('should reject tool with invalid logoUrl', () => {
			const tool = {
				id: 'tool-123',
				name: 'Novu',
				slug: 'novu',
				logoUrl: 'not-a-url',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(false)
		})

		it('should reject tool with invalid website URL', () => {
			const tool = {
				id: 'tool-123',
				name: 'Novu',
				slug: 'novu',
				website: 'invalid-url',
			}
			const result = toolSchema.safeParse(tool)

			expect(result.success).toBe(false)
		})
	})
})

describe('listToolsOutputSchema', () => {
	it('should accept valid output with tools array', () => {
		const output = {
			tools: [
				{ id: 'tool-1', name: 'Tool One', slug: 'tool-one' },
				{ id: 'tool-2', name: 'Tool Two', slug: 'tool-two' },
			],
		}
		const result = listToolsOutputSchema.safeParse(output)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.tools).toHaveLength(2)
		}
	})

	it('should accept empty tools array', () => {
		const output = { tools: [] }
		const result = listToolsOutputSchema.safeParse(output)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.tools).toHaveLength(0)
		}
	})

	it('should reject output missing tools field', () => {
		const output = {}
		const result = listToolsOutputSchema.safeParse(output)

		expect(result.success).toBe(false)
	})

	it('should reject output with invalid tool in array', () => {
		const output = {
			tools: [{ id: 'tool-1' }], // Missing name and slug
		}
		const result = listToolsOutputSchema.safeParse(output)

		expect(result.success).toBe(false)
	})
})
