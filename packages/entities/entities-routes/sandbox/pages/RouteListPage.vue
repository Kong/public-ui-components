<template>
  <SandboxPermissionsControl
    @update="handlePermissionsUpdate"
  />

  <KCard class="sandbox-route-list-control">
    <KCollapse
      v-model="isRouteListControlCollapsed"
      :class="{ 'is-collapsed': isRouteListControlCollapsed }"
      title="Route list controls"
    >
      <div class="wrapper">
        <KInputSwitch
          v-model="routeListHasExpressionColumn"
          class="route-list-expressions-column-toggle"
          label="Has &quot;Expression&quot; column"
        />
      </div>
    </KCollapse>
  </KCard>

  <h2>Konnect API</h2>
  <RouteList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="konnectConfig"
    :has-expression-column="routeListHasExpressionColumn"
    title="Routes"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete:success="onDeleteRouteSuccess"
    @error="onError"
  />

  <h2>Kong Manager API</h2>
  <RouteList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    :has-expression-column="routeListHasExpressionColumn"
    title="Routes"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete:success="onDeleteRouteSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import { RouteList } from '../../src'
import type { KonnectRouteListConfig, KongManagerRouteListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectRouteListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api, with leading slash and no trailing slash
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  createRoute: { name: 'create-route' },
  getViewRoute: (id: string) => ({ name: 'view-route', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-route', params: { id } }),
})

const kongManagerConfig = ref<KongManagerRouteListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  createRoute: { name: 'create-route' },
  getViewRoute: (id: string) => ({ name: 'view-route', params: { id } }),
  getEditRoute: (id: string) => ({ name: 'edit-route', params: { id } }),
  filterSchema: {
    name: {
      type: 'text',
    },
    protocols: {
      type: 'text',
    },
    hosts: {
      type: 'text',
    },
    methods: {
      type: 'text',
    },
    paths: {
      type: 'text',
    },
  },
})

// Remount the tables in the sandbox when the permission props change; not needed outside of a sandbox
const key = ref(1)
const permissions = ref<PermissionsActions | null>(null)

const isRouteListControlCollapsed = ref<boolean>(true)
const routeListHasExpressionColumn = ref<boolean>(false)

const handlePermissionsUpdate = (newPermissions: PermissionsActions) => {
  permissions.value = newPermissions
  key.value++
}

const onCopyIdSuccess = (payload: CopyEventPayload) => {
  console.log(payload.message)
}

const onCopyIdError = (payload: CopyEventPayload) => {
  console.error(payload.message)
}

const onDeleteRouteSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}

watch(routeListHasExpressionColumn, () => {
  key.value++
})
</script>

<style lang="scss" scoped>
.sandbox-route-list-control {
  margin-top: $kui-space-80;

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

    .route-list-expressions-column-toggle {
      margin-bottom: $kui-space-50;
    }
  }
}
</style>
