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
  color: var(--white, #fff);
  background-color: var(--red-500, #D44324);
  padding: 2px 6px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 36px;
  -webkit-user-select: none;
  user-select: none;
}
</style>
