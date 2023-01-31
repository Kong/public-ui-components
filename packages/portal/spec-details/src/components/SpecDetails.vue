<template>
  <div class="kong-portal-spec-details">
    <kong-swagger-ui
      v-if="hasRequiredProps"
      :application-registration-enabled="applicationRegistrationEnabled"
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
import type { SwaggerUIElement } from '@kong-ui-public/swagger-ui-web-component'
import { PropType, computed, ref, watch, onMounted } from 'vue'
import { SpecDocument, Operation } from '../types'

const props = defineProps({
  document: {
    type: Object as PropType<SpecDocument>,
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
  activeOperation: {
    type: Object as PropType<Operation>,
    default: null,
  },
  applicationRegistrationEnabled: {
    type: Boolean,
    default: false,
  },
})

const swaggerRef = ref<SwaggerUIElement | null>(null)

const hasRequiredProps = computed((): boolean => {
  return !!(props.document || props.url)
})

function showAndScrollToOperation() {
  if (!swaggerRef.value) {
    return
  }

  swaggerRef.value.showOperation(props.activeOperation)
  swaggerRef.value.scrollToOperation(props.activeOperation)
}

onMounted(() => {
  if (props.activeOperation) {
    showAndScrollToOperation()
  }
})

watch(() => props.activeOperation, () => {
  if (props.activeOperation) {
    showAndScrollToOperation()
  }
})
</script>

<style lang="scss" scoped>
.kong-portal-spec-details {
  color: var(--kong-portal-spec-details-text-color, #000);
  font-family: var(--kong-portal-spec-details-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-portal-spec-details-font-size, 16px);
}
</style>
