/* global opalUpdate */
const title = document.getElementById('title')
const subtitle = document.getElementById('subtitle')
const changelog = document.getElementById('changelog')
const progress = document.getElementById('progressBar')
const retry = document.getElementById('retry')
const install = document.getElementById('install')
const closeBtn = document.getElementById('closeBtn')
const errorBox = document.getElementById('errorBox')
const channelEl = document.getElementById('channel')
const currentVersionEl = document.getElementById('currentVersion')

function renderPayload(p) {
  if (!p) return
  channelEl.textContent = p.channel || 'stable'
  currentVersionEl.textContent = p.currentVersion || 'unknown'

  if (p.networkError) {
    title.textContent = 'Update check failed'
    subtitle.textContent = 'Network error while checking updates.'
    errorBox.style.display = 'block'
    errorBox.textContent = p.error || 'Network unreachable'
    retry.style.display = 'inline-block'
    install.style.display = 'none'
    return
  }

  if (p.error) {
    title.textContent = 'Update check failed'
    subtitle.textContent = 'Error while checking updates.'
    errorBox.style.display = 'block'
    errorBox.textContent = p.error
    retry.style.display = p.retryPossible ? 'inline-block' : 'none'
    install.style.display = 'none'
    return
  }

  errorBox.style.display = 'none'
  const isRequired = !!p.required
  title.textContent = `Update available — v${p.version}`
  subtitle.textContent = isRequired ? 'Required update' : 'Optional update'
  changelog.innerHTML = p.changelog && p.changelog.length ? `<ul>${p.changelog.map(i => `<li>${i}</li>`).join('')}</ul>` : (p.body || 'No changelog available')
  install.style.display = 'inline-block'
  retry.style.display = 'none'
  closeBtn.textContent = isRequired ? 'Quit' : 'Close'
  install.textContent = `Download & Install`
  install.disabled = false
  install.onclick = async () => {
    install.disabled = true
    subtitle.textContent = 'Downloading...'
    const url = p.url
    const result = await opalUpdate.download(url)
    if (!result.ok) {
      subtitle.textContent = 'Download failed'
      errorBox.style.display = 'block'
      errorBox.textContent = result.err || 'Failed to download'
      install.disabled = false
    } else {
      subtitle.textContent = 'Installer launched. Closing launcher.'
    }
  }
}

opalUpdate.onPayload((p) => renderPayload(p))
opalUpdate.onProgress((s) => {
  const pct = s.pct ?? (s.total ? Math.round((s.received / s.total) * 100) : null)
  progress.style.width = (pct || 0) + '%'
  subtitle.textContent = pct ? `Downloading... ${pct}%` : 'Downloading...'
})

retry.onclick = async () => {
  retry.disabled = true
  const r = await opalUpdate.checkAgain()
  retry.disabled = false
  if (!r.ok) {
    errorBox.style.display = 'block'
    errorBox.textContent = r.err || 'Retry failed'
  }
}

closeBtn.onclick = () => {
  opalUpdate.close()
}
