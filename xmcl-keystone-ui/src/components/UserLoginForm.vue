<template>
  <Hint
    v-if="showDropHint"
    icon="save_alt"
    :text="t('login.dropHint').toString()"
    class="text-lg font-medium tracking-wide drop-shadow-md"
  />
  <div
    v-else
    class="login-form-container overflow-auto mx-auto w-full h-full max-w-md px-6 py-8 flex flex-col justify-between"
  >
    <div>
      <!-- Header / Rebranding -->
      <div class="login-form-branding flex flex-col items-center mb-6">
        <div class="text-center">
          <h2 class="text-2xl font-black tracking-widest text-white flex items-center justify-center gap-2">
            <span class="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">OPAL</span>
            <span class="text-white opacity-90">LAUNCHER</span>
          </h2>
          <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-semibold">Account Portal</p>
        </div>
      </div>

      <!-- Custom Elegant Tabs -->
      <div class="tabs-container d-flex p-1 rounded-xl bg-black/30 mb-6 border border-white/5">
        <button
          class="tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all d-flex align-center justify-center gap-1.5"
          :class="activeTab === 'microsoft' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-white/60 hover:text-white hover:bg-white/5'"
          @click="setTab('microsoft')"
        >
          <v-icon size="14">verified</v-icon>
          Premium
        </button>
        <button
          class="tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all d-flex align-center justify-center gap-1.5"
          :class="activeTab === 'offline' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'"
          @click="setTab('offline')"
        >
          <v-icon size="14">wifi_off</v-icon>
          Offline Account
        </button>
        <button
          v-if="hasThirdPartyServices"
          class="tab-btn flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all d-flex align-center justify-center gap-1.5"
          :class="activeTab === 'thirdparty' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'text-white/60 hover:text-white hover:bg-white/5'"
          @click="setTab('thirdparty')"
        >
          <v-icon size="14">cloud</v-icon>
          Third-Party
        </button>
      </div>

      <!-- ERROR ALERT -->
      <v-alert
        v-if="errorMessage"
        density="compact"
        variant="tonal"
        color="error"
        rounded="lg"
        class="mb-4 text-left text-xs border border-error/20"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- TAB CONTENT -->
      <div class="tab-content transition-all duration-300">
        
        <!-- MICROSOFT LOGIN TAB -->
        <div v-if="activeTab === 'microsoft'" class="d-flex flex-col gap-4 text-center py-2">
          <div class="opacity-60 text-xs text-white max-w-[280px] mx-auto mb-2 leading-relaxed">
            Sign in with your Microsoft Account to access official premium features and multiplayer servers.
          </div>
          
          <!-- Microsoft Login Button / Cancel Button -->
          <v-btn
            v-if="!isLogining"
            block
            size="x-large"
            color="#222"
            class="microsoft-login-btn rounded-xl text-white font-bold tracking-wide d-flex align-center justify-center gap-3 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300"
            @click="onLogin"
          >
            <template #prepend>
              <svg class="w-4 h-4 mr-1.5" viewBox="0 0 21 21" fill="currentColor">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
            </template>
            Sign in with Microsoft
          </v-btn>
          <v-btn
            v-else
            block
            size="x-large"
            color="error"
            variant="tonal"
            class="rounded-xl font-bold tracking-wide d-flex align-center justify-center gap-2"
            @click="onLogin"
          >
            <v-icon size="16">close</v-icon>
            {{ t('shared.cancel') }}
          </v-btn>

          <!-- Device Code Checkbox/Mode -->
          <div class="d-flex align-center justify-center mt-2">
            <v-checkbox
              v-model="data.useDeviceCode"
              density="compact"
              hide-details
              color="primary"
              class="text-xs text-white/70"
              label="Use Device Code Login"
            />
          </div>

          <!-- Device Code Verification Instructions -->
          <div v-if="data.verificationUri" class="device-code-box p-4 rounded-xl bg-black/40 border border-info/20 text-left mt-2">
            <div class="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Authorization Code:</div>
            <div class="text-xl font-mono font-black text-primary tracking-widest select-all mb-3">{{ data.password }}</div>
            <v-btn
              block
              size="small"
              color="info"
              variant="flat"
              class="rounded-lg text-[10px] font-bold"
              :href="data.verificationUri"
              target="browser"
            >
              Authorize in Browser
              <v-icon end size="12">open_in_new</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- OFFLINE LOGIN TAB -->
        <div v-if="activeTab === 'offline'" class="d-flex flex-col gap-4 py-2">
          <!-- Username Input -->
          <v-combobox
            v-slot:item
            v-if="!streamerMode"
            ref="accountInput"
            v-model="data.username"
            :items="history"
            prepend-inner-icon="person"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            required
            label="Username"
            class="custom-input"
            :rules="usernameRules"
            :error="!!errorMessage"
            hide-details="auto"
            @update:model-value="error = undefined"
            @keypress="error = undefined"
            @keypress.enter="onLogin"
          />
          <v-text-field
            v-else
            ref="accountInput"
            v-model="data.username"
            prepend-inner-icon="person"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            required
            type="password"
            label="Username"
            class="custom-input"
            :rules="usernameRules"
            :error="!!errorMessage"
            hide-details="auto"
            @update:model-value="error = undefined"
            @keypress="error = undefined"
            @keypress.enter="onLogin"
          />

          <!-- Advanced Offline UUID Toggle & Input -->
          <div class="advanced-toggle text-right">
            <button
              class="text-[10px] text-white/40 hover:text-white transition-colors font-semibold flex items-center gap-1 ml-auto"
              @click="showOfflineAdvanced = !showOfflineAdvanced"
            >
              <v-icon size="12">{{ showOfflineAdvanced ? 'expand_less' : 'expand_more' }}</v-icon>
              Advanced (UUID)
            </button>
          </div>

          <v-text-field
            v-model="data.uuid"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            prepend-inner-icon="fingerprint"
            placeholder="User UUID (Optional)"
            label="Custom UUID"
            class="custom-input"
            hide-details
            @keypress.enter="onLogin"
          />

          <v-btn
            block
            size="large"
            color="amber-darken-1"
            class="rounded-xl text-white font-bold tracking-wide mt-2"
            :loading="isLogining"
            @click="onLogin"
          >
            {{ isLogining ? 'Logging In...' : 'Add Offline Account' }}
          </v-btn>
        </div>

        <!-- THIRD PARTY LOGIN TAB -->
        <div v-if="activeTab === 'thirdparty'" class="d-flex flex-col gap-4 py-2">
          <v-select
            v-model="selectedThirdParty"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            prepend-inner-icon="cloud"
            :items="thirdPartyItems"
            item-title="text"
            item-value="value"
            label="Service Provider"
            hide-details
            class="custom-select"
          />

          <v-text-field
            ref="accountInput"
            v-model="data.username"
            prepend-inner-icon="person"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            required
            :label="getUserServiceAccount(authority)"
            class="custom-input"
            :rules="usernameRules"
            :error="!!errorMessage"
            hide-details="auto"
            @update:model-value="error = undefined"
            @keypress="error = undefined"
            @keypress.enter="onLogin"
          />

          <v-text-field
            v-model="data.password"
            prepend-inner-icon="lock"
            variant="outlined"
            density="comfortable"
            rounded="xl"
            type="password"
            required
            label="Password"
            class="custom-input"
            :rules="passwordRules"
            :error="!!errorMessage"
            hide-details="auto"
            @update:model-value="error = undefined"
            @keypress.enter="onLogin"
          />

          <v-btn
            block
            size="large"
            color="indigo-darken-1"
            class="rounded-xl text-white font-bold tracking-wide mt-2"
            :loading="isLogining"
            @click="onLogin"
          >
            {{ isLogining ? 'Signing In...' : 'Sign In with Service' }}
          </v-btn>
        </div>

      </div>
    </div>

    <!-- Bottom Actions / Links -->
    <div class="mt-6 flex flex-col gap-3 items-center text-xs font-semibold">
      <a
        v-if="signUpLink && activeTab !== 'offline'"
        target="browser"
        :href="signUpLink"
        class="hover:underline transition-colors text-white/50 hover:text-white"
      >
        Don't have an account? Sign up
      </a>
      <div
        class="flex items-center gap-3 flex-wrap justify-center py-2 px-4 rounded-xl border border-white/5 w-full bg-white/2 backdrop-blur-sm"
      >
        <a
          class="hover:underline cursor-pointer transition-colors text-white/50 hover:text-white"
          @click.stop="$emit('add-service')"
        >
          {{ manageAuthorityLabel }}
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Hint from '@/components/Hint.vue'
import { useRefreshable, useService } from '@/composables'
import { useLocalStorageCacheBool } from '@/composables/cache'
import { kSupportedAuthorityMetadata } from '@/composables/yggrasil'
import { injection } from '@/util/inject'
import {
  AUTHORITY_DEV,
  AUTHORITY_MICROSOFT,
  AUTHORITY_MOJANG,
  UserException,
  UserServiceKey,
  isException,
} from '@xmcl/runtime-api'
import { Ref, ref, reactive, computed, watch, nextTick, inject } from 'vue'
import { useAccountSystemHistory, useAuthorityItems } from '../composables/login'
import { kUserContext, useLoginValidation } from '../composables/user'

const props = defineProps<{
  inside: boolean
  options?: {
    username?: string
    password?: string
    microsoftUrl?: string
    authority?: string
    error?: string
  }
}>()

const emit = defineEmits(['seed', 'login', 'add-service'])
const streamerMode = inject('streamerMode', useLocalStorageCacheBool('streamerMode', false))

const { t } = useI18n()
const { select } = injection(kUserContext)
const { login, abortLogin, on } = useService(UserServiceKey)

// Tabs config
const activeTab = ref<'microsoft' | 'offline' | 'thirdparty'>('microsoft')
const showOfflineAdvanced = ref(false)
const selectedThirdParty = ref('')

// Shared data
const data = reactive({
  username: '',
  password: '',
  uuid: '',
  useDeviceCode: false,
  useFast: false,
  verificationUri: '',
})
const isOffline = computed(() => authority.value === AUTHORITY_DEV)
const isLogining = ref(false)

// Label
const getUserServiceAccount = (serv: string) => {
  if (serv === AUTHORITY_MICROSOFT) return t('userServices.microsoft.account')
  if (serv === AUTHORITY_MOJANG) return t('userServices.mojang.account')
  if (serv === AUTHORITY_DEV) return t('userServices.offline.account')
  return t('userServices.mojang.account')
}

// Authority items
const { data: services } = injection(kSupportedAuthorityMetadata)
const items = useAuthorityItems(services)

// Account history
const { authority, history } = useAccountSystemHistory()

const currentAccountSystem = computed(() => {
  return services.value?.find((a) => a.authority === authority.value)
})

// Sign up link
const signUpLink = computed(() => {
  const sys = currentAccountSystem.value
  if (sys?.authority === AUTHORITY_MICROSOFT) return 'https://account.live.com/registration'
  const url = sys?.authlibInjector?.meta.links.register
  return url || ''
})

const manageAuthorityLabel = computed(() => t('userService.manageServices'))

// Password data
const allowDeviceCode = computed(() => {
  return currentAccountSystem.value?.flow.includes('device-code')
})
const emailOnly = computed(() => {
  if (!currentAccountSystem.value?.authlibInjector) {
    if (authority.value === AUTHORITY_MICROSOFT) {
      return true // Microsoft account always has email-only flow
    }
  }
  return false
})
const isPasswordReadonly = computed(
  () => !currentAccountSystem.value?.flow.includes('password') || data.useDeviceCode,
)
const isPasswordDisabled = computed(() => isPasswordReadonly.value && !data.useDeviceCode)
const passwordType = computed(() => (data.useDeviceCode ? 'text' : 'password'))
const passwordLabel = computed(() => getUserServicePassword(authority.value))
const passwordPlaceholder = computed(() =>
  data.useDeviceCode ? t('userServices.microsoft.deviceCodeHint') : passwordLabel.value,
)
const getUserServicePassword = (serv: string) => {
  if (data.useDeviceCode) return t('userServices.microsoft.deviceCode')
  if (serv === AUTHORITY_MICROSOFT) return t('userServices.microsoft.password')
  if (serv === AUTHORITY_DEV) return t('userServices.offline.password')
  return t('userServices.mojang.password')
}

// UUID label
const uuidLabel = computed(() => t('userServices.offline.uuid'))

// Event handler
on('microsoft-authorize-url', (url) => {
  data.verificationUri = url
})
on('device-code', (code) => {
  data.password = code.userCode
  data.verificationUri = code.verificationUri
})

// Rules
const { usernameRules, passwordRules } = useLoginValidation(emailOnly, isOffline)

// Login Error
const errorMessage = computed(() => {
  const e = error.value
  if (isException(UserException, e)) {
    if (e.exception.type === 'loginInvalidCredentials') {
      return t('loginError.invalidCredentials')
    }
    if (e.exception.type === 'loginInternetNotConnected') {
      return t('loginError.badNetworkOrServer')
    }
    if (e.exception.type === 'loginGeneral') {
      if (e.message) {
        return e.message
      }
      return t('loginError.requestFailed')
    }
    if (e.exception.type === 'fetchMinecraftProfileFailed') {
      if (e.exception.errorType === 'ProfileNotFoundError' && !e.exception.developerMessage) {
        return t('loginError.noProfileForNewUser')
      }
      return t('loginError.fetchMinecraftProfileFailed', {
        reason: `${e.exception.errorType}, ${e.exception.developerMessage}`,
      })
    }
    if (e.exception.type === 'userCheckGameOwnershipFailed') {
      return t('loginError.checkOwnershipFailed')
    }
    if (e.exception.type === 'userExchangeXboxTokenFailed') {
      const redirect = e.exception.xErrRedirect
      switch (e.exception.reason) {
        case 'CHILD_ACCOUNT':
          return t('loginError.loginXboxChildAccount', { url: redirect ?? 'https://start.ui.xboxlive.com/AddChildToFamily' })
        case 'NO_XBOX_PROFILE':
        case 'NO_ACCOUNT':
          return t('loginError.loginXboxNoXboxProfile', { url: redirect ?? 'https://start.ui.xboxlive.com/CreateAccount' })
        case 'ADULT_VERIFICATION_REQUIRED':
          return t('loginError.loginXboxAdultVerification', { url: redirect ?? '' })
        case 'REGION_LOCKED':
          return t('loginError.loginXboxRegionLocked')
        case 'BANNED':
          return t('loginError.loginXboxBanned')
        case 'BAD_AGE':
          return t('loginError.loginXboxAgeRestricted')
        case 'BAD_XSTS':
          return t('loginError.loginXboxBadXsts')
      }
      if (typeof e.exception.xErr === 'number') {
        return t('loginError.loginXboxFailedWithCode', { code: e.exception.xErr })
      }
      return t('loginError.loginXboxFailed')
    }
    if (e.exception.type === 'userLoginMinecraftByXboxFailed') {
      const { status, retryAfter } = e.exception
      if (status === 429) {
        const retrySeconds = typeof retryAfter === 'number' ? Math.ceil(retryAfter / 1000) : undefined
        return retrySeconds
          ? t('loginError.loginMinecraftByXboxRateLimitedWithRetry', { seconds: retrySeconds })
          : t('loginError.loginMinecraftByXboxRateLimited')
      }
      if (typeof status === 'number' && status >= 500) {
        return t('loginError.loginMinecraftByXboxServerError', { status })
      }
      if (typeof status === 'number') {
        return t('loginError.loginMinecraftByXboxStatus', { status })
      }
      return t('loginError.loginMinecraftByXboxFailed')
    }
    if (e.exception.type === 'loginReset') {
      return t('loginError.connectionReset')
    }
    if (e.exception.type === 'loginTimeout') {
      return t('loginError.timeout')
    }
    if (e.exception.type === 'userAcquireMicrosoftTokenFailed') {
      return t('loginError.acquireMicrosoftTokenFailed')
    }

    if (e.message) {
      return e.message
    }
  }

  if (e && typeof (e as Error).message === 'string') {
    return (e as Error).message
  }

  return e ? t('loginError.requestFailed') : ''
})

// Third party services helper
const thirdPartyItems = computed(() => {
  return items.value.filter(item => item.value !== AUTHORITY_MICROSOFT && item.value !== AUTHORITY_DEV)
})
const hasThirdPartyServices = computed(() => {
  return thirdPartyItems.value.length > 0
})

watch(thirdPartyItems, (newVal) => {
  if (newVal.length > 0 && !selectedThirdParty.value) {
    selectedThirdParty.value = newVal[0].value
  }
}, { immediate: true })

function setTab(tab: 'microsoft' | 'offline' | 'thirdparty') {
  activeTab.value = tab
  if (tab === 'microsoft') {
    authority.value = AUTHORITY_MICROSOFT
  } else if (tab === 'offline') {
    authority.value = AUTHORITY_DEV
  } else if (tab === 'thirdparty') {
    if (selectedThirdParty.value) {
      authority.value = selectedThirdParty.value
    } else if (thirdPartyItems.value.length > 0) {
      selectedThirdParty.value = thirdPartyItems.value[0].value
      authority.value = selectedThirdParty.value
    }
  }
}

watch(selectedThirdParty, (newVal) => {
  if (activeTab.value === 'thirdparty' && newVal) {
    authority.value = newVal
  }
})

watch(authority, (newAuth) => {
  if (newAuth === AUTHORITY_MICROSOFT) {
    activeTab.value = 'microsoft'
  } else if (newAuth === AUTHORITY_DEV) {
    activeTab.value = 'offline'
  } else {
    activeTab.value = 'thirdparty'
    selectedThirdParty.value = newAuth
  }
}, { immediate: true })

// Login Execution
const accountInput: Ref<any> = ref(null)
const { refresh: onLogin, error } = useRefreshable(async () => {
  error.value = undefined
  if (accountInput.value) {
    accountInput.value.blur()
  }
  await nextTick()
  if (isLogining.value) {
    await abortLogin()
    return
  }

  // Only validate username & password locally if we are NOT on Microsoft Premium tab
  if (authority.value !== AUTHORITY_MICROSOFT) {
    for (const rule of usernameRules.value) {
      const err = rule(data.username)
      if (err !== true) {
        throw new Error(typeof err === 'string' ? err : 'Validation failed')
      }
    }

    if (!isPasswordReadonly.value && !isPasswordDisabled.value) {
      for (const rule of passwordRules) {
        const err = rule(data.password)
        if (err !== true) {
          throw new Error(typeof err === 'string' ? err : 'Validation failed')
        }
      }
    }
  }

  const index = history.value.indexOf(data.username)
  if (index === -1 && data.username) {
    history.value = [data.username, ...history.value]
  }
  isLogining.value = true
  const profile = await login({
    username: data.username,
    password: data.password,
    authority: authority.value,
    properties: {
      mode: data.useDeviceCode ? 'device' : '',
      uuid: data.uuid,
    },
  }).finally(() => {
    isLogining.value = false
  })
  select(profile.id)
  emit('login', profile)
})

watch(authority, () => {
  emit('seed')
})

// Hint state
const showDropHint = computed(() => allowDeviceCode.value && props.inside && isLogining.value)

// Reset / watch options
watch(
  () => props.options,
  (options) => {
    if (!options) {
      data.username = history.value[0] ?? ''
      data.password = ''
      data.verificationUri = ''
      error.value = undefined
    } else {
      data.username = options?.username ?? data.username
      data.verificationUri = ''
      authority.value = options?.authority ?? authority.value
      error.value = undefined
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.login-form-container {
  background: transparent;
}
.tabs-container {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}
.tab-btn {
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.tab-btn:hover {
  color: #fff;
}
.device-code-box {
  background: rgba(0, 0, 0, 0.5) !important;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.2);
}
.custom-input :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.02) !important;
}
.custom-input :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.microsoft-login-btn {
  background: rgba(255, 255, 255, 0.03) !important;
  transition: all 0.3s ease;
}
.microsoft-login-btn:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
}
</style>
