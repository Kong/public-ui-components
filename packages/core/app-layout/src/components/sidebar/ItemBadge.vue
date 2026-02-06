<template>
  <div
    v-if="alertCount"
    class="item-badge"
    :title="(count || 0) > MAX_COUNT ? String(count) : undefined"
  >
    {{ alertCount }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const MAX_COUNT = 99

const props = defineProps({
  count: {
    type: Number,
    required: true,
    default: undefined,
  },
})

const alertCount = computed((): string => {
  if (!props.count) {
    return ''
  }

  return props.count > MAX_COUNT ? `${MAX_COUNT}+` : props.count.toString()
})
</script>

<style lang="scss" scoped>
.item-badge {
  background-color: var(--kui-color-background-danger, $kui-color-background-danger);
  border-radius: 16px;
  color: var(--kui-color-text-inverse, $kui-color-text-inverse);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  max-width: 36px;
  min-width: 20px;
  overflow: hidden;
  padding: var(--kui-space-10, $kui-space-10) var(--kui-space-30, $kui-space-30);
  text-align: center;
  text-overflow: ellipsis;
  -webkit-user-select: none;
  user-select: none;
  white-space: nowrap;
}
</style>
