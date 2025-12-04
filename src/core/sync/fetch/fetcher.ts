/**
 * Fetcher is a pure IO interface used by higher-level sync code.
 * Implementations that depend on platform (Cloudflare, Node) should live
 * under infra/ and provide adapters implementing this interface.
 */
export interface Fetcher {
	fetchHtml(url: string): Promise<string>
	fetchJson<T = unknown>(url: string): Promise<T>
}

export default Fetcher
