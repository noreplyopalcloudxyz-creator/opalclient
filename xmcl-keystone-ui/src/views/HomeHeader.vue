<template>
  <div
    class="header sticky max-w-full select-none transition-all px-2"
    :style="{
    }"
    :class="{
      compact,
    }"
    @transitionstart="onTransitionStart"
    @transitionend="onTransitionEnd"
    @transitioncancel="onTransitionEnd"
    @wheel.stop
  >
    <div
      class="flex flex-col header-content"
      style="margin: auto"
      :style="{
        opacity: dragover ? 0 : '',
      }"
    >
      <div class="header-brand-bar flex items-center gap-2 mb-3 px-6">
        <div class="header-brand-badge">
          <v-icon size="18">diamond</v-icon>
          <span>Opal Launcher</span>
        </div>
      </div>
      <div
        class="align-center flex max-h-20 flex-1 flex-grow-0 items-baseline pl-6 pr-2 gap-1"
      >
        <span
          :style="{
            fontSize: headerFontSize
          }"
          class="overflow-hidden overflow-ellipsis whitespace-nowrap transition-all"
        >{{ name || `Minecraft ${version.minecraft}` }}</span>
        <router-view name="route" />
        <div class="flex-grow" />
        <router-view name="actions" v-slot="{ Component }">
          <transition
            name="slide-x-transition"
            mode="out-in"
          >
            <component :is="Component" class="flex-shrink-0" />
          </transition>
        </router-view>
      </div>
      <router-view name="extensions" v-slot="{ Component }">
        <transition
          name="slide-y-reverse-transition"
          mode="out-in"
        >
          <component
            :is="Component"
            class="px-4"
            :class="{
              'mt-5': !compact,
              'mt-3': compact,
            }"
          />
        </transition>
      </router-view>
    </div>
    <div
      v-if="dragover"
      class="w-full h-full flex top-0 p-5"
      style="position: absolute;"
      @dragenter="overcount++"
      @dragleave="overcount--"
      @drop="overcount = 0; onDropModpack($event)"
    >
      <Hint
        :text="t('modpack.dropHint')"
        icon="save_alt"
        class="rounded transition-all"
        :class="{
          dragover,
          yellow: overcount > 0,
          'darken-2': overcount > 0,
        }"
        :style="{
          transform: overcount > 0 ? 'scale(1.0125)' : ''
        }"
      />
    </div>
  </div>
</template>

<script lang=ts setup>
import Hint from '@/components/Hint.vue'
import { useDialog } from '@/composables/dialog'
import { kDropHandler } from '@/composables/dropHandler'
import { kInstance } from '@/composables/instance'
import { AddInstanceDialogKey } from '@/composables/instanceTemplates'
import { kCompact } from '@/composables/scrollTop'
import { kTheme } from '@/composables/theme'
import { useInFocusMode } from '@/composables/uiLayout'
import { injection } from '@/util/inject'

const { name, runtime: version } = injection(kInstance)
const isInFocusMode = useInFocusMode()
const { blurAppBar } = injection(kTheme)
const { t } = useI18n()

const transitioning = ref(false)
provide('transitioning', transitioning)

const onTransitionStart = (e: TransitionEvent) => {
  if (e.propertyName !== 'transform') return
  transitioning.value = true
}
const onTransitionEnd = (e: TransitionEvent) => {
  if (e.propertyName !== 'transform') return
  transitioning.value = false
}

const compact = injection(kCompact)
const headerFontSize = computed(() => {
  if (compact.value) {
    return '1.8rem'
  }
  if (name.value && name.value.length > 30) {
    return '2rem'
  }
  return '2.425rem'
})

const { dragover } = injection(kDropHandler)
const { show } = useDialog(AddInstanceDialogKey)
const onDropModpack = (e: DragEvent) => {
  e.preventDefault()
  const file = e.dataTransfer?.files.item(0)
  if (file) {
    show({
      format: 'modpack',
      path: file.path,
    })
  }
}

const overcount = ref(0)
</script>
<style scoped>

.header {
  padding-top: 2.5rem;
  padding-bottom: 1rem;
  color: var(--opal-text);
}

.header-brand-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.header-brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: rgba(92, 123, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--opal-accent);
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.header.compact {
  padding-top: 1.25rem;
  padding-bottom: 0.8rem;
}

.header-brand-badge v-icon {
  color: var(--opal-accent);
}

.header .align-center span {
  color: #eef3ff;
  text-shadow: 0 0 12px rgba(92, 123, 255, 0.12);
}

.compact {
}

.dark .compact {
}

.dark .compact {
  /* background: rgba(56, 56, 56, 0.4); */
}

</style>
