<template>
  <div class="dk-resources-panel">
    <Form
      :data="formData"
      :schema="vaultSchema"
    >
      <VaultField
        name="vault"
        @add="addVault"
        @remove="removeVault"
        @update="handleUpdateVault"
      />
    </Form>
  </div>
</template>

<script setup lang="ts">
import { useVaultForm } from '../composables/useVaultForm'
import Form from '../../../shared/Form.vue'
import VaultField from './VaultField.vue'

import type { FieldName } from '../../types'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'

const vaultSchema: RecordFieldSchema = {
  type: 'record',
  fields: [
    {
      vault: {
        type: 'map',
        keys: { type: 'string' },
        values: { type: 'string' },
      },
    },
  ],
}

const {
  addVault,
  removeVault,
  updateVault,
  renameVault,
  formData,
} = useVaultForm()

function handleUpdateVault(name: FieldName, value: string, oldName?: FieldName) {
  if (oldName && oldName !== name) {
    renameVault(oldName, name, false)
  }
  updateVault(name, value)
}
</script>

<style lang="scss" scoped>
.dk-resources-panel {
  padding: $kui-space-60 0;

  :deep(.title) {
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-bold;
    gap: $kui-space-40;
    line-height: $kui-line-height-30;
    margin: 0;
  }
}
</style>
