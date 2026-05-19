import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BaseService } from './BaseService'
import { ElectronUpdateOperation, ReleaseInfo } from '@xmcl/runtime-api'

describe('BaseService update checker', () => {
  let app: any
  let tasks: any
  let settings: any

  beforeEach(() => {
    settings = {
      updateInfo: null,
      updateStatus: 'none',
      autoDownload: false,
      autoInstallOnAppQuit: false,
      allowPrerelease: false,
      updateInfoSet(info: ReleaseInfo) {
        this.updateInfo = info
      },
      updateStatusSet(status: 'ready' | 'none' | 'pending') {
        this.updateStatus = status
      },
    }

    app = {
      getLogger: vi.fn(() => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn() })),
      registry: {
        get: vi.fn(async () => settings),
      },
      updater: {
        checkUpdateTask: vi.fn(async () => {
          throw new Error('checkUpdateTask not stubbed')
        }),
      },
      version: '0.1.0',
      platform: { os: 'windows', arch: 'x64' },
      env: 'appx',
      appDataPath: '/tmp',
      systemLocale: 'en',
      mutex: {
        of: () => ({ acquire: async () => () => {} }),
      },
    }

    tasks = {
      create: vi.fn(() => ({ wrap: async (p: Promise<any>) => p })),
    }
  })

  it('downloads a forced update even when autoDownload is disabled', async () => {
    const updateInfo: ReleaseInfo = {
      name: 'v1.0.1',
      body: '',
      date: '2026-05-19',
      files: [],
      newUpdate: true,
      operation: ElectronUpdateOperation.Asar,
      force: true,
    }

    const service = new BaseService(app, tasks) as any
    service.downloadUpdate = vi.fn(async () => undefined)
    app.updater.checkUpdateTask = vi.fn(async () => updateInfo)

    await service.checkUpdate()

    expect(settings.updateStatus).toBe('pending')
    expect(service.downloadUpdate).toHaveBeenCalledOnce()
  })

  it('does not download when a normal update is pending and autoDownload is disabled', async () => {
    const updateInfo: ReleaseInfo = {
      name: 'v1.0.1',
      body: '',
      date: '2026-05-19',
      files: [],
      newUpdate: true,
      operation: ElectronUpdateOperation.Asar,
      force: false,
    }

    const service = new BaseService(app, tasks) as any
    service.downloadUpdate = vi.fn(async () => undefined)
    app.updater.checkUpdateTask = vi.fn(async () => updateInfo)

    await service.checkUpdate()

    expect(settings.updateStatus).toBe('pending')
    expect(service.downloadUpdate).not.toHaveBeenCalled()
  })
})
