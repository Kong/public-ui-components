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
  background-color: $kui-color-background-danger-weak;
  border-radius: 16px;
  color: $kui-color-background;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-regular;
  line-height: $kui-line-height-20;
  max-width: 36px;
  overflow: hidden;
  padding: $kui-space-10 $kui-space-30;
  text-overflow: ellipsis;
  -webkit-user-select: none;
  user-select: none;
  white-space: nowrap;
}
</style>
