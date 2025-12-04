import { describe, expect, it } from 'vitest'
import { detectPagination } from '../pagination-detector'

describe('pagination-detector', () => {
	it('detects rel=next pagination', () => {
		const html = `<link rel="next" href="/page/2" />`
		expect(detectPagination(html).hasPagination).toBe(true)
		expect(detectPagination(html).type).toBe('rel')
	})

	it('detects numeric pagination and estimates pages', () => {
		const html = `<div class="pagination"><a>1</a><a>2</a><a>3</a></div>`
		const res = detectPagination(html)
		expect(res.hasPagination).toBe(true)
		expect(res.type).toBe('numeric')
		expect(res.pages).toBeGreaterThanOrEqual(1)
	})

	it('detects prev/next text-based pagination', () => {
		const html = `<a>Older posts</a><a>Newer posts</a>`
		const res = detectPagination(html)
		expect(res.hasPagination).toBe(true)
		expect(res.type).toBe('prev-next')
	})
})
