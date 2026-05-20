import { mkdir, copyFile } from 'fs/promises'
import { join, resolve, basename } from 'path'
import { fetchAndPrepareMod } from '../xmcl-runtime/opal/modInstaller'

async function main() {
  const modSlug = process.argv[2] || 'modmenu'
  const gameVersion = process.argv[3] || '1.19.4'
  const loader = process.argv[4] || 'fabric'

  const tempDir = resolve(process.cwd(), 'mock', 'opalinstall-temp')
  const mockInstance = resolve(process.cwd(), 'mock', 'opal-install-test-instance')
  const modsDir = join(mockInstance, 'mods')

  await mkdir(tempDir, { recursive: true })
  await mkdir(modsDir, { recursive: true })

  const tempPathResolver = (fileName: string) => join(tempDir, fileName)
  console.log(`Preparing mod '${modSlug}' for ${gameVersion}/${loader}...`)

  const { project, version, path } = await fetchAndPrepareMod(modSlug, gameVersion, tempPathResolver, loader)
  console.log('Resolved project:', project.slug || project.title || project.id)
  console.log('Chosen version:', version.name || version.id)
  console.log('Downloaded mod file to:', path)

  const destination = join(modsDir, basename(path))
  await copyFile(path, destination)
  console.log('Installed to mock instance mods folder:', destination)
}

main().catch((e) => {
  console.error('Install test failed:', e)
  process.exit(1)
})
