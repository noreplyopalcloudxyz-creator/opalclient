import { BaseServiceKey } from '@xmcl/runtime-api'
import { useContextMenu } from '@/composables/contextMenu'
import { useService } from '@/composables/service'
import { injection } from '@/util/inject'
import { kInstance } from '@/composables/instance'
import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

function isTextInput(element: Element | null) {
  if (!element) {
    return false
  }
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || element.getAttribute('contenteditable') === 'true'
}

export function useRightShiftModMenuHotkey() {
  const { open } = useContextMenu()
  const router = useRouter()
  const { openDirectory } = useService(BaseServiceKey)
  const { instance } = injection(kInstance)
  const currentInstanceModsPath = computed(() => instance.value.path ? `${instance.value.path}/mods` : '')

  const { t } = useI18n()

  function openModMenu() {
    const items = [
      {
        text: t('rightShiftModMenu.openModsPage'),
        icon: 'extension',
        onClick: () => router.push('/mods'),
      },
      {
        text: t('rightShiftModMenu.openLauncherModTools'),
        icon: 'settings_applications',
        onClick: () => router.push('/opal-launcher-mods'),
      },
    ]

    if (currentInstanceModsPath.value) {
      items.push({
        text: t('rightShiftModMenu.openCurrentInstanceModsFolder'),
        icon: 'folder_open',
        onClick: () => openDirectory(currentInstanceModsPath.value),
      })
    }

    open(window.innerWidth / 2, window.innerHeight / 2, items)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code !== 'ShiftRight' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) {
      return
    }

    const active = document.activeElement
    if (isTextInput(active) || (active instanceof HTMLElement && active.isContentEditable)) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    openModMenu()
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
