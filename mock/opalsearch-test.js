const { searchPopularMods } = require('../xmcl-runtime/opal/modrinth')

async function run() {
  const version = process.argv[2] || '1.19.4'
  const loader = process.argv[3] || 'fabric'
  try {
    const mods = await searchPopularMods(version, loader, 10)
    console.log(`Top mods for ${version} (${loader}):`)
    mods.forEach((m, i) => {
      console.log(`${i + 1}. ${m.title} (${m.slug || m.id}) - downloads: ${m.downloads || 'n/a'}`)
    })
  } catch (e) {
    console.error('Search failed:', e)
  }
}

run()
