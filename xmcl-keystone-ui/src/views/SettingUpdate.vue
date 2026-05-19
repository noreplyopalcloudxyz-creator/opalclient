<template>
  <SettingCard
    v-if="!disableUpdate"
    :title="t('setting.update')"
    icon="rocket_launch"
  >
    <SettingItem>
      <template #preaction>
        <v-btn
          data-testid="settings-check-update"
          v-shared-tooltip="() => t('setting.checkUpdate')"
          icon
          variant="text"
          :loading="checkingUpdate"
          @click="checkUpdate"
        >
          <v-icon>refresh</v-icon>
        </v-btn>
      </template>
      
      <template #title>
        {{ t("setting.latestVersion") }}
      </template>

      <template #subtitle>
        <span :class="{'success--text': !hasNewUpdate, 'primary--text': hasNewUpdate}">
          v{{ version }}
          {{ hasNewUpdate && updateInfo ? `-> ${updateInfo.name}` : "" }}
        </span>
        <v-chip
          v-if="hasNewUpdate"
          size="x-small"
          color="primary"
          class="ml-2"
          label
        >
          NEW
        </v-chip>
        <v-chip
          v-if="forceUpdate"
          size="x-small"
          color="error"
          class="ml-2"
          label
        >
          REQUIRED
        </v-chip>
      </template>
      
      <template #action>
        <v-btn
          :loading="checkingUpdate || installing"
          :disabled="updateStatus === 'none'"
          :color="updateStatus !== 'none' ? 'primary' : ''"
          :outlined="updateStatus === 'none'"
          @click="showUpdateInfo()"
         size="small">
          <v-icon start size="small" v-if="updateStatus !== 'none'">system_update</v-icon>
          {{
            updateStatus === "none"
              ? t("launcherUpdate.alreadyLatest")
              : updateStatus === "pending"
                ? t("launcherUpdate.updateToThisVersion")
                : t("launcherUpdate.installAndQuit")
          }}
        </v-btn>
      </template>
    </SettingItem>

    <SettingItem
      :title="t('setting.autoDownload')"
      :description="t('setting.autoDownloadDescription')"
    >
      <template #action>
        <v-switch
          v-model="autoDownload"
          inset
          density="compact"
        />
      </template>
    </SettingItem>

    <v-alert
      v-if="hasNewUpdate"
      :type="forceUpdate ? 'error' : 'info'"
      variant="tonal"
      class="mb-4"
    >
      <div>
        {{ forceUpdate ? t('setting.requiredUpdateNotice') : `A launcher update ${updateInfo?.name} is available.` }}
      </div>
      <div v-if="forceUpdate && updateInfo?.forceMessage" class="mt-2">
        {{ updateInfo.forceMessage }}
      </div>
    </v-alert>

    <SettingItem
      :title="t('setting.autoInstallOnAppQuit')"
      :description="t('setting.autoInstallOnAppQuitDescription')"
    >
      <template #action>
        <v-switch
          v-model="autoInstallOnAppQuit"
          inset
          density="compact"
        />
      </template>
    </SettingItem>

    <SettingItem
      :title="t('setting.allowPrerelease')"
      :description="t('setting.allowPrereleaseDescription')"
    >
      <template #action>
        <v-switch
          v-model="allowPrerelease"
          inset
          density="compact"
        />
      </template>
    </SettingItem>
  </SettingCard>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { vSharedTooltip } from '@/directives/sharedTooltip'
import { injection } from '@/util/inject'
import { useDialog } from '../composables/dialog'
import { kSettingsState, kUpdateSettings } from '../composables/setting'
import SettingCard from '@/components/SettingCard.vue'
import SettingItem from '@/components/SettingItem.vue'

const { show: showUpdateInfo } = useDialog('update-info')
const disableUpdate = false // state.env !== 'raw'
const { state } = injection(kSettingsState)
const { updateInfo, installing, updateStatus, checkUpdate, checkingUpdate, version } = injection(kUpdateSettings)
const hasNewUpdate = computed(() => updateInfo.value?.newUpdate ?? false)
const forceUpdate = computed(() => updateInfo.value?.force ?? false)
const autoDownload = computed({
  get: () => state.value?.autoDownload ?? false,
  set: (value: boolean) => state.value?.autoDownloadSet(value),
})
const autoInstallOnAppQuit = computed({
  get: () => state.value?.autoInstallOnAppQuit ?? false,
  set: (value: boolean) => state.value?.autoInstallOnAppQuitSet(value),
})
const allowPrerelease = computed({
  get: () => state.value?.allowPrerelease ?? false,
  set: (value: boolean) => state.value?.allowPrereleaseSet(value),
})
const { t } = useI18n()

</script>

<style scoped>
:deep(.transparent-list) {
  background: transparent !important;
}

.v-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.v-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
