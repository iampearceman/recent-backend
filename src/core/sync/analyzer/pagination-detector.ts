/**
 * Detect pagination patterns inside HTML. Pure, deterministic heuristics.
 */
export type PaginationDetection = {
	hasPagination: boolean
	type?: 'rel' | 'numeric' | 'prev-next' | 'unknown'
	pages?: number
}

export function detectPagination(html: string): PaginationDetection {
	if (!html || !html.trim()) return { hasPagination: false }

	// rel="next" or rel="prev" links
	if (/rel="next"|rel='next'|rel="prev"/i.test(html)) {
		return { hasPagination: true, type: 'rel' }
	}

	// Next / Previous anchor text
	if (/\b(next|previous|prev|older|newer|older posts)\b/i.test(html)) {
		return { hasPagination: true, type: 'prev-next' }
	}

	// Numeric page links: 1 2 3 or page=2
	const numericMatches = html.match(/(?:page=|page\/|>\s*\d+\s*<)/gi)
	if (numericMatches && numericMatches.length >= 2) {
		// crude estimate: count distinct numbers seen
		const nums = Array.from(
			new Set((html.match(/>\s*(\d+)\s*</g) || []).map((m) => m.replace(/[^0-9]/g, ''))),
		)
		const pages = nums.length || undefined
		return { hasPagination: true, type: 'numeric', pages }
	}

	return { hasPagination: false }
}

export default detectPagination
