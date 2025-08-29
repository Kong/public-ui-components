<template>
  <span
    class="dk-hotkey-label"
    :class="{ reverse }"
  >
    <span
      v-if="label"
      class="label"
    >
      {{ label }}
    </span>
    <kbd class="keys">{{ formattedKeys }}</kbd>
  </span>
</template>

<script setup lang="ts">
import type { KeySpec } from './utils'

import { formatKeys } from './utils'

const { keys, reverse } = defineProps<{
  label?: string
  keys: KeySpec
  reverse?: boolean
}>()

const formattedKeys = formatKeys(keys)
</script>

<style lang="scss" scoped>
.dk-hotkey-label {
  display: flex;
  flex-grow: 1;
  gap: $kui-space-30;
  justify-content: space-between;
  white-space: nowrap;

  .keys {
    color: $kui-color-text-neutral;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, Inter, sans-serif;
    font-size: $kui-font-size-20;
  }

  &.reverse .keys {
    color: $kui-color-text-neutral-weak;
  }
}
</style>
