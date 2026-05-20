import { URLSearchParams } from 'url'

export interface ModrinthProject {
  id: string
  title: string
  description?: string
  latest_version?: string
  downloads?: number
  slug?: string
}

/**
 * Search Modrinth for popular mods matching a Minecraft version and loader.
 * This is a lightweight helper that calls Modrinth's /v2/search endpoint and
 * sorts by downloads.
 */
export async function searchPopularMods(gameVersion: string, loader: 'fabric' | 'forge' = 'fabric', limit = 20): Promise<ModrinthProject[]> {
  const base = 'https://api.modrinth.com/v2/search'
  const params = new URLSearchParams({
    game_versions: gameVersion,
    loaders: loader,
    limit: String(limit),
    offset: '0',
    sort: 'downloads'
  } as any)

  const url = `${base}?${params.toString()}`
  const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
  if (!resp.ok) {
    throw new Error(`Modrinth search failed: ${resp.status} ${resp.statusText}`)
  }
  const json = await resp.json()
  // Modrinth returns hits array
  const hits = json.hits ?? json.results ?? []
  return hits.map((h: any) => ({
    id: h.project_id || h.id || h.project_id,
    title: h.title || h.name || h.slug,
    description: h.description || h.short_description,
    latest_version: h.version_id || h.latest_version || undefined,
    downloads: h.downloads || h.total_downloads || undefined,
    slug: h.slug || undefined,
  }))
}

export default { searchPopularMods }
