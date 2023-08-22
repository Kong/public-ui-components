<template>
  <span
    ref="contentRef"
    class="content-wrapper"
  >
    <span v-if="isFirst">
      <KTooltip
        :disabled="!hasTooltip"
        :label="tooltipText"
        max-width="300"
        placement="bottomStart"
      >
        <slot />
      </KTooltip>
    </span>

    <slot v-else />
  </span>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { computed, ref, watch, onUnmounted, onMounted } from 'vue'

const props = defineProps({
  keyName: {
    type: String,
    required: true,
  },
  rowEl: {
    type: [Object, null] as PropType<HTMLElement | null>,
    required: true,
  },
})

const element = computed((): HTMLElement | null => props.rowEl?.querySelector(`[data-testid="${props.keyName}"]`) || null)
const content = computed((): Element | null => element.value?.querySelector('[role="button"]') || null)

const isFirst = computed((): boolean => {
  const cells = props.rowEl?.querySelectorAll('td')

  if (cells) {
    return cells[0]?.getAttribute('data-testid') === props.keyName
  } else {
    return false
  }
})

let observer: ResizeObserver | undefined

const stopObserve = () => {
  if (observer) {
    observer.disconnect()
    observer = undefined
  }
}

const setWidths = (): void => {
  contentWidth.value = content.value?.getBoundingClientRect().width || 0
  elementWidth.value = element.value?.clientWidth || 0
  tooltipText.value = contentRef.value?.innerText || ''
}

const contentRef = ref<Record<string, any>>({})
const contentWidth = ref(0)
const elementWidth = ref(0)
const tooltipText = ref('')

const targets = computed(() => [content.value, element.value])

const stopWatch = watch(
  targets,
  (els) => {
    if (isFirst.value) {
      stopObserve()
      if ('ResizeObserver' in window && window) {
        observer = new ResizeObserver(entries => {
          // Wrapper 'window.requestAnimationFrame' is needed for disabling "ResizeObserver loop limit exceeded" error in DD
          window.requestAnimationFrame(() => {
            if (!Array.isArray(entries) || !entries.length) {
              return
            }
            // Actual code
            setWidths()
          })
        })
        for (const _el of els) {
          _el && observer!.observe(_el)
        }
      }
    }
  },
  { immediate: true, flush: 'post', deep: true },
)

const hasTooltip = computed((): boolean => {
  if (isFirst.value) {
    return contentWidth.value > elementWidth.value
  } else {
    return false
  }
})

onMounted(() => {
  setWidths()
})

onUnmounted(() => {
  stopWatch()
})
</script>

<style scoped lang="scss">
.content-wrapper {
  :deep([role='button']) {
    display: inline;
  }
}
</style>
