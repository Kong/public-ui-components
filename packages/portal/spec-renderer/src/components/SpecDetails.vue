<template>
  <div
    class="kong-public-ui-spec-details"
    :class="{ 'active-op-focused': activeOperationFocused }"
  >
    <kong-swagger-ui
      v-if="hasRequiredProps"
      ref="swaggerRef"
      :application-registration-enabled="applicationRegistrationEnabled"
      :current-version="currentVersion"
      data-testid="kong-public-ui-spec-details-swagger"
      :essentials-only="essentialsOnly"
      :has-sidebar="hasSidebar"
      :relative-sidebar="relativeSidebar"
      :spec="document"
      :url="url"
    />
    <div
      v-else
      data-testid="kong-public-ui-spec-details-error"
    >
      {{ i18n.t('specDetails.error') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import '@kong-ui-public/swagger-ui-web-component'
import type { SwaggerUIElement } from '@kong-ui-public/swagger-ui-web-component'
import { PropType, computed, ref, watch, onMounted } from 'vue'
import { SpecDocument, OperationListItem } from '../types'
import composables from '../composables'

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
    default: false,
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
    type: Object as PropType<OperationListItem>,
    default: null,
  },
  applicationRegistrationEnabled: {
    type: Boolean,
    default: false,
  },
  currentVersion: {
    type: String,
    default: () => undefined,
  },
})

const { i18n } = composables.useI18n()

const swaggerRef = ref<SwaggerUIElement | null>(null)

const hasRequiredProps = computed((): boolean => {
  return !!(props.document || props.url)
})

const activeOperationFocused = ref(false)
const showAndScrollToOperation = (): void => {
  if (!swaggerRef.value) {
    return
  }

  swaggerRef.value.showOperation(props.activeOperation)
  swaggerRef.value.scrollToOperation(props.activeOperation)

  activeOperationFocused.value = true
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
.kong-public-ui-spec-details {
  color: var(--kong-portal-spec-details-text-color, #000);
  font-family: var(--kong-portal-spec-details-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-portal-spec-details-font-size, 16px);
}
</style>
