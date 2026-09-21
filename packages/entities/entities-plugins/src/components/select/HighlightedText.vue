<template>
  <span>
    <template
      v-for="(segment, index) in segments"
      :key="index"
    ><span
      v-if="segment.highlighted"
      class="highlighted-match"
    >{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildHighlightSegments } from '../../utils/helper'

const props = defineProps<{
  /** The full text to render. */
  text: string
  /** Character indices within `text` to highlight. */
  indices?: number[]
}>()

const segments = computed(() => buildHighlightSegments(props.text, props.indices))
</script>

<style lang="scss" scoped>
.highlighted-match {
  background-color: var(--kui-color-background-warning-weaker, $kui-color-background-warning-weaker);
  border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
  color: inherit;
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}
</style>
