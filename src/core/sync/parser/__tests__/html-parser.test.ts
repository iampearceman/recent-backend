import { describe, expect, it } from 'vitest'
import { parseEntriesFromHtml } from '../html-parser'

describe('html-parser', () => {
	it('parses headings and returns entries', () => {
		const html = `<div class="entry"><h2>Release 1</h2><a href="/c/1">View</a><time datetime="2024-03-01"></time></div>
      <div class="entry"><h2>Release 2</h2><a href="/c/2">View</a><time datetime="2024-04-05"></time></div>`

		const out = parseEntriesFromHtml(html)
		expect(Array.isArray(out)).toBe(true)
		expect(out.length).toBe(2)
		expect(out[0].title).toBe('Release 1')
		expect(out[0].url).toBe('/c/1')
	})

	it('falls back to articles and returns [] for empty', () => {
		const aHtml = `<article><h1>Detail</h1><time datetime="2024-05-01"></time></article>`
		const out = parseEntriesFromHtml(aHtml)
		expect(out.length).toBe(1)

		const empty = parseEntriesFromHtml('')
		expect(empty).toEqual([])
	})
})
