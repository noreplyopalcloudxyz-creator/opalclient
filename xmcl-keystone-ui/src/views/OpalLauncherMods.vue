<template>
  <div class="opal-launcher-mods-page pa-4">
    <v-row>
      <v-col cols="12" class="mb-4">
        <v-card class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-h6">Opal Launcher Mods</div>
              <div class="text-caption">Manage the built-in Opal Launcher module list, enable/disable modules, and track install status.</div>
            </div>
            <v-chip color="primary" text-color="white" pill>
              {{ enabledCount }} enabled
            </v-chip>
          </div>

          <v-row class="mb-4" align="center">
            <v-col cols="12" md="5">
              <v-text-field
                v-model="query"
                label="Search popular mods"
                placeholder="e.g. mod menu"
                hide-details
                dense
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field
                v-model="version"
                label="Minecraft version"
                hide-details
                dense
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-select
                v-model="loader"
                :items="loaderItems"
                label="Loader"
                hide-details
                dense
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn color="primary" class="w-full" @click="searchMods" :loading="loading">
                Search
              </v-btn>
            </v-col>
          </v-row>

          <v-alert v-if="error" type="error" border="left" class="mb-4">
            {{ error }}
          </v-alert>

          <div v-if="results.length" class="opal-mod-list mb-4">
            <v-list shaped>
              <v-list-item v-for="mod in results" :key="mod.slug" class="opal-mod-item">
                <v-list-item-content>
                  <v-list-item-title>{{ mod.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ mod.summary }}</v-list-item-subtitle>
                  <div class="text-caption mt-2">Downloads: {{ mod.downloads }} · Loader: {{ mod.loader }}</div>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn
                    small
                    :color="isSelected(mod.slug) ? 'error' : 'primary'"
                    @click="toggleModule(mod.slug)"
                  >
                    {{ isSelected(mod.slug) ? 'Remove' : 'Add' }}
                  </v-btn>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </div>
          <div v-else class="text-caption text--secondary">
            Search popular Fabric or Forge mods and add them to your Opal Launcher module list.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="pa-4 mb-4">
          <div class="text-h6 mb-2">Selected Opal Launcher Mods</div>
          <div class="text-caption mb-4">The launcher will attempt to install enabled modules before Minecraft launch.</div>
          <v-list shaped>
            <template v-if="opalClientModules.value.length">
              <v-list-item v-for="slug in opalClientModules.value" :key="slug" class="opal-mod-item">
                <v-list-item-content>
                  <v-list-item-title>{{ slug }}</v-list-item-title>
                  <div class="text-caption mt-2">
                    Status:
                    <v-chip
                      :color="statusColor(statusFor(slug))"
                      text-color="white"
                      small
                    >
                      {{ statusFor(slug) }}
                    </v-chip>
                  </div>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn small color="error" @click="removeModule(slug)">Remove</v-btn>
                </v-list-item-action>
              </v-list-item>
            </template>
            <v-list-item v-else>
              <v-list-item-content>
                <v-list-item-title>No modules selected yet.</v-list-item-title>
                <v-list-item-subtitle>Add modules from search results or type a slug below.</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="pa-4">
          <div class="text-h6 mb-2">Manual module control</div>
          <v-row align="center">
            <v-col cols="12" md="8">
              <v-text-field
                v-model="manualSlug"
                label="Module slug"
                hide-details
                dense
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn color="primary" class="w-full" @click="addManualModule" :disabled="!manualSlug.trim()">
                Add slug
              </v-btn>
            </v-col>
          </v-row>
          <div class="text-caption mt-3">
            The launcher will install selected modules when Opal Client is enabled and a game is launched.
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 mb-4">
          <div class="text-h6 mb-2">Live status guide</div>
          <div class="text-caption mb-3">
            Status updates are set on the next launch and indicate whether the selected module was installed successfully.
          </div>
          <v-list dense>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>installed</v-list-item-title>
                <v-list-item-subtitle>Module was installed on the last launch.</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>pending</v-list-item-title>
                <v-list-item-subtitle>Module is selected but has not been installed yet.</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>failed</v-list-item-title>
                <v-list-item-subtitle>The last install attempt failed; retry on next launch.</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '@/composables/setting'

interface ModDiscoveryResult {
  slug: string
  title: string
  summary: string
  downloads: number
  loader: string
}

const { opalClientModules, opalClientModuleStatuses } = useSettings()
const router = useRouter()
const query = ref('mod menu')
const version = ref('1.19.4')
const loader = ref('fabric')
const results = ref<ModDiscoveryResult[]>([])
const error = ref('')
const loading = ref(false)
const manualSlug = ref('')

const loaderItems = [{ text: 'Fabric', value: 'fabric' }, { text: 'Forge', value: 'forge' }]

const enabledCount = computed(() => opalClientModules.value.length)

const isSelected = (slug: string) => opalClientModules.value.includes(slug)
const statusFor = (slug: string) => opalClientModuleStatuses.value[slug] ?? 'pending'

const addModule = (slug: string) => {
  const normalized = slug.trim()
  if (!normalized || opalClientModules.value.includes(normalized)) return
  opalClientModules.value = [...opalClientModules.value, normalized]
  opalClientModuleStatuses.value = {
    ...opalClientModuleStatuses.value,
    [normalized]: 'pending',
  }
}

const removeModule = (slug: string) => {
  opalClientModules.value = opalClientModules.value.filter((item) => item !== slug)
}

const toggleModule = (slug: string) => {
  if (isSelected(slug)) {
    removeModule(slug)
  } else {
    addModule(slug)
  }
}

const addManualModule = () => {
  addModule(manualSlug.value)
  manualSlug.value = ''
}

const statusColor = (status: string) => {
  switch (status) {
    case 'installed': return 'green'
    case 'failed': return 'red'
    default: return 'grey'
  }
}

const buildUrl = () => {
  const params = new URLSearchParams()
  params.set('game_versions', version.value)
  params.set('loaders', loader.value)
  params.set('limit', '12')
  params.set('sort', 'downloads')
  params.set('facets', JSON.stringify([['categories:mods']]))
  if (query.value.trim()) {
    params.set('query', query.value.trim())
  }
  return `https://api.modrinth.com/v2/search?${params.toString()}`
}

const searchMods = async () => {
  loading.value = true
  error.value = ''
  results.value = []
  try {
    const response = await fetch(buildUrl())
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }
    const json = await response.json()
    results.value = (json.hits ?? []).map((hit: any) => ({
      slug: hit.slug,
      title: hit.title,
      summary: hit.summary ?? hit.description ?? '',
      downloads: hit.downloads ?? 0,
      loader: hit.loaders?.[0] ?? loader.value,
    }))
    if (!results.value.length) {
      error.value = 'No mods found for the selected version and loader.'
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

searchMods()
</script>

<style scoped>
.opal-launcher-mods-page {
  max-width: 1200px;
  margin: 0 auto;
}
.opal-mod-list {
  max-height: 420px;
  overflow-y: auto;
}
.opal-mod-item {
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 0.5rem;
}
</style>
