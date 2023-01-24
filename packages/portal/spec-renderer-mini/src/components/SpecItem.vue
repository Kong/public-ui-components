<template>
  <div
    class="mini-spec-item px-4 py-3"
    :class="{
      'selected': item.selected,
      'is-summary': isSummary
    }"
    :data-testid="`mini-spec-item-${item.path}`"
    @click="handleClick"
  >
    <div
      v-if="!isSummary"
      class="d-flex"
    >
      <div
        class="spec-item-chicklet"
        :style="chickletStyle"
      />
      <div
        class="spec-item-label ml-2 truncate"
        :title="item.summary || ''"
      >
        {{ item.summary }}
      </div>
    </div>
    <div v-else>
      <div
        class="spec-item-label truncate"
        :title="item.summary || ''"
      >
        {{ item.summary }}
      </div>
      <div class="d-flex mt-2">
        <KBadge
          appearance="custom"
          :background-color="backgroundColor"
          class="spec-item-badge mr-2"
          :color="textColor"
        >
          {{ method ? method.toUpperCase() : '' }}
        </KBadge>
        <div class="spec-path">
          {{ item.path }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue'
import type { SpecItemType, MethodString } from '../types'
import { KBadge } from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const props = defineProps({
  item: {
    type: Object as PropType<SpecItemType>,
    required: true,
    // Items must have a method, summary, and path
    validator: (item: Record<string, string | number | boolean>): boolean => item.method !== undefined && item.summary !== undefined && item.path !== undefined,
  },
  isSummary: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const method = computed((): MethodString => {
  return props.item.method || ''
})

const chickletStyle = computed(() => {
  return {
    backgroundColor: backgroundColor.value,
  }
})

const textColor = computed((): string | undefined => {
  switch (method.value) {
    case 'get':
      return 'var(--blue-500)'
    case 'put':
      return 'var(--yellow-600)'
    case 'post':
      return 'var(--green-700)'
    case 'delete':
      return 'var(--red-700)'
    case 'patch':
      return 'var(--teal-500)'
    case 'options':
      return 'var(--steel-700)'
    case 'head':
      return 'var(--yellow-600)'
    case 'connect':
      return 'var(--purple-400)'
    case 'trace':
      return 'var(--steel-500)'

    default:
      return undefined
  }
})

const backgroundColor = computed((): string | undefined => {
  switch (method.value) {
    case 'get':
      return props.isSummary ? 'var(--blue-100)' : 'var(--blue-500)'
    case 'put':
      return props.isSummary ? 'var(--yellow-100)' : 'var(--yellow-400)'
    case 'post':
      return props.isSummary ? 'var(--green-100)' : 'var(--green-700)'
    case 'delete':
      return props.isSummary ? 'var(--red-100)' : 'var(--red-500)'
    case 'patch':
      return props.isSummary ? 'var(--teal-100)' : 'var(--teal-200)'
    case 'options':
      return props.isSummary ? 'var(--steel-100)' : 'var(--steel-700)'
    case 'head':
      return props.isSummary ? 'var(--yellow-100)' : 'var(--yellow-600)'
    case 'connect':
      return props.isSummary ? 'var(--purple-100)' : 'var(--purple-400)'
    case 'trace':
      return props.isSummary ? 'var(--steel-100)' : 'var(--steel-500)'

    default:
      return props.isSummary ? undefined : 'var(--black-500)'
  }
})

const handleClick = (): void => {
  emit('click', props.item)
}
</script>

<style lang="scss" scoped>
.mini-spec-item {
  $chicklet-size: 12px;

  .spec-item-chicklet {
    height: $chicklet-size;
    width: $chicklet-size;
    min-width: $chicklet-size;
    align-self: center;
  }

  .spec-item-label {
    font-size: 14px;
    font-weight: 400;
  }

  &.is-summary {
    border: 1px solid var(--grey-200);

    .spec-item-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--black-500);
    }

    .spec-path {
      font-size: 13px;
      color: var(--grey-600);
      font-family: monospace;
      align-self: center;
    }
  }

  &.selected {
    background-color: var(--grey-200);
    color: var(--blue-500);

    .spec-item-label {
      font-weight: 700;
    }
  }

  &:not(.is-summary) {
    cursor: pointer;

    &:hover {
      background-color: var(--grey-200);
    }
  }
}
</style>
