import { describe, expect, it } from 'vitest'

// Example DB row for mapping
const dbRow = {
	id: 'entry1',
	tool_id: 'tool1',
	published_at: new Date('2023-01-01T00:00:00Z'),
	version: '1.0.0',
	title: 'Initial Release',
	external_url: 'https://example.com/changelog/1',
	content: 'First release of the tool.',
}

function mapChangelogRowToDomain(row: any) {
	return {
		id: row.id,
		toolId: row.tool_id,
		date: row.published_at,
		version: row.version ?? undefined,
		title: row.title ?? undefined,
		url: row.external_url ?? undefined,
		content: row.content ?? undefined,
	}
}

describe('mapChangelogRowToDomain', () => {
	it('maps a DB row to a ChangelogEntry domain object', () => {
		const entry = mapChangelogRowToDomain(dbRow)
		expect(entry).toEqual({
			id: 'entry1',
			toolId: 'tool1',
			date: new Date('2023-01-01T00:00:00Z'),
			version: '1.0.0',
			title: 'Initial Release',
			url: 'https://example.com/changelog/1',
			content: 'First release of the tool.',
		})
	})

	it('handles null/undefined fields', () => {
		const row = { ...dbRow, version: null, title: null, external_url: null, content: null }
		const entry = mapChangelogRowToDomain(row)
		expect(entry.version).toBeUndefined()
		expect(entry.title).toBeUndefined()
		expect(entry.url).toBeUndefined()
		expect(entry.content).toBeUndefined()
	})
})
