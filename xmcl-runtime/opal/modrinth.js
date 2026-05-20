const { URLSearchParams } = require('url')

async function searchPopularMods(gameVersion, loader = 'fabric', limit = 20) {
  const base = 'https://api.modrinth.com/v2/search'
  const params = new URLSearchParams({
    game_versions: gameVersion,
    loaders: loader,
    limit: String(limit),
    offset: '0',
    sort: 'downloads'
  })
  const url = `${base}?${params.toString()}`
  const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
  if (!resp.ok) {
    throw new Error(`Modrinth search failed: ${resp.status} ${resp.statusText}`)
  }
  const json = await resp.json()
  const hits = json.hits ?? json.results ?? []
  return hits.map(h => ({
    id: h.project_id || h.id || h.project_id,
    title: h.title || h.name || h.slug,
    description: h.description || h.short_description,
    latest_version: h.version_id || h.latest_version || undefined,
    downloads: h.downloads || h.total_downloads || undefined,
    slug: h.slug || undefined,
  }))
}

module.exports = { searchPopularMods }
