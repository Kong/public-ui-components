<template>
  <div class="kong-portal-spec-renderer">
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
      data-testid="kong-portal-spec-renderer-error"
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
.kong-portal-spec-renderer {
  font-family: var(--kong-portal-spec-renderer-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-portal-spec-renderer-font-size, 16px);
  color: var(--kong-portal-spec-renderer-text-color, #000);
}
</style>
