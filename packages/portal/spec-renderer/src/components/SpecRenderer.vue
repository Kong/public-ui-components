<template>
  <div class="kong-ui-public-spec-renderer">
    <div
      v-if="hasRequiredSpecData"
      class="spec-container"
    >
      <OperationsList
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
    <!-- TODO: i18n -->
    <div
      v-else
      data-testid="kong-ui-public-spec-renderer-error"
    >
      <slot name="error-state">
        Error: Spec information missing
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, computed } from 'vue'
import type { SpecDocument } from '@kong-ui-public/spec-details'
import type { Operation, Tag } from '@kong-ui-public/spec-operations-list'
import SpecDetails from '@kong-ui-public/spec-details'
import OperationsList from '@kong-ui-public/spec-operations-list'
import '@kong-ui-public/spec-details/dist/style.css'
import '@kong-ui-public/spec-operations-list/dist/style.css'

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

const hasRequiredSpecData = computed((): boolean => {
  return !!(props.spec && props.operationsList)
})

const selectedOperation = ref<Operation>()

const handleSelected = (item: Operation): void => {
  selectedOperation.value = item
}
</script>

<script lang="ts">
/**
 * Check if all of the provided items have a non-falsey value for all of the provided required props
 *
 * @param items The items to validate the prop exists for
 * @param requiredProps An array of all the required prop names
 * @returns Boolean whether or not the items have all the required props
 */
const hasRequiredProps = (items: object[], requiredProps: string[]): boolean => {
  let isValid = true

  items.forEach((item: object) => {
    requiredProps.forEach((requiredProp: string) => {
      if (!item[requiredProp as keyof typeof item]) {
        isValid = false
      }
    })
  })

  return isValid
}
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
