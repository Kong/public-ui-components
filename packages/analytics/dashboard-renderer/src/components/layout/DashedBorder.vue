<template>
  <div
    ref="wrap"
    class="db-wrap"
  >
    <svg
      v-if="width && height"
      aria-hidden="true"
      class="db-svg"
      :height="height"
      :width="width"
    >
      <rect
        fill="none"
        :height="height - 1"
        vector-effect="non-scaling-stroke"
        :width="width - 1"
        x="0.5"
        y="0.5"
      />
    </svg>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useDebounce } from '@kong-ui-public/core'

const { debounce } = useDebounce()

const wrap = ref<HTMLElement | null>(null)
const width = ref(0)
const height = ref(0)

let observer: ResizeObserver | null = null

const measure = () => {
  const el = wrap.value

  if (!el) {
    return
  }

  const rect = el.getBoundingClientRect()

  width.value = Math.round(rect.width)
  height.value = Math.round(rect.height)
}

const debouncedResizeHandler = debounce(() => {
  requestAnimationFrame(measure)
}, 100)

onMounted(() => {
  observer = new ResizeObserver(() => debouncedResizeHandler())

  if (wrap.value) {
    observer.observe(wrap.value)
  }

  measure()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style lang="scss" scoped>
.db-wrap {
  padding: $kui-space-60;
  position: relative;
}

.db-svg {
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.db-svg rect {
  rx: $kui-border-radius-30;
  ry: $kui-border-radius-30;
  /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
  stroke: $kui-color-border;
  stroke-dasharray: $kui-space-20 $kui-space-20;
  stroke-width: $kui-border-width-10;
}
</style>
