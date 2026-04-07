<template>
  <span class="referable-field-item">
    <span
      class="referable-field-link"
      role="button"
      tabindex="0"
      @click="scrollToField"
    >{{ fieldLabel }}</span><template v-if="!isLast">, </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../composables'

const props = defineProps<{
  field: string
  isLast?: boolean
}>()

const { formatPluginFieldLabel } = composables.usePluginHelpers()

const SCROLL_OFFSET_PX = 24

const fieldId = computed(() =>
  props.field.replace(/\./g, '-'),
)

const fieldLabel = computed(() =>
  props.field
    .replace(/^[cC]onfig\./, '')
    .split('.')
    .map((s) => formatPluginFieldLabel(s))
    .join('.'),
)

const scrollToField = () => {
  if (!fieldId.value) {
    return
  }

  const selector = `label[for="${fieldId.value}"]`
  const target = document.querySelector<HTMLElement>(selector) || document.getElementById(fieldId.value)

  if (!target) {
    return
  }

  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX)
  const focusAfterScrollEnd = () => {
    target.click?.()
  }
  window.addEventListener('scrollend', focusAfterScrollEnd, { once: true })
  window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<style scoped lang="scss">
.referable-field-link {
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
  }
}
</style>
