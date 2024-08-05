<template>
  <KCard class="sandbox-route-flavor-control">
    <KCollapse
      v-model="isRouteFlavorControlCollapsed"
      :class="{ 'is-collapsed': isRouteFlavorControlCollapsed }"
      title="Route flavors"
    >
      <div class="wrapper">
        <KInputSwitch
          v-model="routeFlavors.traditional"
          class="route-flavor-toggle"
          label="Traditional"
        />
        <KInputSwitch
          v-model="routeFlavors.expressions"
          class="route-flavor-toggle"
          label="Expressions"
        />
      </div>
      <p><b>Note:</b> Use controls above to enable/disable route flavors.</p>
    </KCollapse>
  </KCard>

  <h2>Konnect API</h2>
  <RouteForm
    :config="konnectConfig"
    :route-flavors="routeFlavors"
    :route-id="routeId"
    show-expressions-modal-entry
    @error="onError"
    @update="onUpdate"
  >
    <template #form-actions="{ canSubmit, submit, cancel }">
      <KButton
        appearance="secondary"
        @click="cancel"
      >
        Cancel
      </KButton>
      <KButton
        appearance="primary"
        :disabled="!canSubmit"
        @click="submit"
      >
        Next
      </KButton>
    </template>

    <template #after-expressions-editor="editor">
      This text will appear after the Expressions editor. Editor state: {{ editor.state }}.
    </template>
  </RouteForm>

  <h2>Kong Manager API</h2>
  <RouteForm
    :config="kongManagerConfig"
    :route-flavors="routeFlavors"
    :route-id="routeId"
    show-expressions-modal-entry
    @error="onError"
    @update="onUpdate"
  >
    <template #form-actions="{ canSubmit, submit, cancel }">
      <KButton
        appearance="secondary"
        @click="cancel"
      >
        Cancel
      </KButton>
      <KButton
        appearance="primary"
        :disabled="!canSubmit"
        @click="submit"
      >
        Next
      </KButton>
    </template>

    <template #after-expressions-editor="{ state }">
      This text will appear after the Expressions editor. Editor state: {{ state }}.
    </template>
  </RouteForm>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { AxiosError } from 'axios'
import type { KonnectRouteFormConfig, KongManagerRouteFormConfig, RouteFlavors } from '../../src'
import { RouteForm } from '../../src'

const route = useRoute()
const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const isRouteFlavorControlCollapsed = ref<boolean>(true)
const routeFlavors = reactive<Required<RouteFlavors>>({ traditional: true, expressions: true })
const routeId = computed((): string => route?.params?.id as string || '')

const konnectConfig = ref<KonnectRouteFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  cancelRoute: { name: 'route-list' },
})

const kongManagerConfig = ref<KongManagerRouteFormConfig>({
  app: 'kongManager',
  // Uncomment to test compatibility with different Gateway editions and versions
  // gatewayInfo: {
  //   edition: 'community',
  //   version: '3.3.0',
  // },
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  cancelRoute: { name: 'route-list' },
})

const onError = (error: AxiosError) => {
  console.log(`Error: ${error}`)
}

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'route-list' })
}
</script>

<style lang="scss" scoped>
.sandbox-route-flavor-control {
  :deep(.k-collapse) {
    &.is-collapsed {
      .k-collapse-heading {
        margin-bottom: $kui-space-0 !important;
        align-items: center;
      }

      .k-collapse-title {
        margin-bottom: $kui-space-0 !important;
      }
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column;

    .route-flavor-toggle {
      margin-bottom: $kui-space-50;
    }
  }
}
</style>
