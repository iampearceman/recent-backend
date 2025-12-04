import { describe, expect, it } from 'vitest'
import { analyzePage } from '../page-analyzer'

describe('page-analyzer', () => {
	it('detects list pages from headings and links', () => {
		const html = `<h2>R1</h2><h2>R2</h2><a href="/1">1</a><a href="/2">2</a><a href="/3">3</a>`
		const res = analyzePage(html)
		expect(res.isList).toBe(true)
		expect(res.headingCount).toBeGreaterThanOrEqual(2)
		expect(res.linkCount).toBeGreaterThanOrEqual(3)
	})

	it('marks short detail pages as not list pages', () => {
		const html = `<article><h1>Detail</h1><p>content</p></article>`
		const res = analyzePage(html)
		expect(res.isList).toBe(false)
	})
})
