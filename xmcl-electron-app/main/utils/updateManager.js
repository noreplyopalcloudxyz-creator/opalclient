const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const axios = require('axios')
const { gt, valid } = require('./semver')

const DEFAULT_UPDATE_URL = process.env.UPDATE_URL || 'https://opal-updates.vercel.app'
const DEFAULT_CHANNEL = process.env.UPDATE_CHANNEL || 'stable'
const STATE_FILE = path.join(app.getPath('userData'), 'update-state.json')

function getLogger(appInstance) {
  try {
    return appInstance.getLogger ? appInstance.getLogger('UpdateManager') : console
  } catch {
    return console
  }
}

class UpdateManager {
  constructor(appInstance, options = {}) {
    this.app = appInstance
    this.updateUrl = options.updateUrl || DEFAULT_UPDATE_URL
    this.channel = options.channel || DEFAULT_CHANNEL
    this.logger = getLogger(appInstance)
    this.window = null
    this.currentPayload = null
    this.state = { lastPromptedVersion: null }
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf8')
      this.state = JSON.parse(raw)
    } catch {}
    this.checking = false
    this._setupIpcHandlers()
  }

  _setupIpcHandlers() {
    ipcMain.handle('update-check-again', async () => {
      try {
        const r = await this.checkForUpdate({ silent: false })
        return { ok: !!r }
      } catch (e) {
        return { ok: false, err: String(e) }
      }
    })

    ipcMain.handle('update-download', async (event, url) => {
      try {
        const dest = await this._downloadToDownloads(url)
        this.logger.log('Downloaded to', dest)
        await shell.openPath(dest)
        setTimeout(() => this.app.quit(), 500)
        return { ok: true }
      } catch (e) {
        this.logger.warn('Download failed', e)
        return { ok: false, err: String(e) }
      }
    })

    ipcMain.handle('update-close', () => {
      if (this.currentPayload) {
        try {
          this.state.lastPromptedVersion = this.currentPayload.version || this.state.lastPromptedVersion
          this._saveState()
        } catch {}
      }
      if (this.window) {
        this.window.close()
      }
      if (this.currentPayload?.required) {
        this.app.quit()
      }
    })
  }

  async startBackgroundCheck() {
    // silent background check shortly after startup
    setTimeout(() => this.checkForUpdate({ silent: true }).catch((e) => this.logger.warn(e)), 2000)
  }

  async checkForUpdate({ silent = false } = {}) {
    if (this.checking) return
    this.checking = true
    try {
      const url = `${this.updateUrl.replace(/\/$/, '')}/${this.channel}/version.json`
      this.logger.log(`Checking update from ${url}`)
      const res = await axios.get(url, { timeout: 10000 })
      const remote = res.data
      if (!remote || !remote.version) throw new Error('Invalid version.json')

      const current = this.app.packageJson?.version || this.app.version || require(path.join(__dirname, '..', '..', 'package.json')).version
      this.logger.log(`Current version ${current}, remote ${remote.version}`)
      if (!valid(remote.version) || !valid(current)) {
        this.logger.warn('Invalid semantic versions, skip')
        return null
      }

      if (gt(remote.version, current)) {
        remote.currentVersion = current
        remote.channel = this.channel
        remote.platform = os.platform()

        // prevent loop: if we already prompted this version and it's not required, skip
        if (this.state.lastPromptedVersion === remote.version && !remote.required) {
          this.logger.log('Already prompted this optional version, skip')
          return null
        }
        if (silent && !remote.required) {
          // do not interrupt user for optional update in silent mode
          this.state.lastPromptedVersion = remote.version
          this._saveState()
          return remote
        }
        await this.showUpdateWindow(remote)
      } else {
        this.logger.log('No update available')
      }
      return remote
    } catch (e) {
      this.logger.warn('Update check failed', e.message || e)
      if (!silent) {
        await this.showUpdateWindow({
          error: e.message || String(e),
          networkError: true,
          retryPossible: true,
          currentVersion: this.app.packageJson?.version || this.app.version || require(path.join(__dirname, '..', '..', 'package.json')).version,
          channel: this.channel,
          platform: os.platform(),
        })
      }
      return null
    } finally {
      this.checking = false
    }
  }

  async showUpdateWindow(payload) {
    if (this.window) return
    this.currentPayload = payload
    this.window = new BrowserWindow({
      width: 640,
      height: 420,
      resizable: false,
      modal: false,
      show: false,
      backgroundColor: '#071228',
      webPreferences: {
        preload: path.join(__dirname, '..', 'assets', 'updatePreload.js'),
        contextIsolation: true,
      },
    })

    this.window.loadFile(path.join(__dirname, '..', 'assets', 'update.html'))
    this.window.once('ready-to-show', () => {
      this.window.show()
      this.window.webContents.send('update-payload', payload)
    })

    this.window.on('closed', () => {
      this.window = null
      this.currentPayload = null
    })
  }

  async _downloadToDownloads(url) {
    if (!url) throw new Error('No url')
    const fileName = path.basename(new URL(url).pathname)
    const dest = path.join(app.getPath('downloads'), fileName)
    const writer = fs.createWriteStream(dest)
    const res = await axios({ method: 'get', url, responseType: 'stream', timeout: 0 })
    const total = parseInt(res.headers['content-length'] || '0', 10)
    let received = 0
    res.data.on('data', (chunk) => {
      received += chunk.length
      const pct = total ? Math.round((received / total) * 100) : null
      if (this.window) this.window.webContents.send('download-progress', { received, total, pct })
    })
    await new Promise((resolve, reject) => {
      res.data.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
      res.data.on('error', reject)
    })
    return dest
  }

  _saveState() {
    try {
      fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state))
    } catch (e) {
      this.logger.warn('Fail to save update state', e)
    }
  }
}

module.exports = { UpdateManager }
