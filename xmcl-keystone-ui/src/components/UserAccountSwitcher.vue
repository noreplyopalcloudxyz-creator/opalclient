<template>
  <div
    class="user-account-switcher"
    :class="{ 'user-account-switcher--comfortable': comfortable }"
  >
    <v-menu
      v-model="userMenuOpen"
      :close-on-content-click="false"
      offset-y
      :min-width="comfortable ? 340 : 320"
    >
      <template #activator="{ props: menuProps }">
        <div
          v-bind="hasUsers ? menuProps : {}"
          class="user-account-switcher__identity flex items-center gap-3 cursor-pointer rounded-2xl px-3 py-2.5 border transition-all"
          data-testid="me-user-switcher"
          @click="onIdentityClick"
        >
          <div class="relative flex-shrink-0 group/avatar">
            <PlayerAvatar
              class="overflow-hidden rounded-full border border-white/10"
              :src="gameProfile?.textures?.SKIN?.url"
              :dimension="avatarDimension"
            />
            <div
              v-if="showRefresh && hasUsers"
              class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
              @click.stop="onRefreshUser"
            >
              <v-icon size="18" color="white" :class="{ 'animate-spin': refreshingUser }">refresh</v-icon>
            </div>
          </div>
          <div class="flex flex-col flex-grow min-w-0 text-left">
            <span class="font-bold truncate text-white" :class="comfortable ? 'text-base' : 'text-sm'">
              {{ gameProfile?.name || t('login.login') }}
            </span>
            <span class="truncate flex items-center gap-1.5 mt-0.5" :class="[comfortable ? 'text-sm' : 'text-xs', currentUserExpired ? 'text-error' : 'opacity-60']">
              <span v-if="currentUserExpired" class="text-error font-medium">{{ t('user.tokenExpired') }}</span>
              <template v-else>
                <!-- Badge on Identity bar -->
                <span
                  v-if="userProfile.authority === AUTHORITY_MICROSOFT"
                  class="badge-indicator badge-indicator--premium d-inline-flex align-center gap-1 text-indigo-300 font-bold"
                >
                  <v-icon size="10" color="indigo-lighten-2">verified</v-icon>
                  {{ authorityLabel }}
                </span>
                <span
                  v-else
                  class="badge-indicator badge-indicator--offline d-inline-flex align-center gap-1 text-amber-400 font-semibold"
                >
                  <v-icon size="10" color="amber-darken-1">wifi_off</v-icon>
                  {{ authorityLabel }}
                </span>
              </template>
            </span>
          </div>
          <v-btn
            v-slot:loader
            v-if="showInlineDelete && hasUsers"
            data-testid="accounts-delete"
            icon
            variant="text"
            size="small"
            color="error"
            class="flex-shrink-0"
            :title="t('userAccount.removeTitle')"
            :loading="removingUser"
            @click.stop="openRemoveAccountDialog"
          >
            <v-icon size="18">delete</v-icon>
          </v-btn>
          <v-icon size="18" class="flex-shrink-0 opacity-60">
            {{ hasUsers ? (userMenuOpen ? 'expand_less' : 'expand_more') : 'login' }}
          </v-icon>
        </div>
      </template>

      <!-- Premium Modrinth/Feather Inspired Account Manager List -->
      <v-card class="rounded-xl overflow-hidden account-switcher-menu border border-white/10" width="340">
        <div class="px-4 py-3 d-flex align-center justify-between border-b" style="border-color: rgba(var(--v-theme-on-surface), 0.08)">
          <span class="text-sm font-bold tracking-wide text-white opacity-90">Account Manager</span>
          <v-chip v-if="users.length" size="x-small" color="primary" variant="flat" class="font-bold">
            {{ users.length }}
          </v-chip>
        </div>

        <div class="max-h-[320px] overflow-y-auto px-2 py-2 d-flex flex-col gap-2">
          <div
            v-for="u of users"
            :key="u.id"
            class="account-card p-3 rounded-xl border d-flex align-center gap-3 transition-all relative cursor-pointer"
            :class="{
              'account-card--active': u.id === userProfile.id,
              'border-primary/50 bg-primary/5 shadow-[0_0_12px_rgba(var(--v-theme-primary),0.08)]': u.id === userProfile.id,
              'border-white/5 bg-white/2': u.id !== userProfile.id
            }"
            @click="onSwitchUser(u.id)"
          >
            <!-- Avatar with glow colored by status -->
            <div class="relative flex-shrink-0">
              <PlayerAvatar
                class="overflow-hidden rounded-full border-2"
                :class="u.authority === AUTHORITY_MICROSOFT ? 'border-indigo-500/50' : 'border-amber-600/50'"
                :src="u.profiles[u.selectedProfile]?.textures?.SKIN?.url"
                :dimension="38"
              />
              <div
                v-if="u.id === userProfile.id"
                class="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-4 h-4 border border-slate-900 flex items-center justify-center"
              >
                <v-icon size="8" color="white">check</v-icon>
              </div>
            </div>

            <!-- Profile Info & Badges -->
            <div class="flex-grow min-w-0 d-flex flex-col gap-0.5 text-left">
              <span class="font-bold text-sm truncate text-white">
                {{ u.profiles[u.selectedProfile]?.name || u.username }}
              </span>
              <div class="d-flex align-center gap-1.5 flex-wrap">
                <!-- Premium Badge -->
                <span
                  v-if="u.authority === AUTHORITY_MICROSOFT"
                  class="badge-pill px-1.5 py-0.5 rounded text-[10px] font-bold d-inline-flex align-center gap-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                >
                  <svg class="w-2.5 h-2.5" viewBox="0 0 21 21" fill="currentColor">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Premium
                </span>
                <!-- Offline Badge -->
                <span
                  v-else
                  class="badge-pill px-1.5 py-0.5 rounded text-[10px] font-bold d-inline-flex align-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/25"
                >
                  <v-icon size="10" color="amber">wifi_off</v-icon>
                  Offline Account
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="d-flex align-center gap-1 flex-shrink-0" @click.stop>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                class="remove-account-btn opacity-60 hover:opacity-100 transition-opacity"
                :title="t('userAccount.removeTitle')"
                @click="openRemoveTargetAccountDialog(u.id)"
              >
                <v-icon size="16">delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <v-divider style="opacity: 0.12" />

        <!-- Add account controls -->
        <div class="p-3 d-flex flex-col gap-2 bg-black/10">
          <v-btn
            block
            variant="flat"
            color="primary"
            size="small"
            class="rounded-lg text-white font-bold tracking-wide"
            @click="openAddAccountDialog(AUTHORITY_MICROSOFT)"
          >
            <v-icon start size="16">person_add</v-icon>
            Add Premium Account
          </v-btn>
          <v-btn
            block
            variant="outlined"
            color="amber"
            size="small"
            class="rounded-lg font-bold tracking-wide border-amber-500/50 hover:bg-amber-500/10 text-amber-400"
            @click="openAddAccountDialog(AUTHORITY_DEV)"
          >
            <v-icon start size="16">wifi_off</v-icon>
            Add Offline Account
          </v-btn>
        </div>
      </v-card>
    </v-menu>

    <SimpleDialog
      v-model="removeDialogShown"
      :title="t('userAccount.removeTitle')"
      :width="360"
      @confirm="onRemoveUser"
    >
      {{ t('userAccount.removeDescription') }}
    </SimpleDialog>
  </div>
</template>

<script lang="ts" setup>
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import SimpleDialog from '@/components/SimpleDialog.vue'
import { useService } from '@/composables'
import { kUserContext } from '@/composables/user'
import { useUserMenuControl } from '@/composables/userMenu'
import { useAccountSystemHistory } from '../composables/login'
import { injection } from '@/util/inject'
import { AUTHORITY_DEV, AUTHORITY_MICROSOFT, AUTHORITY_MOJANG, UserServiceKey } from '@xmcl/runtime-api'
import type { UserProfile } from '@xmcl/runtime-api'

const props = withDefaults(defineProps<{
  showRefresh?: boolean
  showInlineDelete?: boolean
  density?: 'compact' | 'comfortable'
}>(), {
  showRefresh: true,
  showInlineDelete: false,
  density: 'compact',
})

const { t } = useI18n()
const { users, userProfile, gameProfile, select } = injection(kUserContext)

const comfortable = computed(() => props.density === 'comfortable')
const hasUsers = computed(() => users.value.length > 0 && !!userProfile.value.id)
const avatarDimension = computed(() => comfortable.value ? 56 : 40)
const authorityLabel = computed(() => getAuthorityName(userProfile.value.authority))
const currentUserExpired = computed(() => hasUsers.value && (userProfile.value.invalidated || userProfile.value.expiredAt < Date.now()))
const userMenuOpen = ref(false)

function getAuthorityName(authority: string) {
  switch (authority) {
    case AUTHORITY_MICROSOFT: return t('userServices.microsoft.name')
    case AUTHORITY_MOJANG: return t('userServices.mojang.name')
    case AUTHORITY_DEV: return t('userServices.offline.name')
  }
  return authority
}

function isUserExpired(u: UserProfile) {
  return u.invalidated || u.expiredAt < Date.now()
}

function onSwitchUser(id: string) {
  select(id)
  userMenuOpen.value = false
}

const { refreshUser, removeUser } = useService(UserServiceKey)
const refreshingUser = ref(false)
const removingUser = ref(false)
const removeDialogShown = ref(false)
const removeTargetId = ref('')

async function onRefreshUser() {
  if (refreshingUser.value) return
  refreshingUser.value = true
  try {
    await refreshUser(userProfile.value.id)
  } finally {
    refreshingUser.value = false
  }
}

const { show: showUserProfileDialog } = useUserMenuControl()

function onIdentityClick() {
  if (!hasUsers.value) {
    openAddAccountDialog(AUTHORITY_MICROSOFT)
  }
}

function openRemoveAccountDialog() {
  removeTargetId.value = userProfile.value.id
  removeDialogShown.value = true
}

function openRemoveTargetAccountDialog(id: string) {
  removeTargetId.value = id
  removeDialogShown.value = true
}

async function onRemoveUser() {
  if (!removeTargetId.value || removingUser.value) return
  removingUser.value = true
  try {
    await removeUser({ id: removeTargetId.value } as UserProfile)
    removeDialogShown.value = false
  } finally {
    removingUser.value = false
  }
}

const { authority } = useAccountSystemHistory()

function openAddAccountDialog(authType?: string) {
  if (authType) {
    authority.value = authType
  }
  userMenuOpen.value = false
  showUserProfileDialog('login')
}
</script>

<style scoped>
.user-account-switcher__identity {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-color: rgba(var(--v-theme-on-surface), 0.08);
}

.user-account-switcher__identity:hover {
  background: rgba(var(--v-theme-on-surface), 0.07) !important;
  border-color: rgba(var(--v-theme-on-surface), 0.14) !important;
}

.user-account-switcher--comfortable .user-account-switcher__identity {
  min-height: 92px;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 18px;
}

.user-account-switcher__identity:active {
  transform: scale(0.98);
}

.account-switcher-menu {
  background: rgba(18, 18, 18, 0.95) !important;
  backdrop-filter: blur(20px);
}

.account-card {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.account-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  transform: translateY(-1px);
}

.account-card--active {
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
}

.badge-pill {
  letter-spacing: 0.3px;
  font-size: 9px !important;
}
</style>