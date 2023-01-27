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
  background-color: var(--red-500, #D44324);
  border-radius: 16px;
  color: var(--white, #fff);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.1;
  max-width: 36px;
  overflow: hidden;
  padding: 2px 6px;
  text-overflow: ellipsis;
  -webkit-user-select: none;
  user-select: none;
  white-space: nowrap;
}
</style>
