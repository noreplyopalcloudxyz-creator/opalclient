import { writeFile } from 'fs/promises'
import { join } from 'path'

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`)
  return res.json()
}

export async function resolveProject(slugOrId: string) {
  const url = `https://api.modrinth.com/v2/project/${encodeURIComponent(slugOrId)}`
  return fetchJson(url)
}

export async function resolveLatestCompatibleVersion(projectId: string, gameVersion: string, loader = 'fabric') {
  const url = `https://api.modrinth.com/v2/project/${projectId}/version`
  const versions = await fetchJson(url)
  // filter compatible by gameVersion and loader
  const compatible = versions.filter((v: any) => (v.game_versions || []).includes(gameVersion) && (v.loaders || []).includes(loader))
  if (!compatible || compatible.length === 0) {
    // fallback: any version with loader
    const byLoader = versions.filter((v: any) => (v.loaders || []).includes(loader))
    if (byLoader.length === 0) throw new Error('No compatible versions found')
    compatible.push(...byLoader)
  }
  // pick the newest by date_published
  compatible.sort((a: any, b: any) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime())
  return compatible[0]
}

export async function downloadVersionFileToTemp(version: any, tempPathResolver: (fileName: string) => string) {
  // choose primary file
  const file = (version.files && version.files[0]) || null
  if (!file) throw new Error('No files found for version')
  const url = file.url
  const fileName = file.filename || url.split('/').pop()
  const target = tempPathResolver(fileName)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`)
  const buffer = Buffer.from(await resp.arrayBuffer())
  await writeFile(target, buffer)
  return target
}

export async function fetchAndPrepareMod(slugOrId: string, gameVersion: string, tempPathResolver: (fileName: string)=>string, loader = 'fabric') {
  const project = await resolveProject(slugOrId)
  const projectId = project.project_id || project.id || project.project_id
  const version = await resolveLatestCompatibleVersion(projectId, gameVersion, loader)
  const localPath = await downloadVersionFileToTemp(version, tempPathResolver)
  return { project, version, path: localPath }
}

export default { resolveProject, resolveLatestCompatibleVersion, downloadVersionFileToTemp, fetchAndPrepareMod }
