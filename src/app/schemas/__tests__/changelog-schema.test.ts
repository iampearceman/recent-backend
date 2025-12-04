import { describe, expect, it } from 'vitest'
import { ChangelogByToolInputSchema, ChangelogByToolOutputSchema } from '../changelog'

describe('ChangelogByToolInputSchema', () => {
	it('validates correct input', () => {
		const input = { toolId: 'tool-1', limit: 10 }
		expect(() => ChangelogByToolInputSchema.parse(input)).not.toThrow()
	})

	it('requires toolId', () => {
		expect(() => ChangelogByToolInputSchema.parse({ limit: 10 })).toThrow()
	})

	it('enforces limit bounds', () => {
		expect(() => ChangelogByToolInputSchema.parse({ toolId: 't', limit: 0 })).toThrow()
		expect(() => ChangelogByToolInputSchema.parse({ toolId: 't', limit: 101 })).toThrow()
	})

	it('accepts optional cursor', () => {
		expect(() =>
			ChangelogByToolInputSchema.parse({ toolId: 't', limit: 5, cursor: 'abc' }),
		).not.toThrow()
	})
})

describe('ChangelogByToolOutputSchema', () => {
	it('validates output with entries and nextCursor', () => {
		const output = { entries: [], nextCursor: 'abc' }
		expect(() => ChangelogByToolOutputSchema.parse(output)).not.toThrow()
	})

	it('validates output with entries only', () => {
		const output = { entries: [] }
		expect(() => ChangelogByToolOutputSchema.parse(output)).not.toThrow()
	})
})
