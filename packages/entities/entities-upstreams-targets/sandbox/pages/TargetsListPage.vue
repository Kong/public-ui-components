<template>
  <SandboxPermissionsControl
    :create-krn="patPermissions.create"
    :delete-krn="patPermissions.delete"
    :edit-krn="patPermissions.edit"
    @update="handlePermissionsUpdate"
  />
  <h2>Konnect API</h2>
  <TargetsList
    v-if="permissions"
    :key="key"
    cache-identifier="konnect"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="konnectConfig"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @create:target="onCreateTargetSuccess"
    @delete:success="onDeleteSuccess"
    @error="onError"
    @update:target="onUpdateTargetSuccess"
  >
    <template #form-info>
      A target is an ip address/hostname with a port that identifies an instance of a backend service.
      <KExternalLink href="https://docs.konghq.com/enterprise/latest/admin-api/#target-object">
        Learn More
      </KExternalLink>
    </template>
  </TargetsList>

  <h2>Kong Manager API</h2>
  <TargetsList
    v-if="permissions"
    :key="key"
    cache-identifier="kong-manager"
    :can-create="permissions.canCreate"
    :can-delete="permissions.canDelete"
    :can-edit="permissions.canEdit"
    :can-retrieve="permissions.canRetrieve"
    :config="kongManagerConfig"
    @copy:error="onCopyIdError"
    @copy:success="onCopyIdSuccess"
    @create:target="onCreateTargetSuccess"
    @delete:success="onDeleteSuccess"
    @error="onError"
    @health-actions:healthy="onHealthActions"
    @health-actions:unhealthy="onHealthActions"
    @update:target="onUpdateTargetSuccess"
  >
    <template #form-info>
      A target is an ip address/hostname with a port that identifies an instance of a backend service.
      <KExternalLink href="https://docs.konghq.com/enterprise/latest/admin-api/#target-object">
        Learn More
      </KExternalLink>
    </template>
  </TargetsList>
</template>

<script setup lang="ts">
import { TargetsList } from '../../src'
import { ref } from 'vue'
import type { KonnectTargetsListConfig, KongManagerTargetsListConfig, EntityRow, CopyEventPayload } from '../../src'
import type { AxiosError } from 'axios'
import SandboxPermissionsControl, { PermissionsActions } from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''
const upstreamId = route.params.id as string

const konnectConfig = ref<KonnectTargetsListConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api/konnect-api`, with leading slash and no trailing slash
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  upstreamId,
  // createRoute: { name: 'create-target' },
})

const kongManagerConfig = ref<KongManagerTargetsListConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  isExactMatch: false,
  upstreamId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canMarkHealthy: (row: EntityRow) => true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canMarkUnhealthy: (row: EntityRow) => true,
  // createRoute: { name: 'create-target' },
})

const patPermissions = {
  create: { service: 'konnect', action: '#create', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/${upstreamId}/targets/*` },
  delete: { service: 'konnect', action: '#delete', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/${upstreamId}/targets/*` },
  edit: { service: 'konnect', action: '#edit', resourcePath: `runtimegroups/${controlPlaneId}/upstreams/${upstreamId}/targets/*` },
}
// Remount the tables in the sandbox when the permission props change AND when target is created
const key = ref(1)
const permissions = ref<PermissionsActions | null>(null)

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

const onDeleteSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully deleted`)
}

const onError = (error: AxiosError) => {
  console.error(`Error: ${error}`)
}

const onHealthActions = (row: EntityRow) => {
  console.log(`${row.id} health actions`)
}

const onUpdateTargetSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully updated`)
}

const onCreateTargetSuccess = (row: EntityRow) => {
  console.log(`${row.id} successfully created`)
}
</script>
