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
          v-model="routeListHideTraditionalColumns"
          class="route-list-traditional-columns-toggle"
          label="Hide traditional columns"
        />
        <KInputSwitch
          v-model="routeListHasExpressionColumn"
          class="route-list-expressions-column-toggle"
          label="Has &quot;Expression&quot; column"
        />
      </div>
    </KCollapse>
  </KCard>

  <h2>Konnect Actions Outside</h2>
  <div id="kong-ui-app-page-header-action-button" />

  <h2>Declarative Config</h2>
  <RouteList
    :key="declarativeKey"
    cache-identifier="declarative"
    :config="declarativeKonnectConfig"
  />

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
    :hide-traditional-columns="routeListHideTraditionalColumns"
    title="Routes"
    use-action-outside
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
    :hide-traditional-columns="routeListHideTraditionalColumns"
    title="Routes"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @delete:success="onDeleteRouteSuccess"
    @error="onError"
  />
</template>

<script setup lang="ts">
import type { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import type { AxiosError } from 'axios'
import { onMounted, reactive, ref, watch } from 'vue'
import type { CopyEventPayload, EntityRow, KongManagerRouteListConfig, KonnectRouteListConfig } from '../../src'
import { RouteList } from '../../src'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const declarativeKonnectConfig = reactive<KonnectRouteListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
  createRoute: { name: 'create-route' },
  getViewRoute: () => ({ }),
  getEditRoute: () => ({ }),
  declarative: {
    config: {
      routes: [],
      services: [],
      listeners: [],
    },
    filterSchema: {
      name: {
        type: 'text',
      },
      matchPath: {
        type: 'text',
      },
    },
    getViewRoute: (name: string) => {
      console.log('getViewRoute called with name:', name)
      return {}
    },
    getEditRoute: (name: string) => {
      console.log('getEditRoute called with name:', name)
      return {}
    },
  },
})

onMounted(() => {
  setTimeout(() => {
    declarativeKonnectConfig.declarative.config = {
      routes: [
        {
          name: 'example-route-1',
          match: {
            path: '/example-1',
          },
          policies: [],
        },
      ],
      services: [],
      listeners: [],
    }
    declarativeKey.value++
  }, 1000)
})

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
const declarativeKey = ref(1)
const permissions = ref<PermissionsActions | null>(null)

const isRouteListControlCollapsed = ref<boolean>(true)
const routeListHideTraditionalColumns = ref<boolean>(false)
const routeListHasExpressionColumn = ref<boolean>(true)

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

watch([routeListHideTraditionalColumns, routeListHasExpressionColumn], () => {
  key.value++
})
</script>

<style lang="scss" scoped>
.sandbox-route-list-control {
  margin-top: $kui-space-80;

  :deep(.k-collapse) {
    &.is-collapsed {
      .k-collapse-heading {
        align-items: center;
        margin-bottom: $kui-space-0 !important;
      }

      .k-collapse-title {
        margin-bottom: $kui-space-0 !important;
      }
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column;

    .route-list-traditional-columns-toggle, .route-list-expressions-column-toggle {
      margin-bottom: $kui-space-50;
    }
  }
}
</style>
