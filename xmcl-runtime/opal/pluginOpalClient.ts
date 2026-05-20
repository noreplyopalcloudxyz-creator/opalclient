import { InstanceModsServiceKey, LaunchException } from '@xmcl/runtime-api'
import { ensureDir, writeFile, stat, readFile, appendFile } from 'fs-extra'
import { dirname, join } from 'path'
import { LaunchService } from '~/launch'
import { LauncherAppPlugin, kTempDataPath } from '~/app'
import { kSettings } from '~/settings'
import { fetchAndPrepareMod } from './modInstaller'

const OPAL_CLIENT_JAR_NAME = 'opalclient.jar'
const OPAL_CLIENT_RELEASE_URL = `https://github.com/noreplyopalcloudxyz-creator/opalclient/releases/latest/download/${OPAL_CLIENT_JAR_NAME}`
const OPAL_CLIENT_RELEASE_API = 'https://api.github.com/repos/noreplyopalcloudxyz-creator/opalclient/releases/latest'
const OPAL_CLIENT_CONFIG_FILE = 'opalclient.json'
const OPAL_CLIENT_VERSION_META = 'opalclient.version.json'

export const pluginOpalClient: LauncherAppPlugin = async (app) => {
  const tempPath = await app.registry.get(kTempDataPath)
  const settings = await app.registry.get(kSettings)
  const instanceMods = await app.registry.get(InstanceModsServiceKey)
  const launchService = await app.registry.get(LaunchService)

  const tempLog = tempPath('opalclient.log')
  const log = async (...args: any[]) => {
    const text = `[opal ${new Date().toISOString()}] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
    try { await appendFile(tempLog, text + '\n') } catch (e) { /* ignore */ }
    console.log(...args)
  }

  const resolveOpalClientJar = async () => {
    const target = tempPath(OPAL_CLIENT_JAR_NAME)
    await ensureDir(dirname(target))
    const existing = await stat(target).catch(() => undefined)

    // Small logger that also writes to temp log for easier debugging
    const tempLog = tempPath('opalclient.log')
    const log = async (...args: any[]) => {
      const text = `[opal ${new Date().toISOString()}] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
      try { await appendFile(tempLog, text + '\n') } catch(e) { /* ignore */ }
      console.log(...args)
    }

    // Try to check latest release tag from GitHub
    let remoteTag: string | undefined
    try {
      const apiResp = await app.fetch(OPAL_CLIENT_RELEASE_API, { headers: { Accept: 'application/vnd.github.v3+json' } })
      if (apiResp.ok) {
        const js = await apiResp.json()
        remoteTag = js.tag_name || js.name
      }
    } catch (e) {
      await log('[opal] failed to query release API:', e)
    }

    const metaPath = tempPath(OPAL_CLIENT_VERSION_META)
    const existingMeta = await stat(metaPath).catch(() => undefined)
    let localTag: string | undefined
    if (existingMeta?.isFile()) {
      try {
        const content = await readFile(metaPath, 'utf-8')
        localTag = JSON.parse(content).tag
      } catch (e) {
        await log('[opal] failed to read local version meta:', e)
      }
    }

    // If jar exists and tags match, reuse
    if (existing?.isFile() && remoteTag && localTag === remoteTag) {
      await log('[opal] local opal client is up-to-date', localTag)
      return target
    }

    // Download from release
    try {
      await log('[opal] downloading opal client from', OPAL_CLIENT_RELEASE_URL)
      const resp = await app.fetch(OPAL_CLIENT_RELEASE_URL)
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }
      const buffer = Buffer.from(await resp.arrayBuffer())
      await writeFile(target, buffer)
      // update meta
      await writeFile(metaPath, JSON.stringify({ tag: remoteTag ?? null, downloadedAt: Date.now() }, null, 2))
      await log('[opal] opal client downloaded to', target)
      return target
    } catch (e) {
      await log('[opal] download failed:', e)
      // Fallback: if existing file present, use it
      if (existing?.isFile()) {
        await log('[opal] using existing local jar at', target)
        return target
      }
      // Fallback 2: copy from repo mock folder for testing
      try {
        const mockPath = join(process.cwd(), 'mock', 'opalclient', OPAL_CLIENT_JAR_NAME)
        const mockStat = await stat(mockPath).catch(() => undefined)
        if (mockStat?.isFile()) {
          const buf = Buffer.from(await readFile(mockPath))
          await writeFile(target, buf)
          await log('[opal] copied mock opal client from', mockPath)
          return target
        }
      } catch (ee) {
        await log('[opal] mock fallback failed:', ee)
      }

      throw new LaunchException(
        { type: 'launchOpalClientDownloadFailed', url: OPAL_CLIENT_RELEASE_URL },
        `Failed to download Opal Client from ${OPAL_CLIENT_RELEASE_URL}`,
      )
    }
  }

  launchService.registerMiddleware({
    name: 'opal-client-injection',
    async onBeforeLaunch(input, payload) {
      if (payload.side !== 'client') {
        return
      }
      if (!settings.opalClientEnabled) {
        return
      }

      // Detect mods folder presence to give loader hint
      try {
        const modsDir = join(input.gameDirectory, 'mods')
        const modsStat = await stat(modsDir).catch(() => undefined)
        if (!modsStat?.isDirectory()) {
          await log('[opal] no mods directory found in instance; instance may not be modded:', input.gameDirectory)
        }
      } catch (e) {
        // ignore
      }

      const jarPath = await resolveOpalClientJar()
      try {
        await instanceMods.install({ files: [jarPath], path: input.gameDirectory })
        await log('[opal] installed opal client jar into instance mods', { jar: jarPath, instance: input.gameDirectory })
      } catch (e) {
        await log('[opal] failed to install opal client jar:', e)
        throw new LaunchException({ type: 'launchOpalClientInstallFailed', error: String(e) }, 'Failed to install Opal Client into instance')
      }

      const gameVersion = (payload.version as any).minecraftVersion || (payload.version as any).id || '1.19.4'
      const installedModules: string[] = []
      const moduleStatuses: Record<string, 'pending' | 'installed' | 'failed'> = {
        ...(settings.opalClientModuleStatuses ?? {}),
      }
      for (const moduleSlug of settings.opalClientModules || []) {
        if (!moduleSlug || typeof moduleSlug !== 'string') {
          continue
        }
        const normalizedSlug = moduleSlug.trim()
        moduleStatuses[normalizedSlug] = 'pending'
        try {
          const moduleFile = await fetchAndPrepareMod(normalizedSlug, gameVersion, tempPath)
          await instanceMods.install({ files: [moduleFile.path], path: input.gameDirectory })
          installedModules.push(normalizedSlug)
          moduleStatuses[normalizedSlug] = 'installed'
          await log('[opal] installed launcher module', normalizedSlug, moduleFile.path)
        } catch (e) {
          moduleStatuses[normalizedSlug] = 'failed'
          await log('[opal] failed to install launcher module', normalizedSlug, e)
        }
      }

      if (typeof settings.opalClientModuleStatusesSet === 'function') {
        settings.opalClientModuleStatusesSet(moduleStatuses)
      }

      const configDir = join(input.gameDirectory, 'config')
      await ensureDir(configDir)
      const configPath = join(configDir, OPAL_CLIENT_CONFIG_FILE)
      await writeFile(configPath, JSON.stringify({
        enabled: true,
        keybind: settings.opalClientKeybind,
        modules: settings.opalClientModules,
        moduleStatuses: moduleStatuses,
        hudLayout: settings.opalClientHudLayout,
        showOverlay: settings.opalClientShowOverlay,
        installedModules,
      }, null, 2))
      await log('[opal] wrote opal client config to', configPath)

      const metaPath = join(input.gameDirectory, 'opal-launcher-mods.json')
      await writeFile(metaPath, JSON.stringify({
        installed: installedModules,
        updatedAt: new Date().toISOString(),
      }, null, 2))
      await log('[opal] wrote launcher mods metadata to', metaPath)
    },
  })
}
