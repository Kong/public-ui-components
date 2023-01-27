<template>
  <div class="kong-ui-public-spec-renderer">
    <div
      v-if="hasRequiredSpecData"
      class="spec-container"
    >
      <SpecRendererMini
        :is-summary="true"
        :spec="operationsList"
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
      <slot name="error">
        Error: Spec information missing
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, computed } from 'vue'
import type { Document } from '@kong-ui-public/spec-details'
import type { SpecItemType, SpecTag } from '@kong-ui-public/spec-renderer-mini'
import SpecDetails from '@kong-ui-public/spec-details'
import SpecRendererMini from '@kong-ui-public/spec-renderer-mini'
import '@kong-ui-public/spec-details/dist/style.css'
import '@kong-ui-public/spec-renderer-mini/dist/style.css'

const props = defineProps({
  spec: {
    type: Object as PropType<Document>,
    required: true,
  },
  essentialsOnly: {
    type: Boolean,
    default: false,
  },
  operationsList: {
    type: Array as PropType<SpecItemType[]>,
    required: true,
    validator: (items: SpecItemType[]): boolean => !items.length || hasRequiredProps(items, ['method', 'path']),
  },
  tags: {
    type: Array as PropType<SpecTag[]>,
    default: () => [],
    validator: (items: SpecTag[]): boolean => !items.length || hasRequiredProps(items, ['name']),
  },
  navWidth: {
    type: String,
    default: '310',
  },
})

const hasRequiredSpecData = computed((): boolean => {
  return !!(props.spec && props.operationsList)
})

const selectedOperation = ref<SpecItemType>()

const handleSelected = (item: SpecItemType): void => {
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
    /* Counteract default top: -20px of swagger-ui component */
    top: 20px;
  }
}
</style>
