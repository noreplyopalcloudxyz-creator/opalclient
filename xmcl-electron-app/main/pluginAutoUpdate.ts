import { ElectronUpdateOperation } from '@xmcl/runtime-api'
import { LauncherAppPlugin } from '@xmcl/runtime/app'
import { autoUpdater } from 'electron-updater'
import { kSettings } from '~/settings'

export const pluginAutoUpdate: LauncherAppPlugin = async (app) => {
  // E2E hook: skip the auto-updater entirely when running under Playwright.
  // The updater hits real network endpoints and would otherwise add nondeterminism.
  if (process.env.XMCL_E2E) {
    return
  }
  const state = await app.registry.get(kSettings)
  state.subscribe('autoInstallOnAppQuitSet', (value) => {
    autoUpdater.autoInstallOnAppQuit = value
  }).subscribe('allowPrereleaseSet', (value) => {
    autoUpdater.allowPrerelease = value
  }).subscribe('autoDownloadSet', (value) => {
    autoUpdater.autoDownload = value
  }).subscribe('config', (config) => {
    autoUpdater.autoInstallOnAppQuit = config.autoInstallOnAppQuit
    autoUpdater.allowPrerelease = config.allowPrerelease
    autoUpdater.autoDownload = config.autoDownload
  })

  autoUpdater.on('update-downloaded', async () => {
    try {
      const settings = await app.registry.get(kSettings)
      if (settings.updateInfo?.operation === ElectronUpdateOperation.AutoUpdater) {
        settings.updateStatusSet('ready')
      }
    } catch (e) {
      app.getLogger('AutoUpdater').warn('Failed to update state after download', e as Error)
    }
  })
}
