<template>
  <div class="kong-ui-public-spec-renderer">
    <div
      v-if="hasRequiredSpecData"
      class="spec-container"
    >
      <SpecOperationsList
        :operations="operationsList"
        :tags="tags"
        :width="navWidth"
        @selected="handleSelected"
      />
      <SpecDetails
        :active-operation="selectedOperation"
        class="spec-renderer-details"
        :document="spec"
        :essentials-only="essentialsOnly"
        :has-sidebar="false"
      />
    </div>
    <div
      v-else
      data-testid="kong-ui-public-spec-renderer-error"
    >
      <slot name="error-state">
        {{ t('specRenderer.error') }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, computed } from 'vue'
import type { SpecDocument, Operation, OperationListItem, Tag } from '../types'
import composables from '../composables'
import SpecDetails from './SpecDetails.vue'
import SpecOperationsList from './SpecOperationsList.vue'

const props = defineProps({
  spec: {
    type: Object as PropType<SpecDocument>,
    required: true,
  },
  essentialsOnly: {
    type: Boolean,
    default: false,
  },
  operationsList: {
    type: Array as PropType<Operation[]>,
    required: true,
    validator: (items: Operation[]): boolean => !items.length || hasRequiredProps(items, ['method', 'path']),
  },
  tags: {
    type: Array as PropType<Tag[]>,
    default: () => [],
    validator: (items: Tag[]): boolean => !items.length || hasRequiredProps(items, ['name']),
  },
  navWidth: {
    type: String,
    default: '310',
  },
})

const { i18n: { t } } = composables.useI18n()

const hasRequiredSpecData = computed((): boolean => {
  return !!(props.spec && props.operationsList)
})

const selectedOperation = ref<OperationListItem>()

const handleSelected = (item: OperationListItem): void => {
  selectedOperation.value = item
}
</script>

<script lang="ts">
// Must import in a separate script block so `hasRequiredProps` can be used in prop validator
const { hasRequiredProps } = composables.useUtilities()
</script>

<style lang="scss" scoped>
.kong-ui-public-spec-renderer {
  .spec-container {
    display: flex;
  }

  .spec-renderer-details {
    position: relative;
    width: 100%;
  }
}
</style>
