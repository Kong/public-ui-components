<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_70 } from '@kong/design-tokens'
import { ProgressIcon } from '@kong/icons'

const { loading, delay = 200 } = defineProps<{
  loading: boolean
  delay?: number
}>()

const active = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const clearTimer = () => {
  clearTimeout(timer)
  timer = undefined
}

watch(() => loading, (isLoading) => {
  clearTimer()

  if (!isLoading) {
    active.value = false

    return
  }

  timer = setTimeout(() => {
    active.value = true
  }, delay)
}, { immediate: true })

onBeforeUnmount(clearTimer)
</script>

<template>
  <div
    :aria-busy="loading"
    class="loading-overlay"
    :class="{ active }"
    data-testid="loading-overlay"
  >
    <div
      class="loading-overlay-content"
      :inert="active || undefined"
    >
      <slot />
    </div>
    <div
      v-if="active"
      class="loading-overlay-spinner"
      data-testid="loading-overlay-spinner"
    >
      <ProgressIcon
        :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
        :size="`var(--kui-icon-size-70, ${KUI_ICON_SIZE_70})`"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-overlay {
  height: 100%;
  position: relative;
  width: 100%;

  .loading-overlay-content {
    height: 100%;
    transition: opacity 0.2s;
    width: 100%;
  }

  &.active .loading-overlay-content {
    opacity: 0.4;
  }

  .loading-overlay-spinner {
    align-items: center;
    display: flex;
    inset: 0;
    justify-content: center;
    pointer-events: none;
    position: absolute;
  }
}
</style>
