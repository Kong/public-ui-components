<template>
  <div class="kong-portal-spec-details">
    <kong-swagger-ui
      v-if="hasRequiredProps"
      :essentials-only="essentialsOnly"
      :has-sidebar="hasSidebar"
      :relative-sidebar="relativeSidebar"
      :spec="document"
      :url="url"
    />
    <div
      v-else
      data-testid="kong-portal-spec-details-error"
    >
      Error: No document spec provided
    </div>
  </div>
</template>

<script setup lang="ts">
import '@kong-ui-public/swagger-ui-web-component'
import { PropType, computed } from 'vue'
import { Document } from '../types'

const props = defineProps({
  document: {
    type: Object as PropType<Document>,
    default: null,
  },
  url: {
    type: String,
    default: '',
  },
  hasSidebar: {
    type: Boolean,
    default: true,
  },
  relativeSidebar: {
    type: Boolean,
    default: false,
  },
  essentialsOnly: {
    type: Boolean,
    default: false,
  },
})

const hasRequiredProps = computed((): boolean => {
  return !!(props.document || props.url)
})
</script>

<style lang="scss" scoped>
.kong-portal-spec-details {
  font-family: var(--kong-portal-spec-details-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-portal-spec-details-font-size, 16px);
  color: var(--kong-portal-spec-details-text-color, #000);
}
</style>
