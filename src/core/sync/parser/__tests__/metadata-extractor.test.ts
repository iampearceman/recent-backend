import { describe, expect, it } from 'vitest'
import {
	extractDateFromHtml,
	extractMetaTags,
	extractTitle,
	extractVersionFromText,
} from '../metadata-extractor'

describe('metadata-extractor', () => {
	it('extracts title from meta og:title or title tags or h1', () => {
		expect(extractTitle(`<meta property="og:title" content="OG Title" />`)).toBe('OG Title')
		expect(extractTitle(`<title>Page title</title>`)).toBe('Page title')
		expect(extractTitle(`<h1>Heading</h1>`)).toBe('Heading')
	})

	it('extracts meta tags to key/value', () => {
		const html = `<meta name="description" content="desc"/><meta property="og:image" content="img.png"/>`
		const tags = extractMetaTags(html)
		expect(tags.description).toBe('desc')
		expect(tags['og:image']).toBe('img.png')
	})

	it('extracts date from time element and version from text', () => {
		expect(extractDateFromHtml(`<time datetime="2024-06-01">June</time>`)).toBe('2024-06-01')
		expect(extractVersionFromText('This release v1.2.3 contains changes')).toBe('v1.2.3')
		expect(extractVersionFromText('release 2.0')).toBe('2.0')
	})
})
