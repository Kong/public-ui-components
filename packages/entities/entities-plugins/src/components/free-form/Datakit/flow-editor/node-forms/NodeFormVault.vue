<template>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../store/store'
import { useVaultForm } from '../composables/useVaultForm'
import Form from '../../../shared/Form.vue'
import VaultField from './VaultField.vue'

import type { FieldName } from '../../types'
import type { RecordFieldSchema } from '../../../../../types/plugins/form-schema'

const { nodeMapByName } = useEditorStore()

const vaultConfig = computed(() => nodeMapByName.value.get('vault')?.config || {})
const formData = computed(() => {
  return {
    vault: { ...vaultConfig.value },
  }
})

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
} = useVaultForm()

function handleUpdateVault(name: FieldName, value: string, oldName?: FieldName) {
  if (oldName && oldName !== name) {
    renameVault(oldName, name, false)
  }
  updateVault(name, value)
}
</script>

