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
      :theme-overrides="encodeURIComponent(JSON.stringify(themeOverrides))"
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
import type { PropType } from 'vue'
import { computed, ref, watch, onMounted } from 'vue'
import type { SpecDocument, OperationListItem } from '../types'
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
  themeOverrides: {
    type: Object,
    default: null,
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

defineExpose({
  swaggerInstance: swaggerRef,
})

const hasRequiredProps = computed((): boolean => {
  return !!(props.document || props.url)
})

const activeOperationFocused = ref(false)
const showAndScrollToOperation = (): void => {
  if (!swaggerRef.value) {
    return
  }

  const activeOperation = { ...props.activeOperation }

  if (activeOperation && activeOperation.tag) {
    const newStr: string = decodeURIComponent(activeOperation.tag.trim().replaceAll(/\s/g, '%20'))
    activeOperation.tag = newStr
  }

  swaggerRef.value.showOperation(activeOperation)
  swaggerRef.value.scrollToOperation(activeOperation)

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
/* stylelint-disable @kong/design-tokens/token-var-usage */
.kong-public-ui-spec-details {
  color: var(--kong-ui-portal-spec-details-text-color, $kui-color-text);
  font-family: var(--kong-ui-portal-spec-details-font-family-default, $kui-font-family-text);
  font-size: var(--kong-ui-portal-spec-details-font-size, $kui-font-size-40);
}
</style>

<style lang="scss">
main {
  --kui-operation-summary-path-display: block;
  --kui-operation-summary-path-overflow: hidden;
  --kui-operation-summary-path-text-overflow: ellipsis;
  --kui-operation-summary-path-white-space: nowrap;
  --kui-operation-summary-path-word-wrap: normal;
  --kui-operation-summary-path-max-width: 30ch;

  @media screen and (min-width: $kui-breakpoint-phablet) {
    --kui-operation-summary-path-max-width: 40ch;
  }

  @media screen and (min-width: $kui-breakpoint-desktop) {
    --kui-operation-summary-path-max-width: 100ch;
  }
}
</style>
