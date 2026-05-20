<template>
  <SettingCard>
    <template #title>
      <div class="flex items-center gap-2">
        <v-icon size="small">search</v-icon>
        <span>Opal Launcher Mod Discovery</span>
      </div>
    </template>

    <v-row class="mb-4" align="center" justify="space-between">
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

    <div class="mb-3" v-if="opalClientModules.value.length">
      <div class="font-medium mb-2">Enabled Opal Launcher Mods</div>
      <v-chip-group multiple>
        <v-chip
          v-for="slug in opalClientModules.value"
          :key="slug"
          closable
          @click:close="removeModule(slug)"
        >
          {{ slug }}
        </v-chip>
      </v-chip-group>
    </div>

    <v-alert v-if="error" type="error" border="left" class="mb-4">
      {{ error }}
    </v-alert>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-btn text color="primary" @click="router.push('/opal-launcher-mods')">
          Open full Opal Launcher Mods page
        </v-btn>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-chip color="primary" text-color="white" class="ma-0">
          {{ opalClientModules.value.length }} selected
        </v-chip>
      </v-col>
    </v-row>

    <v-list v-if="results.length" class="opal-mod-list">
      <v-list-item
        v-for="mod in results"
        :key="mod.slug"
        shaped
        class="opal-mod-item"
      >
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

    <div v-else class="text-caption text--secondary">
      Search for popular Fabric mods by Minecraft version and click "Add" to enable them under Opal Launcher Mods.
    </div>
  </SettingCard>
</template>

<script lang="ts" setup>
import SettingCard from '@/components/SettingCard.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from '../composables/setting'

interface ModDiscoveryResult {
  slug: string
  title: string
  summary: string
  downloads: number
  loader: string
}

const { opalClientModules } = useSettings()
const query = ref('mod menu')
const version = ref('1.19.4')
const loader = ref('fabric')
const results = ref<ModDiscoveryResult[]>([])
const error = ref('')
const loading = ref(false)

const loaderItems = [{ text: 'Fabric', value: 'fabric' }, { text: 'Forge', value: 'forge' }]
const router = useRouter()

const isSelected = (slug: string) => opalClientModules.value.includes(slug)

const addModule = (slug: string) => {
  if (!opalClientModules.value.includes(slug)) {
    opalClientModules.value = [...opalClientModules.value, slug]
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

// initial load
searchMods()
</script>

<style scoped>
.opal-mod-list {
  max-height: 450px;
  overflow-y: auto;
}

.opal-mod-item {
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
