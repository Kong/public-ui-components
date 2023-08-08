<template>
  <KCard class="sandbox-permissions-control">
    <template #body>
      <KCollapse
        v-model="isCollapsed"
        :class="{ 'is-collapsed': isCollapsed }"
        title="Permissions source"
      >
        <div class="wrapper">
          <KInputSwitch
            v-model="canCreate"
            class="permission-toggle"
            label="canCreate"
          />
          <KInputSwitch
            v-model="canDelete"
            class="permission-toggle"
            label="canDelete"
          />
          <KInputSwitch
            v-model="canEdit"
            class="permission-toggle"
            label="canEdit"
          />
          <KInputSwitch
            v-model="canRetrieve"
            class="permission-toggle"
            label="canRetrieve"
          />
        </div>
        <p><b>Note:</b> Use controls above to set permissions. This can produce unrealistic scenarios, such as a user having <em>edit</em> access, but not <em>retrieve</em> access.</p>
      </KCollapse>
    </template>
  </KCard>
</template>

<script lang="ts">
export interface PermissionsActions {
  canCreate: () => Promise<boolean>,
  canDelete: (row: Record<string, any>) => Promise<boolean>,
  canEdit: (row: Record<string, any>) => Promise<boolean>,
  canRetrieve: (row: Record<string, any>) => Promise<boolean>
}
</script>

<script setup lang="ts">
// eslint-disable-next-line import/first
import { ref, watch, onBeforeMount } from 'vue'

const emit = defineEmits(['update'])

const isCollapsed = ref<boolean>(true)

const canCreate = ref<boolean>(true)
const canDelete = ref<boolean>(true)
const canEdit = ref<boolean>(true)
const canRetrieve = ref<boolean>(true)

const permissions = ref({} as PermissionsActions)

watch([canCreate, canDelete, canEdit, canRetrieve], () => {
  permissions.value = {
    canCreate: async () => canCreate.value,
    canDelete: async () => canDelete.value,
    canEdit: async () => canEdit.value,
    canRetrieve: async () => canRetrieve.value,
  } as PermissionsActions
  emit('update', permissions.value)
}, { immediate: true })

onBeforeMount(async () => {
  emit('update', permissions.value)
})
</script>

<style lang="scss" scoped>
.sandbox-permissions-control {
  :deep(.k-collapse) {
    &.is-collapsed {
      .k-collapse-heading {
        margin-bottom: 0 !important;
        align-items: center;
      }

      .k-collapse-title {
        margin-bottom: 0 !important;
      }
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column;

    .permission-toggle {
      margin-bottom: 10px;
    }
  }
}
</style>
